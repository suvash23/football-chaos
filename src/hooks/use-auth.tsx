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

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`Auth event: ${event}`);

            const currentUser = session?.user ?? null;

            // For INITIAL_SESSION, SIGNED_IN, TOKEN_REFRESHED, USER_UPDATED
            if (currentUser) {
                setUser(currentUser);
                const { data, error } = await supabase.from('profiles').select('*').eq('id', currentUser.id).maybeSingle();
                if (mounted) {
                    if (error) console.error("Error fetching profile:", error);
                    setProfile(data || null);
                    setLoading(false);
                }
            } else {
                // SIGNED_OUT or INITIAL_SESSION with no user
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
