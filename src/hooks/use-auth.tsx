"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type Profile = { username?: string, favorite_team?: string, avatar_url?: string, points?: number, is_admin?: boolean };

type AuthContextType = {
    user: User | null;
    profile: Profile | null;
    loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const fetchSessionAndProfile = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const currentUser = session?.user ?? null;
                if (!mounted) return;
                setUser(currentUser);

                if (currentUser) {
                    const { data, error } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
                    if (mounted) {
                        if (error) console.error("Error fetching profile:", error);
                        setProfile(data || null);
                    }
                }
            } catch (err) {
                console.error("Auth initialization error:", err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchSessionAndProfile();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            try {
                const currentUser = session?.user ?? null;
                setUser(currentUser);
                if (currentUser) {
                    const { data, error } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
                    if (error) console.error("Auth state change profile error:", error);
                    setProfile(data || null);
                } else {
                    setProfile(null);
                }
            } catch (err) {
                console.error("Auth state change error:", err);
            } finally {
                setLoading(false);
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, profile, loading }
        }>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
