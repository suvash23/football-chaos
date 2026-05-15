"use client";

import { MOCK_LEADERBOARD } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Trophy, Medal, Crown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function LeaderboardPage() {
    // Sort leaderboard just in case
    const sortedLeaderboard = [...MOCK_LEADERBOARD].sort((a, b) => b.points - a.points);

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0: return <Crown className="w-6 h-6 text-yellow-500" />;
            case 1: return <Medal className="w-6 h-6 text-gray-400" />;
            case 2: return <Medal className="w-6 h-6 text-amber-700" />;
            default: return <span className="font-bold text-muted-foreground w-6 text-center">{index + 1}</span>;
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <div className="flex flex-col items-center justify-center text-center space-y-4 mb-8">
                <div className="p-3 w-16 h-16 rounded-2xl bg-purple-500/20 text-purple-500 flex items-center justify-center mb-2">
                    <Trophy className="w-8 h-8" />
                </div>
                <h1 className="text-4xl font-black italic tracking-tight uppercase">Fan Rankings</h1>
                <p className="text-muted-foreground text-lg max-w-2xl">
                    The ultimate proof of ball knowledge. Predict correctly to climb from casual observer to Football Prophet.
                </p>
            </div>

            <Card className="w-full bg-card/50 backdrop-blur shadow-2xl border-border/50 overflow-hidden">
                <CardHeader className="bg-muted/30 border-b">
                    <CardTitle>Global Top 50</CardTitle>
                    <CardDescription>Current standings for this matchweek.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-border">
                        {sortedLeaderboard.map((user, index) => (
                            <div
                                key={user.id}
                                className={`flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors ${index < 3 ? 'bg-primary/5' : ''}`}
                            >
                                <div className="flex items-center justify-center w-8">
                                    {getRankIcon(index)}
                                </div>

                                <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                                    <AvatarFallback className="bg-muted text-xl">{user.avatar}</AvatarFallback>
                                </Avatar>

                                <div className="flex flex-col flex-1">
                                    <span className="font-bold text-lg leading-none">{user.username}</span>
                                    <span className="text-sm text-muted-foreground mt-1">{user.title}</span>
                                </div>

                                <div className="flex flex-col items-end gap-1">
                                    <Badge variant="secondary" className="px-3 py-1 text-sm font-bold bg-background">
                                        {user.points} pts
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <div className="mt-8 text-center text-sm text-muted-foreground">
                Authentication via Supabase coming soon to claim your spot!
            </div>
        </div>
    );
}
