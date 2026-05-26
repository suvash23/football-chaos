"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Trophy, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Match = {
    round: string;
    date: string;
    team1: string;
    team2: string;
    score?: { ft?: [number, number], p?: [number, number] };
    ground?: string;
};

type WorldCupData = {
    name: string;
    matches: Match[];
};

const YEARS = ["2022", "2018", "2014", "2010", "2006", "2002", "1998", "1994", "1990", "1986", "1982", "1978", "1974", "1970", "1966", "1962", "1958", "1954", "1950", "1938", "1934", "1930"];

export default function HistoryPage() {
    const [year, setYear] = useState("2022");
    const [data, setData] = useState<WorldCupData | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetch(`/data/worldcups/${year}.json`)
            .then(r => r.json())
            .then(d => {
                setData(d);
                setLoading(false);
            })
            .catch(e => {
                console.error(e);
                setLoading(false);
            });
    }, [year]);

    if (!data && !loading) return null;

    const groupMatches = data?.matches?.filter(m => m.round.includes("Matchday") || m.round.includes("Group") || m.round.includes("Round 1"));
    const ro16 = data?.matches?.filter(m => m.round.includes("Round of 16") || m.round.includes("Eighth-finals"));
    const quarter = data?.matches?.filter(m => m.round.includes("Quarter"));
    const semi = data?.matches?.filter(m => m.round.includes("Semi"));
    const final = data?.matches?.filter(m => m.round === "Final");

    const renderMatch = (m: Match, i: number) => {
        const team1Score = m.score?.ft?.[0] ?? "-";
        const team2Score = m.score?.ft?.[1] ?? "-";
        const isPenalties = m.score?.p !== undefined;
        return (
            <Card key={i} className="mb-4 bg-card/60 backdrop-blur border-primary/20 hover:border-primary/50 transition-all group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardContent className="p-4 relative">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] sm:text-xs text-muted-foreground font-semibold flex items-center gap-1"><Calendar className="w-3 h-3" /> {m.date}</span>
                        {m.ground && <span className="text-[10px] sm:text-xs text-muted-foreground font-semibold flex items-center gap-1 text-right max-w-[50%] truncate block"><MapPin className="w-3 h-3 flex-shrink-0" /> <span className="truncate">{m.ground}</span></span>}
                    </div>

                    <div className="flex flex-col space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm sm:text-base">{m.team1 || "TBA"}</span>
                            <span className="text-lg sm:text-xl font-black bg-muted/50 px-3 py-1 rounded">{team1Score}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-sm sm:text-base">{m.team2 || "TBA"}</span>
                            <span className="text-lg sm:text-xl font-black bg-muted/50 px-3 py-1 rounded">{team2Score}</span>
                        </div>
                    </div>
                    {isPenalties && (
                        <div className="mt-3 text-xs text-center text-primary font-bold">
                            Penalties: {m.score!.p![0]} - {m.score!.p![1]}
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl flex-1 flex flex-col items-center overflow-hidden">
            <div className="inline-block rounded-full bg-primary/20 px-3 py-1 text-sm font-semibold text-primary mb-4 ring-1 ring-primary/30 flex items-center justify-center gap-2">
                <History className="w-4 h-4" /> Go Back in Time
            </div>
            <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tight mb-8 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent text-center">
                World Cup History
            </h1>

            <div className="w-full max-w-sm mb-12">
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
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-xl font-bold text-muted-foreground">Loading {year} Data...</p>
                </div>
            ) : (
                <div className="w-full flex-1 animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <Tabs defaultValue={ro16?.length ? "knockout" : "groups"} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8 h-12 rounded-full p-1 bg-muted/50 backdrop-blur border border-border/50">
                            <TabsTrigger value="knockout" className="rounded-full text-base font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Knockouts</TabsTrigger>
                            <TabsTrigger value="groups" className="rounded-full text-base font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Group Stages</TabsTrigger>
                        </TabsList>

                        <TabsContent value="knockout" className="w-full">
                            {(!ro16?.length && !quarter?.length && !semi?.length) ? (
                                <div className="text-center text-muted-foreground py-12 text-xl font-bold">No standard knockout format found for {year}.</div>
                            ) : (
                                <ScrollArea className="w-full pb-8">
                                    <div className="flex gap-4 md:gap-8 min-w-max px-2 md:px-4">
                                        {/* Round of 16 */}
                                        {ro16 && ro16.length > 0 && (
                                            <div className="flex flex-col w-[280px] sm:w-[320px] shrink-0">
                                                <Badge className="mb-4 justify-center py-2 text-sm font-black uppercase tracking-wider mx-auto w-11/12" variant="outline">Round of 16</Badge>
                                                <div className="flex flex-col justify-around flex-1">
                                                    {ro16.map((m, i) => renderMatch(m, i))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Quarter */}
                                        {quarter && quarter.length > 0 && (
                                            <div className="flex flex-col w-[280px] sm:w-[320px] shrink-0">
                                                <Badge className="mb-4 justify-center py-2 text-sm font-black uppercase tracking-wider mx-auto w-11/12" variant="outline">Quarter Finals</Badge>
                                                <div className="flex flex-col justify-around flex-1">
                                                    {quarter.map((m, i) => renderMatch(m, i))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Semi */}
                                        {semi && semi.length > 0 && (
                                            <div className="flex flex-col w-[280px] sm:w-[320px] shrink-0">
                                                <Badge className="mb-4 justify-center py-2 text-sm font-black uppercase tracking-wider mx-auto w-11/12" variant="outline">Semi Finals</Badge>
                                                <div className="flex flex-col justify-around flex-1">
                                                    {semi.map((m, i) => renderMatch(m, i))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Final */}
                                        {final && final.length > 0 && (
                                            <div className="flex flex-col w-[280px] sm:w-[320px] shrink-0">
                                                <Badge className="mb-4 justify-center py-2 text-sm font-black uppercase tracking-wider mx-auto bg-primary text-primary-foreground border-transparent w-11/12 transition-transform hover:scale-110">FINAL <Trophy className="w-4 h-4 ml-2 inline" /></Badge>
                                                <div className="flex flex-col justify-center flex-1">
                                                    {final.map((m, i) => (
                                                        <div key={i} className="scale-105 sm:scale-110 shadow-2xl shadow-primary/20 rounded-xl my-4">
                                                            {renderMatch(m, i)}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <ScrollBar orientation="horizontal" className="h-3" />
                                </ScrollArea>
                            )}
                        </TabsContent>

                        <TabsContent value="groups">
                            {(!groupMatches?.length) ? (
                                <div className="text-center text-muted-foreground py-12 text-xl font-bold">No group stage data found or different format used.</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-2">
                                    {groupMatches.map((m, i) => renderMatch(m, i))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </div>
    );
}
