"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { fetchMatches, FUNNY_PREDICTION_OPTIONS, type Match } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Clock, AlertTriangle, Search, MapPin, Lock } from "lucide-react";
import { toast } from "sonner";

export default function PredictionsPage() {
    const [predictions, setPredictions] = useState<Record<string, { homeScore: number; awayScore: number; funnyPrediction: string }>>({});
    const [searchCountry, setSearchCountry] = useState("");
    const [filterGroup, setFilterGroup] = useState("All");
    const [matches, setMatches] = useState<Match[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const { user } = useAuth();
    const [now, setNow] = useState(() => new Date());

    // Tick every 30s so lock state stays live
    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 30_000);
        return () => clearInterval(timer);
    }, []);

    // Locked if DB says live/finished OR kickoff time has passed
    const isPredictionLocked = (match: Match): boolean => {
        if (match.status === 'live' || match.status === 'finished') return true;
        return new Date(match.kickoff_time) <= now;
    };

    useEffect(() => {
        async function load() {
            const data = await fetchMatches();
            setMatches(data);

            if (user) {
                const { data: userPredictions } = await supabase
                    .from('predictions')
                    .select('*')
                    .eq('user_id', user.id);

                if (userPredictions) {
                    const loadedPredictions: Record<string, { homeScore: number; awayScore: number; funnyPrediction: string }> = {};
                    userPredictions.forEach(p => {
                        loadedPredictions[p.match_id] = {
                            homeScore: p.predicted_home_score,
                            awayScore: p.predicted_away_score,
                            funnyPrediction: p.funny_prediction
                        };
                    });
                    setPredictions(loadedPredictions);
                }
            }

            setIsLoading(false);
        }
        load();
    }, [user]);

    const groups = ["All", ...Array.from(new Set(matches.map(m => m.group))).filter(Boolean).sort()];

    const filteredMatches = matches.filter((match) => {
        const matchesSearch = searchCountry === "" || match.home_team.toLowerCase().includes(searchCountry.toLowerCase()) || match.away_team.toLowerCase().includes(searchCountry.toLowerCase());
        const matchesGroup = filterGroup === "All" || match.group === filterGroup;
        return matchesSearch && matchesGroup;
    });


    const handlePredict = async (matchId: string, data: { homeScore: number; awayScore: number; funnyPrediction: string }) => {
        if (!user) {
            toast.error("You must be signed in to make a prediction");
            return;
        }

        try {
            // Check if existing prediction exists
            const { data: existing } = await supabase
                .from('predictions')
                .select('id')
                .eq('user_id', user.id)
                .eq('match_id', matchId)
                .single();

            if (existing) {
                await supabase.from('predictions').update({
                    predicted_home_score: data.homeScore,
                    predicted_away_score: data.awayScore,
                    funny_prediction: data.funnyPrediction
                }).eq('id', existing.id);
            } else {
                await supabase.from('predictions').insert([{
                    user_id: user.id,
                    match_id: matchId,
                    predicted_home_score: data.homeScore,
                    predicted_away_score: data.awayScore,
                    funny_prediction: data.funnyPrediction
                }]);
            }

            setPredictions((prev) => ({ ...prev, [matchId]: data }));
            toast.success("Prediction locked in!", {
                description: "If you get this wrong, we will judge you.",
            });
        } catch (error: unknown) {
            toast.error("Failed to save prediction: " + (error instanceof Error ? error.message : String(error)));
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="flex flex-col gap-4 mb-8">
                <h1 className="text-4xl font-black italic tracking-tight uppercase">Match Predictions</h1>
                <p className="text-muted-foreground text-lg">
                    Guess the score and predict chaotic events for maximum points.
                </p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex-1 relative">
                    <Input
                        placeholder="Search by country..."
                        value={searchCountry}
                        onChange={(e) => setSearchCountry(e.target.value)}
                        className="pl-10"
                    />
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
                <div className="w-full md:w-64">
                    <Select value={filterGroup} onValueChange={(val) => setFilterGroup(val || 'All')}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by group" />
                        </SelectTrigger>
                        <SelectContent>
                            {groups.map((group) => (
                                <SelectItem key={group} value={group}>{group}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Scoring Legend */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm mb-6 px-4 py-3 rounded-xl bg-muted/40 border border-border/50">
                <span className="font-bold text-muted-foreground uppercase tracking-wider text-xs">How points work:</span>
                <span className="flex items-center gap-1.5"><span className="font-black text-yellow-500">5 pts</span><span className="text-muted-foreground">Exact scoreline</span></span>
                <span className="flex items-center gap-1.5"><span className="font-black text-green-500">3 pts</span><span className="text-muted-foreground">Correct result (W/D/L)</span></span>
                <span className="flex items-center gap-1.5"><span className="font-black text-purple-500">2 pts</span><span className="text-muted-foreground">Chaotic event matched</span></span>
                <span className="flex items-center gap-1.5"><span className="font-black text-red-400">0 pts</span><span className="text-muted-foreground">Wrong result</span></span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isLoading && (
                    <div className="col-span-1 md:col-span-2 text-center py-12 text-muted-foreground animate-pulse">
                        Loading match data...
                    </div>
                )}
                {!isLoading && filteredMatches.length === 0 && (
                    <div className="col-span-1 md:col-span-2 text-center py-12 text-muted-foreground">
                        No matches found.
                    </div>
                )}
                {filteredMatches.map((match) => (
                    <Card key={match.id} className={`overflow-hidden transition-all duration-300 ${match.status === 'live' ? 'ring-2 ring-green-500 shadow-[0_0_40px_rgba(34,197,94,0.25)] scale-[1.02] bg-white z-10' : 'border-border/50 bg-card/50 backdrop-blur hover:border-primary/30'}`}>
                        <CardHeader className={`${match.status === 'live' ? 'bg-green-50/80 border-b border-green-500/20' : 'bg-muted/30 border-b border-border/50'} pb-2 flex flex-col gap-2`}>
                            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground font-medium" suppressHydrationWarning>
                                    <div className="flex items-center gap-1.5" suppressHydrationWarning>
                                        <CalendarIcon className="w-4 h-4 shrink-0" />
                                        <span suppressHydrationWarning>{format(new Date(match.kickoff_time), "MMM d, yyyy")}</span>
                                    </div>
                                    <span className="hidden sm:inline-block opacity-50">•</span>
                                    <div className="flex items-center gap-1.5" suppressHydrationWarning>
                                        <Clock className="w-4 h-4 shrink-0" />
                                        <span suppressHydrationWarning>{format(new Date(match.kickoff_time), "h:mm a")} <span className="text-xs opacity-75 ml-1">Local</span></span>
                                    </div>
                                </div>
                                <Badge
                                    variant="secondary"
                                    className={`w-fit font-bold px-3 py-1 ${match.status === 'live'
                                        ? 'bg-green-600 text-white animate-pulse shadow-[0_0_15px_rgba(34,197,94,0.6)] border-0 tracking-wide uppercase'
                                        : match.status === 'finished'
                                            ? 'bg-muted text-muted-foreground'
                                            : isPredictionLocked(match)
                                                ? 'bg-orange-500/10 text-orange-600 border-orange-500/30'
                                                : 'bg-primary/10 text-primary border-primary/30'
                                        }`}
                                >
                                    {match.status === 'live' ? '🟢 LIVE'
                                        : match.status === 'finished' ? '✅ FINISHED'
                                            : isPredictionLocked(match) ? '🔒 LOCKED'
                                                : '🕐 UPCOMING'}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                                <span>{match.group}</span>
                                <span className="flex items-center"><MapPin className="w-3 h-3 mr-1" />{match.stadium}</span>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex flex-col items-center gap-2 w-1/3">
                                    <span className="text-6xl">{match.home_flag}</span>
                                    <Link href={`/teams/${encodeURIComponent(match.home_team)}`} className="font-bold text-center hover:text-primary hover:underline underline-offset-4 transition-colors leading-tight">
                                        {match.home_team}
                                    </Link>
                                </div>

                                <div className="flex flex-col items-center justify-center w-1/3">
                                    {(match.status === 'finished' || match.status === 'live') && match.home_score !== null ? (
                                        <div className={`px-5 py-3 rounded-2xl text-4xl font-black tracking-tighter flex items-center justify-center ${match.status === 'live'
                                            ? 'bg-green-600 text-white shadow-[0_0_25px_rgba(34,197,94,0.4)] relative scale-110'
                                            : 'bg-secondary border border-border/50'
                                            }`}>
                                            {match.status === 'live' && (
                                                <span className="absolute -top-2 -right-2 flex h-5 w-5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-5 w-5 bg-green-500 border-2 border-white"></span>
                                                </span>
                                            )}
                                            <span>{match.home_score}</span>
                                            <span className={`text-2xl mx-2 ${match.status === 'live' ? 'text-white/70' : 'text-muted-foreground'}`}>-</span>
                                            <span>{match.away_score}</span>
                                        </div>
                                    ) : (
                                        <div className="bg-muted px-4 py-2 rounded-xl text-xl font-bold text-muted-foreground border border-border/50">
                                            {isPredictionLocked(match) ? '⏸' : 'VS'}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col items-center gap-2 w-1/3">
                                    <span className="text-6xl">{match.away_flag}</span>
                                    <Link href={`/teams/${encodeURIComponent(match.away_team)}`} className="font-bold text-center hover:text-primary hover:underline underline-offset-4 transition-colors leading-tight">
                                        {match.away_team}
                                    </Link>
                                </div>
                            </div>

                            {predictions[match.id] && (
                                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm flex flex-col gap-1">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-primary">Your Prediction:</span>
                                        <span className="font-bold">
                                            {predictions[match.id].homeScore} - {predictions[match.id].awayScore}
                                        </span>
                                    </div>
                                    {predictions[match.id].funnyPrediction && (
                                        <div className="flex items-center gap-2 text-muted-foreground mt-1">
                                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                            <span>{predictions[match.id].funnyPrediction}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>

                        <CardFooter className={`${match.status === 'live' ? 'bg-green-50/50' : 'bg-muted/10'} pt-3 pb-4`}>
                            {isPredictionLocked(match) ? (
                                <div className={`w-full text-center text-sm font-bold py-3 px-4 rounded-lg flex items-center justify-center border ${match.status === 'live'
                                    ? 'bg-green-600 text-white border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)] uppercase tracking-wide'
                                    : match.status === 'finished'
                                        ? 'bg-muted text-muted-foreground border-border'
                                        : 'bg-orange-500/10 text-orange-600 border-orange-500/30'
                                    }`}>
                                    {match.status === 'live' && (
                                        <span className="flex items-center gap-2">
                                            <Lock className="w-4 h-4 animate-pulse" />
                                            <span>Match in progress — predictions locked</span>
                                        </span>
                                    )}
                                    {match.status === 'finished' && '✅ Match finished — no more predictions'}
                                    {match.status === 'upcoming' && '🔒 Kickoff passed — predictions locked'}
                                </div>
                            ) : (
                                <Dialog>
                                    <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2 w-full font-bold">
                                        {predictions[match.id] ? "Update Prediction" : "Make Prediction"}
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Predict {match.home_team} vs {match.away_team}</DialogTitle>
                                            <DialogDescription>
                                                Enter your score prediction and choose a chaotic moment.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <PredictionForm
                                            current={predictions[match.id]}
                                            onSave={(data) => handlePredict(match.id, data)}
                                        />
                                    </DialogContent>
                                </Dialog>
                            )}
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function PredictionForm({ current, onSave }: { current: { homeScore?: number | string; awayScore?: number | string; funnyPrediction?: string }, onSave: (data: { homeScore: number; awayScore: number; funnyPrediction: string }) => void }) {
    const [homeScore, setHomeScore] = useState(current?.homeScore?.toString() || "0");
    const [awayScore, setAwayScore] = useState(current?.awayScore?.toString() || "0");
    const [funnyPrediction, setFunnyPrediction] = useState(current?.funnyPrediction || "");

    return (
        <div className="flex flex-col gap-6 py-4">
            <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-2 flex-1">
                    <Label htmlFor="home-score" className="text-center">Home Score</Label>
                    <Input
                        id="home-score"
                        type="number"
                        min="0"
                        className="text-center text-2xl font-bold h-14"
                        value={homeScore}
                        onChange={(e) => setHomeScore(e.target.value)}
                    />
                </div>
                <div className="text-2xl font-black text-muted-foreground">-</div>
                <div className="flex flex-col gap-2 flex-1">
                    <Label htmlFor="away-score" className="text-center">Away Score</Label>
                    <Input
                        id="away-score"
                        type="number"
                        min="0"
                        className="text-center text-2xl font-bold h-14"
                        value={awayScore}
                        onChange={(e) => setAwayScore(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <Label>Chaotic Event Prediction (10 pts)</Label>
                <Select value={funnyPrediction} onValueChange={(val) => setFunnyPrediction(val || "")}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a funny event to happen..." />
                    </SelectTrigger>
                    <SelectContent>
                        {FUNNY_PREDICTION_OPTIONS.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <DialogFooter className="mt-4">
                <Button onClick={() => onSave({ homeScore: parseInt(homeScore), awayScore: parseInt(awayScore), funnyPrediction })}>
                    Save Prediction
                </Button>
            </DialogFooter>
        </div>
    );
}
