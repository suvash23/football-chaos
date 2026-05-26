"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Trophy } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import teamsMetaRaw from '@/lib/teams_meta.json';

type Goal = {
    name: string;
    minute: number;
    penalty?: boolean;
    owngoal?: boolean;
};

type Match = {
    round: string;
    date: string;
    team1: string;
    team2: string;
    score?: { ft?: [number, number], p?: [number, number], et?: [number, number] };
    goals1?: Goal[];
    goals2?: Goal[];
    ground?: string;
    group?: string;
};

type WorldCupData = {
    name: string;
    matches: Match[];
};

const YEARS = ["2022", "2018", "2014", "2010", "2006", "2002", "1998", "1994", "1990", "1986", "1982", "1978", "1974", "1970", "1966", "1962", "1958", "1954", "1950", "1938", "1934", "1930"];

const getFlag = (teamName: string) => {
    const historicalFlags: Record<string, string> = {
        "Italy": "🇮🇹", "Chile": "🇨🇱", "Peru": "🇵🇪", "Hungary": "🇭🇺",
        "Romania": "🇷🇴", "Russia": "🇷🇺", "Soviet Union": "🟥",
        "Yugoslavia": "🟦", "West Germany": "🇩🇪", "East Germany": "🇩🇪",
        "Czechoslovakia": "🇨🇿", "Bolivia": "🇧🇴", "Bulgaria": "🇧🇬",
        "Cameroon": "🇨🇲", "Nigeria": "🇳🇬", "Greece": "🇬🇷", "Ireland": "🇮🇪",
        "Northern Ireland": "🇬🇧", "Wales": "🏴󠁧󠁢󠁷󠁬󠁳󠁿", "Serbia": "🇷🇸"
    };
    if (historicalFlags[teamName]) return historicalFlags[teamName];
    // @ts-ignore
    const team = teamsMetaRaw.find(t => t.name === teamName || t.name_normalised === teamName);
    return team?.flag_icon || "🛡️";
};

const MatchBadge = ({ team, score, isWinner }: { team: string, score: number | string, isWinner?: boolean }) => (
    <div className={`flex items-center justify-between p-1.5 hover:bg-muted/50 rounded-md transition-colors ${isWinner ? 'text-primary' : ''}`}>
        <div className="flex items-center gap-2">
            <span className="text-lg opacity-80">{getFlag(team)}</span>
            <span className={`text-xs truncate max-w-[120px] ${isWinner ? 'font-bold' : 'font-semibold text-foreground/80'}`}>{team || "TBA"}</span>
        </div>
        <span className={`font-black text-sm bg-secondary/50 px-2 py-0.5 rounded-md min-w-[24px] text-center ${isWinner ? 'bg-primary/20 text-primary' : ''}`}>
            {score !== undefined ? score : "-"}
        </span>
    </div>
);

