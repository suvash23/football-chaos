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
                // Use getUser() to verify the session with the server, rather than just getSession()
                const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();

                if (userError) {
                    // If there's an error getting the user (e.g. invalid session), we should clear it
                    console.log("Session invalid or expired, clearing storage:", userError.message);
                    await supabase.auth.signOut();
                    if (mounted) {
                        setUser(null);
                        setProfile(null);
                    }
                } else if (currentUser) {
                    if (!mounted) return;
                    setUser(currentUser);

                    const { data, error } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', currentUser.id)
                        .maybeSingle();

                    if (mounted) {
                        if (error) console.error("Error fetching profile:", error);
                        setProfile(data || null);
                    }
                }
            } catch (err) {
                console.error("Auth initialization error:", err);
                if (mounted) {
                    setUser(null);
                    setProfile(null);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchSessionAndProfile();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`Auth event: ${event}`);

            const currentUser = session?.user ?? null;

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
                setUser(currentUser);
                if (currentUser) {
                    const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).maybeSingle();
                    setProfile(data || null);
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setProfile(null);
            } else if (event === 'INITIAL_SESSION') {
                // Already handled by fetchSessionAndProfile, but stay in sync
                if (!currentUser) {
                    setUser(null);
                    setProfile(null);
                }
            }

            setLoading(false);
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
