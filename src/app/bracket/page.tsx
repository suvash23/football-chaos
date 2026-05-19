"use client";

import { useState, useEffect } from "react";
import { fetchMatches, type Match } from "@/lib/data";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const ROUNDS_ORDER = [
    "Round of 32",
    "Round of 16",
    "Quarter-final",
    "Semi-final",
    "Final",
];

const MatchBadge = ({ team, flag, score }: { team: string, flag: string, score: number | null }) => (
    <div className="flex items-center justify-between p-1.5 hover:bg-muted/50 rounded-md transition-colors">
        <div className="flex items-center gap-2">
            <span className="text-lg">{flag}</span>
            <span className="font-semibold text-xs truncate max-w-[120px]">{team}</span>
        </div>
        <span className="font-black text-sm bg-secondary/50 px-2 py-0.5 rounded-md min-w-[24px] text-center">
            {score !== null ? score : "-"}
        </span>
    </div>
);

export default function BracketPage() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeRound, setActiveRound] = useState<string>("All");

    useEffect(() => {
        async function load() {
            const data = await fetchMatches();
            setMatches(data);
            setIsLoading(false);
        }
        load();
    }, []);

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Filter to only knockout rounds and sort them
    const knocouts = matches.filter(m => ROUNDS_ORDER.includes(m.round) || m.round === "Match for third place");

    // Group by round
    const rounds: Record<string, Match[]> = {};
    ROUNDS_ORDER.forEach(r => rounds[r] = []);

    knocouts.forEach(m => {
        if (m.round === "Match for third place") {
            rounds["Final"].push(m);
        } else if (rounds[m.round]) {
            rounds[m.round].push(m);
        }
    });

    Object.keys(rounds).forEach(r => {
        rounds[r].sort((a, b) => new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime());
    });

    const visibleRounds = activeRound === "All" ? ROUNDS_ORDER : [activeRound];

    return (
        <div className="container mx-auto px-4 py-8 max-w-full">
            <div className="mb-6">
                <h1 className="text-4xl font-black italic uppercase tracking-wider mb-2">Tournament Bracket</h1>
                <p className="text-muted-foreground text-sm">The glorious path to eternal glory (or immense heartbreak).</p>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
                <Button
                    variant={activeRound === "All" ? "default" : "secondary"}
                    onClick={() => setActiveRound("All")}
                    className="font-bold whitespace-nowrap text-xs h-8"
                >
                    Full Bracket
                </Button>
                {ROUNDS_ORDER.map(roundName => (
                    <Button
                        key={roundName}
                        variant={activeRound === roundName ? "default" : "secondary"}
                        onClick={() => setActiveRound(roundName)}
                        className="font-bold whitespace-nowrap text-xs h-8"
                    >
                        {roundName}
                    </Button>
                ))}
            </div>

            <div className="w-full overflow-x-auto pb-8 snap-x">
                <div className={`flex gap-6 min-w-max items-stretch ${activeRound !== "All" ? "flex-wrap justify-center overflow-auto items-start" : ""}`}>
                    {visibleRounds.map((roundName, index) => (
                        <div key={roundName} className={`flex flex-col gap-4 ${activeRound === "All" ? "w-[220px] snap-center" : "w-[260px]"}`}>
                            <h2
                                className={`text-sm font-bold py-1.5 px-3 rounded-lg text-center uppercase tracking-widest sticky top-0 z-10 backdrop-blur border border-border/50 cursor-pointer transition-colors ${activeRound === roundName ? 'bg-primary text-primary-foreground hover:bg-primary/80' : 'bg-secondary/50 hover:bg-secondary/80'}`}
                                onClick={() => setActiveRound(activeRound === roundName ? "All" : roundName)}
                            >
                                {roundName}
                            </h2>
                            <div className={`flex flex-col flex-1 gap-3 ${activeRound === "All" ? "justify-around" : "justify-start"}`}>
                                {rounds[roundName].map((match) => (
                                    <Card key={match.id} className="overflow-hidden border-border/50 shadow-md hover:shadow-xl transition-all duration-300 bg-card/80 backdrop-blur group relative">

                                        {activeRound === "All" && index < ROUNDS_ORDER.length - 1 && (
                                            <div className="hidden absolute top-1/2 -right-6 w-6 h-px bg-border group-hover:bg-primary z-[-1] transition-colors" />
                                        )}
                                        {activeRound === "All" && index > 0 && (
                                            <div className="hidden absolute top-1/2 -left-6 w-6 h-px bg-border group-hover:bg-primary z-[-1] transition-colors" />
                                        )}

                                        <div className="p-2">
                                            <div className="text-[10px] text-muted-foreground font-semibold flex justify-between mb-1.5 pb-1.5 border-b border-border/50">
                                                <span>{format(new Date(match.kickoff_time), "MMM d HH:mm")}</span>
                                                <span className="truncate max-w-[90px] text-right" title={match.stadium}>{match.stadium?.split(' (')[0] || "TBD"}</span>
                                            </div>
                                            <div className="space-y-0.5">
                                                <MatchBadge team={match.home_team} flag={match.home_flag} score={match.home_score} />
                                                <MatchBadge team={match.away_team} flag={match.away_flag} score={match.away_score} />
                                            </div>
                                            {match.round === "Match for third place" && (
                                                <div className="text-[9px] text-center text-primary mt-1.5 font-bold uppercase tracking-wider">
                                                    Third Place Playoff
                                                </div>
                                            )}
                                        </div>
                                    </Card>
                                ))}
                                {rounds[roundName].length === 0 && (
                                    <div className="text-center text-muted-foreground mt-4 text-xs italic">
                                        Matches TBD
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
