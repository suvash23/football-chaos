"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { TEAMS } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Loader2, LogOut, User as UserIcon, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [username, setUsername] = useState("");
    const [favoriteTeam, setFavoriteTeam] = useState("");
    const [points, setPoints] = useState(0);
    const [openTeam, setOpenTeam] = useState(false);

    const sortedTeams = [...TEAMS].sort((a, b) => a.name.localeCompare(b.name));

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth');
            return;
        }

        async function fetchProfile() {
            if (!user) return;
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error) throw error;

                if (data) {
                    setUsername(data.username || "");
                    setFavoriteTeam(data.favorite_team || "");
                    setPoints(data.points || 0);
                }
            } catch (error: unknown) {
                console.error("Failed to load profile:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchProfile();
    }, [user, authLoading, router]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) return;
        setSaving(true);

        try {
            const flag = TEAMS.find(t => t.name === favoriteTeam)?.flag_icon || "⚽";
            const { error } = await supabase
                .from('profiles')
                .update({
                    username,
                    favorite_team: favoriteTeam,
                    avatar_url: flag
                })
                .eq('id', user.id);

            if (error) throw error;
            toast.success("Profile updated successfully!");
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : "Failed to save profile");
        } finally {
            setSaving(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    if (authLoading || loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 pt-8 pb-32 max-w-lg">
            <Card className="bg-card/50 backdrop-blur shadow-xl border-border/50">
                <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                        <CardTitle className="text-3xl font-black italic uppercase flex items-center gap-3">
                            <UserIcon className="h-8 w-8" />
                            Your Profile
                        </CardTitle>
                        <div className="bg-secondary px-4 py-2 rounded-lg font-bold text-lg text-yellow-500">
                            {points} pts
                        </div>
                    </div>
                    <CardDescription className="text-md">
                        Update your manager persona and officially select your team.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSave}>
                    <CardContent className="space-y-6 pb-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Manager Username</Label>
                            <Input
                                id="username"
                                placeholder="GegenpressMaster"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Favorite Team</Label>
                            <Popover open={openTeam} onOpenChange={setOpenTeam}>
                                <PopoverTrigger
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {favoriteTeam
                                        ? sortedTeams.find((team) => team.name === favoriteTeam)?.name
                                        : "Select a team to blindly support..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Search team..." />
                                        <CommandList>
                                            <CommandEmpty>No team found.</CommandEmpty>
                                            <CommandGroup>
                                                {sortedTeams.map((team) => (
                                                    <CommandItem
                                                        key={team.name}
                                                        value={team.name}
                                                        onSelect={(currentValue) => {
                                                            const actualValue = sortedTeams.find(t => t.name.toLowerCase() === currentValue.toLowerCase())?.name || currentValue;
                                                            setFavoriteTeam(actualValue === favoriteTeam ? "" : actualValue);
                                                            setOpenTeam(false);
                                                        }}
                                                    >
                                                        <span className="mr-2">{team.flag_icon}</span>
                                                        {team.name}
                                                        <Check
                                                            className={cn(
                                                                "ml-auto h-4 w-4",
                                                                favoriteTeam === team.name ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <p className="text-xs text-muted-foreground mt-1">If they do miserably, we will mock you.</p>
                        </div>
                        <div className="space-y-2 pt-4">
                            <Label>Email Account</Label>
                            <Input disabled value={user?.email || "Unknown"} className="opacity-50" />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t border-border/50 pt-6">
                        <Button type="button" variant="outline" onClick={handleSignOut} className="text-red-500 border-red-500/20 hover:bg-red-500/10">
                            <LogOut className="mr-2 h-4 w-4" /> Sign Out
                        </Button>
                        <Button type="submit" className="font-bold min-w-[120px]" disabled={saving}>
                            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Profile"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