export default function HistoryPage() {
    const [year, setYear] = useState("2022");
    const [data, setData] = useState<WorldCupData | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<string>("All");

    useEffect(() => {
        setLoading(true);
        fetch(`/data/worldcups/${year}.json`)
            .then(r => r.json())
            .then(d => {
                setData(d);
                setLoading(false);
                setSelectedGroup("All");
            })
            .catch(e => {
                console.error(e);
                setLoading(false);
            });
    }, [year]);

    if (!data && !loading) return null;

    const groupMatches = data?.matches?.filter(m => m.round.includes("Matchday") || m.round.includes("Group") || m.round.includes("Round 1"));
    const ro16 = data?.matches?.filter(m => m.round.includes("Round of 16") || m.round.includes("Eighth"));
    const quarter = data?.matches?.filter(m => m.round.includes("Quarter"));
    const semi = data?.matches?.filter(m => m.round.includes("Semi"));
    const final = data?.matches?.filter(m => m.round === "Final");

    const groupNames = Array.from(new Set(groupMatches?.map(m => m.group).filter(Boolean))).sort() as string[];
    const visibleGroups = (selectedGroup === "All" ? groupMatches : groupMatches?.filter(m => m.group === selectedGroup))
        ?.slice()
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const renderMatchKnockout = (m: Match, i: number) => {
        const t1Score = m.score?.ft?.[0] ?? "-";
        const t2Score = m.score?.ft?.[1] ?? "-";
        const pt1Score = m.score?.p?.[0] ?? 0;
        const pt2Score = m.score?.p?.[1] ?? 0;

        let t1Wins = false;
        let t2Wins = false;

        if (m.score?.ft?.[0] !== undefined && m.score?.ft?.[1] !== undefined) {
            if (m.score.ft[0] > m.score.ft[1]) t1Wins = true;
            if (m.score.ft[1] > m.score.ft[0]) t2Wins = true;
            if (m.score.ft[0] === m.score.ft[1]) {
                if (pt1Score > pt2Score) t1Wins = true;
                if (pt2Score > pt1Score) t2Wins = true;
            }
        }

        return (
            <Card key={i} className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-all duration-300 bg-card/80 backdrop-blur group relative">
                <div className="p-2">
                    <div className="text-[10px] text-muted-foreground font-semibold flex justify-between mb-1.5 pb-1.5 border-b border-border/50">
                        <span>{m.date}</span>
                        <span className="truncate max-w-[90px] text-right" title={m.ground}>{m.ground?.split(',')[0] || "TBD"}</span>
                    </div>
                    <div className="space-y-0.5">
                        <MatchBadge team={m.team1} score={t1Score} isWinner={t1Wins} />
                        <MatchBadge team={m.team2} score={t2Score} isWinner={t2Wins} />
                    </div>
                    {m.score?.p && (
                        <div className="text-[9px] text-center text-primary mt-1.5 font-bold uppercase tracking-wider">
                            Penalties: {m.score.p[0]} - {m.score.p[1]}
                        </div>
                    )}
                </div>
            </Card>
        );
    };

    const renderMatchGroup = (m: Match, i: number) => {
        return (
            <Card key={i} className="mb-4 bg-card/60 backdrop-blur border-primary/20 hover:border-primary/50 transition-all group overflow-hidden">
                <div className="p-4 relative">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] sm:text-xs text-muted-foreground font-semibold flex items-center gap-1"><Calendar className="w-3 h-3" /> {m.date}</span>
                        {m.group && <span className="text-[10px] text-primary font-bold px-2 py-0.5 bg-primary/10 rounded-full">{m.group}</span>}
                    </div>

                    <div className="flex flex-col space-y-3">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col flex-1 truncate pr-2">
                                <span className="font-bold text-sm sm:text-base flex items-center gap-1.5"><span className="text-lg opacity-80">{getFlag(m.team1)}</span> {m.team1 || "TBA"}</span>
                                {m.goals1 && m.goals1.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {m.goals1.map((g, gi) => (
                                            <span key={gi} className="text-[9px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                ⚽ {g.name} {g.minute}'{g.penalty ? '(P)' : ''}{g.owngoal ? '(OG)' : ''}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <span className="text-lg sm:text-xl font-black bg-muted/50 px-3 py-1 rounded shrink-0">{m.score?.ft?.[0] ?? "-"}</span>
                        </div>

                        <div className="flex justify-between items-start">
                            <div className="flex flex-col flex-1 truncate pr-2">
                                <span className="font-bold text-sm sm:text-base flex items-center gap-1.5"><span className="text-lg opacity-80">{getFlag(m.team2)}</span> {m.team2 || "TBA"}</span>
                                {m.goals2 && m.goals2.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {m.goals2.map((g, gi) => (
                                            <span key={gi} className="text-[9px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                                ⚽ {g.name} {g.minute}'{g.penalty ? '(P)' : ''}{g.owngoal ? '(OG)' : ''}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <span className="text-lg sm:text-xl font-black bg-muted/50 px-3 py-1 rounded shrink-0">{m.score?.ft?.[1] ?? "-"}</span>
                        </div>
                    </div>
                </div>
            </Card>
        );
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl flex-1 flex flex-col items-center overflow-hidden">
            <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tight mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent text-center">
                World Cup History
            </h1>

            <div className="w-full max-w-sm mb-6">
                <Select value={year} onValueChange={setYear}>
                    <SelectTrigger className="w-full h-14 text-xl font-bold bg-background/50 backdrop-blur rounded-2xl border-2 border-primary/30">
                        <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                    <SelectContent>
                        {YEARS.map(y => (
                            <SelectItem key={y} value={y} className="text-lg font-bold">{y} World Cup</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {loading ? (
                <div className="animate-pulse flex flex-col items-center gap-4 mt-8">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-xl font-bold text-muted-foreground">Loading {year} Data...</p>
                </div>
            ) : (
                <div className="w-full flex-1 animate-in fade-in slide-in-from-bottom-8 duration-500 flex flex-col items-center pb-12">
                    <Tabs defaultValue={ro16?.length ? "knockout" : "groups"} className="w-full flex flex-col items-center">
                        <TabsList className="inline-flex flex-wrap justify-center gap-3 mb-10 bg-transparent p-0 border-none h-auto">
                            <TabsTrigger value="knockout" className="rounded-full px-6 py-2.5 text-sm font-black uppercase tracking-wider border-2 border-primary/20 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 transition-all hover:bg-primary/10">Knockout Stage</TabsTrigger>
                            <TabsTrigger value="groups" className="rounded-full px-6 py-2.5 text-sm font-black uppercase tracking-wider border-2 border-primary/20 data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/30 transition-all hover:bg-primary/10">Group Stage</TabsTrigger>
                        </TabsList>

                        <TabsContent value="knockout" className="w-full">
                            {(!ro16?.length && !quarter?.length && !semi?.length) ? (
                                <div className="text-center text-muted-foreground py-12 text-xl font-bold">No standard knockout format found for {year}.</div>
                            ) : (
                                <ScrollArea className="w-full pb-8">
                                    <div className="flex gap-6 min-w-max px-2 md:px-4 items-stretch">
                                        {/* Round of 16 */}
                                        {ro16 && ro16.length > 0 && (
                                            <div className="flex flex-col w-[260px] shrink-0 gap-4">
                                                <h2 className="text-sm font-bold py-1.5 px-3 rounded-lg text-center uppercase tracking-widest sticky top-0 z-10 backdrop-blur border border-border/50 bg-secondary/50">Round of 16</h2>
                                                <div className="flex flex-col justify-around flex-1 gap-3">
                                                    {ro16.map((m, i) => renderMatchKnockout(m, i))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Quarter */}
                                        {quarter && quarter.length > 0 && (
                                            <div className="flex flex-col w-[260px] shrink-0 gap-4">
                                                <h2 className="text-sm font-bold py-1.5 px-3 rounded-lg text-center uppercase tracking-widest sticky top-0 z-10 backdrop-blur border border-border/50 bg-secondary/50">Quarter Final</h2>
                                                <div className="flex flex-col justify-around flex-1 gap-3">
                                                    {quarter.map((m, i) => renderMatchKnockout(m, i))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Semi */}
                                        {semi && semi.length > 0 && (
                                            <div className="flex flex-col w-[260px] shrink-0 gap-4">
                                                <h2 className="text-sm font-bold py-1.5 px-3 rounded-lg text-center uppercase tracking-widest sticky top-0 z-10 backdrop-blur border border-border/50 bg-secondary/50">Semi Final</h2>
                                                <div className="flex flex-col justify-around flex-1 gap-3">
                                                    {semi.map((m, i) => renderMatchKnockout(m, i))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Final */}
                                        {final && final.length > 0 && (
                                            <div className="flex flex-col w-[260px] shrink-0 gap-4">
                                                <h2 className="text-sm font-bold py-1.5 px-3 rounded-lg text-center uppercase tracking-widest sticky top-0 z-10 backdrop-blur border border-border/50 bg-primary/20 text-primary">Final <Trophy className="w-4 h-4 ml-1 inline" /></h2>
                                                <div className="flex flex-col justify-center flex-1 gap-3">
                                                    {final.map((m, i) => renderMatchKnockout(m, i))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <ScrollBar orientation="horizontal" className="h-3" />
                                </ScrollArea>
                            )}
                        </TabsContent>

                        <TabsContent value="groups" className="w-full">
                            {(!groupMatches?.length) ? (
                                <div className="text-center text-muted-foreground py-12 text-xl font-bold">No group stage data found or different format used.</div>
                            ) : (
                                <div className="w-full">
                                    {groupNames.length > 0 && (
                                        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide px-2 justify-center">
                                            <Button
                                                variant={selectedGroup === "All" ? "default" : "secondary"}
                                                onClick={() => setSelectedGroup("All")}
                                                className="font-bold whitespace-nowrap text-xs h-8 rounded-full"
                                            >
                                                All Groups
                                            </Button>
                                            {groupNames.map(g => (
                                                <Button
                                                    key={g}
                                                    variant={selectedGroup === g ? "default" : "secondary"}
                                                    onClick={() => setSelectedGroup(g)}
                                                    className="font-bold whitespace-nowrap text-xs h-8 rounded-full"
                                                >
                                                    {g}
                                                </Button>
                                            ))}
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 px-2">
                                        {visibleGroups?.map((m, i) => renderMatchGroup(m, i))}
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </div>
    );
}
