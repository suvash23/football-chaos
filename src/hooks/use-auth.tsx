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

        async function initAuth() {
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                if (sessionError) throw sessionError;

                if (session?.user) {
                    const currentUser = session.user;
                    if (mounted) setUser(currentUser);

                    const { data: profileData, error: profileError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', currentUser.id)
                        .maybeSingle();

                    if (mounted) {
                        if (profileError) console.error("Error fetching profile:", profileError);
                        setProfile(profileData || null);
                    }
                }
            } catch (err) {
                console.error("Auth init error:", err);
                if (mounted) {
                    setUser(null);
                    setProfile(null);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        }

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`Auth event: ${event}`);
            const currentUser = session?.user ?? null;

            if (currentUser) {
                setUser(currentUser);
                const { data, error } = await supabase.from('profiles').select('*').eq('id', currentUser.id).maybeSingle();
                if (mounted) {
                    if (error) console.error("Error fetching profile:", error);
                    setProfile(data || null);
                    setLoading(false);
                }
            } else {
                if (mounted) {
                    setUser(null);
                    setProfile(null);
                    setLoading(false);
                }
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
