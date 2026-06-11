import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, Medal, Crown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Flag } from "@/components/flag";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type LeaderboardUser = {
    id: string;
    username: string;
    avatar_url: string | null;
    favorite_team: string | null;
    points: number;
};

const getRankIcon = (index: number) => {
    switch (index) {
        case 0: return <Crown className="w-6 h-6 text-yellow-500" />;
        case 1: return <Medal className="w-6 h-6 text-gray-400" />;
        case 2: return <Medal className="w-6 h-6 text-amber-700" />;
        default: return <span className="font-bold text-muted-foreground w-6 text-center">{index + 1}</span>;
    }
};

const getTitle = (points: number, favoriteTeam: string | null) => {
    if (points > 100) return "Football Prophet";
    if (points > 50) return "Armchair Manager";
    if (points > 20) return "Tactical Genius";
    if (points > 0) return "Casual Observer";
    return favoriteTeam ? `Fan of ${favoriteTeam}` : "Newcomer";
};

export default async function LeaderboardPage() {
    const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, favorite_team, points")
        .order("points", { ascending: false })
        .limit(50);

    const leaderboard: LeaderboardUser[] = (!error && data) ? data : [];

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <div className="flex flex-col items-center justify-center text-center space-y-4 mb-8">
                <div className="p-3 w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-2">
                    <Trophy className="w-8 h-8" />
                </div>
                <h1 className="text-4xl font-black italic tracking-tight uppercase">Fan Rankings</h1>
                <p className="text-muted-foreground text-lg max-w-2xl">
                    The ultimate proof of ball knowledge. Predict correctly to climb from newcomer to Football Prophet.
                </p>
            </div>

            <Card className="w-full bg-card/50 backdrop-blur shadow-2xl border-border/50 overflow-hidden">
                <CardHeader className="bg-muted/30 border-b">
                    <CardTitle>Global Top 50</CardTitle>
                    <CardDescription>Current standings for this matchweek.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {leaderboard.length === 0 ? (
                        <div className="text-center p-12 text-muted-foreground">
                            No rankings yet. Start predicting to climb the leaderboard!
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            {leaderboard.map((user, index) => (
                                <div
                                    key={user.id}
                                    className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${index < 3 ? 'bg-primary/5' : ''}`}
                                >
                                    <div className="flex items-center justify-center w-8 shrink-0">
                                        {getRankIcon(index)}
                                    </div>

                                    <Avatar className="h-12 w-12 border-2 border-background shadow-sm bg-secondary shrink-0">
                                        <AvatarFallback className="bg-secondary text-xl border-none">
                                            <Flag emoji={user.avatar_url || "⚽"} size={32} />
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className="font-bold text-lg leading-none truncate">{user.username}</span>
                                        <span className="text-sm text-muted-foreground mt-1 truncate">
                                            {getTitle(user.points, user.favorite_team)}
                                        </span>
                                    </div>

                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                        <Badge variant="secondary" className="px-3 py-1 text-sm font-bold bg-background text-primary border border-border">
                                            {user.points} pts
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
