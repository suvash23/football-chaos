"use client";

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<{ username?: string, favorite_team?: string, avatar_url?: string, points?: number, is_admin?: boolean } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSessionAndProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
                setProfile(data);
            }
            setLoading(false);
        };

        fetchSessionAndProfile();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
                setProfile(data);
            } else {
                setProfile(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    return { user, profile, loading };
}
