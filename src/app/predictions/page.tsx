"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { fetchMatches, FUNNY_PREDICTION_OPTIONS, type Match, type Goal } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { CalendarPlus, AlertTriangle, Search, MapPin, Lock, Zap, CheckCircle2, Timer } from "lucide-react";
import { toast } from "sonner";
import { Flag } from "@/components/flag";

export const dynamic = "force-dynamic";

function buildGoogleCalendarUrl(match: { kickoff_time: string; home_team: string; away_team: string; group: string; stadium: string }): string {
    const title = encodeURIComponent(`⚽ ${match.home_team} vs ${match.away_team} – FIFA World Cup 2026`);
    const location = encodeURIComponent(match.stadium);
    const details = encodeURIComponent(
        `${match.group} match • ${match.home_team} vs ${match.away_team}\nVenue: ${match.stadium}\n\nTrack & predict on Football Chaos!`
    );
    const start = new Date(match.kickoff_time);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    return (
        `https://calendar.google.com/calendar/render?action=TEMPLATE` +
        `&text=${title}&dates=${fmt(start)}/${fmt(end)}&details=${details}&location=${location}`
    );
}

type TabId = "upcoming" | "live" | "finished";

const GoalList = ({ goals, align = 'left' }: { goals?: Goal[]; align?: 'left' | 'right' }) => {
    if (!goals || goals.length === 0) return null;
    return (
        <div className={`mt-2 flex flex-col gap-0.5 ${align === 'right' ? 'items-end' : 'items-start'}`}>
            {goals.map((g, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tighter leading-none">
                    {align === 'left' ? (
                        <>
                            <span>⚽</span>
                            <span className="truncate max-w-[60px]">{g.name}</span>
                            <span className="opacity-50">{g.minute}&apos;</span>
                            {g.penalty && <span className="text-primary text-[7px] border border-primary/20 px-0.5 rounded">P</span>}
                            {g.owngoal && <span className="text-orange-500 text-[7px] border border-orange-500/20 px-0.5 rounded">OG</span>}
                        </>
                    ) : (
                        <>
                            {g.owngoal && <span className="text-orange-500 text-[7px] border border-orange-500/20 px-0.5 rounded">OG</span>}
                            {g.penalty && <span className="text-primary text-[7px] border border-primary/20 px-0.5 rounded">P</span>}
                            <span className="opacity-50">{g.minute}&apos;</span>
                            <span className="truncate max-w-[60px]">{g.name}</span>
                            <span>⚽</span>
                        </>
                    )}
                </div>
            ))}
        </div>
    );
};

export default function PredictionsPage() {
    const [predictions, setPredictions] = useState<Record<string, { homeScore: number; awayScore: number; funnyPrediction: string }>>({});
    const [searchCountry, setSearchCountry] = useState("");
    const [filterGroup, setFilterGroup] = useState("All");
    const [matches, setMatches] = useState<Match[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabId>("upcoming");

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
            try {
                const data = await fetchMatches(true);
                setMatches(data);

                if (user) {
                    const { data: userPredictions, error } = await supabase
                        .from('predictions')
                        .select('*')
                        .eq('user_id', user.id);

                    if (error) {
                        console.error("Error fetching user predictions:", error);
                    } else if (userPredictions) {
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
            } catch (err) {
                console.error("Critical error in Predictions load:", err);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, [user]);

    const groups = ["All", ...Array.from(new Set(matches.map(m => m.group))).filter(Boolean).sort()];

    // Base filter (search + group)
    const baseFiltered = matches.filter((match) => {
        const matchesSearch = searchCountry === "" || match.home_team.toLowerCase().includes(searchCountry.toLowerCase()) || match.away_team.toLowerCase().includes(searchCountry.toLowerCase());
        const matchesGroup = filterGroup === "All" || match.group === filterGroup;
        return matchesSearch && matchesGroup;
    });

    // Split into tabs
    const liveMatches = baseFiltered.filter(m => m.status === 'live');
    const finishedMatches = baseFiltered.filter(m => m.status === 'finished');
    const upcomingMatches = baseFiltered.filter(m => m.status !== 'live' && m.status !== 'finished');

    const tabMatches: Record<TabId, Match[]> = {
        upcoming: upcomingMatches,
        live: liveMatches,
        finished: finishedMatches,
    };

    const filteredMatches = tabMatches[activeTab];

    // Auto-switch to live tab if there are live matches (only on initial load)
    useEffect(() => {
        if (!isLoading && liveMatches.length > 0) {
            setActiveTab("live");
        }
    }, [isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

    const handlePredict = async (matchId: string, data: { homeScore: number; awayScore: number; funnyPrediction: string }) => {
        if (!user) {
            toast.error("You must be signed in to make a prediction");
            return;
        }

        try {
            const { data: existing } = await supabase
                .from('predictions')
                .select('id')
                .eq('user_id', user.id)
                .eq('match_id', matchId)
                .maybeSingle();

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

    const tabs: { id: TabId; label: string; icon: React.ReactNode; count: number; accent: string }[] = [
        {
            id: "upcoming",
            label: "Upcoming",
            icon: <Timer className="w-4 h-4" />,
            count: upcomingMatches.length,
            accent: "text-primary border-primary bg-primary/10",
        },
        {
            id: "live",
            label: "Live",
            icon: <Zap className="w-4 h-4" />,
            count: liveMatches.length,
            accent: "text-green-600 border-green-500 bg-green-500/10",
        },
        {
            id: "finished",
            label: "Finished",
            icon: <CheckCircle2 className="w-4 h-4" />,
            count: finishedMatches.length,
            accent: "text-muted-foreground border-border bg-muted/40",
        },
    ];

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="flex flex-col gap-4 mb-8">
                <h1 className="text-4xl font-black italic tracking-tight uppercase">Match Predictions</h1>
                <p className="text-muted-foreground text-lg">
                    Guess the score and predict chaotic events for maximum points.
                </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
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

            {/* Tabs */}
            <div className="flex gap-2 mb-6 p-1.5 bg-muted/40 border border-border/50 rounded-2xl w-fit">
                {tabs.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200
                                ${isActive
                                    ? `${tab.accent} border shadow-sm`
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-transparent"
                                }
                                ${tab.id === "live" && tab.count > 0 && !isActive ? "text-green-600" : ""}
                            `}
                        >
                            {/* Pulsing dot for live tab when there are live matches */}
                            {tab.id === "live" && tab.count > 0 && (
                                <span className="relative flex h-2 w-2 shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                            )}
                            {tab.id !== "live" || tab.count === 0 ? tab.icon : null}
                            <span>{tab.label}</span>
                            <span className={`
                                text-xs font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center
                                ${isActive ? "bg-current/10" : "bg-muted text-muted-foreground"}
                                ${tab.id === "live" && tab.count > 0 ? "bg-green-500/20 text-green-700" : ""}
                            `}>
                                {tab.count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Scoring Legend */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm mb-6 px-4 py-3 rounded-xl bg-muted/40 border border-border/50">
                <span className="font-bold text-muted-foreground uppercase tracking-wider text-xs">How points work:</span>
                <span className="flex items-center gap-1.5"><span className="font-black text-yellow-500">5 pts</span><span className="text-muted-foreground">Exact scoreline</span></span>
                <span className="flex items-center gap-1.5"><span className="font-black text-green-500">3 pts</span><span className="text-muted-foreground">Correct result (W/D/L)</span></span>
                <span className="flex items-center gap-1.5"><span className="font-black text-purple-500">1 pt</span><span className="text-muted-foreground">Chaotic event matched</span></span>
                <span className="flex items-center gap-1.5"><span className="font-black text-red-400">0 pts</span><span className="text-muted-foreground">Wrong result</span></span>
            </div>

            {/* Match Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isLoading && (
                    <div className="col-span-1 md:col-span-2 text-center py-12 text-muted-foreground animate-pulse">
                        Loading match data...
                    </div>
                )}
                {!isLoading && filteredMatches.length === 0 && (
                    <div className="col-span-1 md:col-span-2 text-center py-16 text-muted-foreground flex flex-col items-center gap-3">
                        {activeTab === "live" ? (
                            <>
                                <Zap className="w-10 h-10 opacity-30" />
                                <p className="font-semibold text-lg">No live matches right now</p>
                                <p className="text-sm opacity-70">Check back when a match kicks off!</p>
                            </>
                        ) : activeTab === "finished" ? (
                            <>
                                <CheckCircle2 className="w-10 h-10 opacity-30" />
                                <p className="font-semibold text-lg">No finished matches yet</p>
                                <p className="text-sm opacity-70">Results will appear here once matches are played.</p>
                            </>
                        ) : (
                            <>
                                <Timer className="w-10 h-10 opacity-30" />
                                <p className="font-semibold text-lg">No upcoming matches found</p>
                                <p className="text-sm opacity-70">Try clearing your filters.</p>
                            </>
                        )}
                    </div>
                )}
                {filteredMatches.map((match) => {
                    const isLive = match.status === 'live';
                    const isFinished = match.status === 'finished';
                    const locked = isPredictionLocked(match);
                    const calUrl = buildGoogleCalendarUrl(match);

                    return (
                        <div
                            key={match.id}
                            className={`group rounded-3xl overflow-hidden shadow-xl border flex flex-col transition-all duration-500
                                ${isLive
                                    ? 'border-green-500/40 shadow-[0_0_40px_rgba(34,197,94,0.15)] scale-[1.01] z-10'
                                    : 'border-border/10 bg-card/40 backdrop-blur-3xl hover:border-primary/30 hover:shadow-2xl'
                                } bg-white dark:bg-zinc-900/40`}
                        >
                            {/* ── Header bar ── */}
                            <div className={`flex items-center justify-between px-5 py-3 ${isLive
                                ? 'bg-gradient-to-r from-green-600 to-emerald-600'
                                : isFinished
                                    ? 'bg-zinc-700'
                                    : 'bg-gradient-to-r from-zinc-900 to-zinc-800'
                                }`}>
                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/90">
                                    {match.group}
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white flex items-center gap-2">
                                    {isLive && (
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                        </span>
                                    )}
                                    {isLive ? 'Live' : isFinished ? 'Finished' : locked ? '🔒 Locked' : 'Upcoming'}
                                </span>
                            </div>

                            {/* ── Match body ── */}
                            <div className="flex items-center justify-between px-6 py-8 gap-4 relative">
                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                {/* Home */}
                                <div className="flex flex-col items-center gap-3 w-[85px] z-10">
                                    <Link href={`/teams/${encodeURIComponent(match.home_team)}`}>
                                        <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center bg-white dark:bg-zinc-800 shadow-lg border border-border/10 hover:scale-110 transition-all duration-300">
                                            <Flag emoji={match.home_flag} size={42} />
                                        </div>
                                    </Link>
                                    <Link href={`/teams/${encodeURIComponent(match.home_team)}`} className="text-[11px] font-black uppercase tracking-widest text-center text-foreground/80 hover:text-primary transition-colors leading-tight line-clamp-2 h-8">
                                        {match.home_team}
                                    </Link>
                                    <GoalList goals={match.goals1} align="left" />
                                </div>

                                {/* Centre */}
                                <div className="flex-1 flex flex-col items-center gap-1 text-center z-10">
                                    {(isFinished || isLive) && match.home_score !== null ? (
                                        <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-4xl font-black italic tracking-tighter relative shadow-inner ${isLive
                                            ? 'bg-green-600 text-white shadow-green-900/20'
                                            : 'bg-secondary text-foreground border border-border/10'
                                            }`}>
                                            {isLive && (
                                                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white"></span>
                                                </span>
                                            )}
                                            <span>{match.home_score}</span>
                                            <span className={`text-2xl ${isLive ? 'text-white/40' : 'text-muted-foreground/30'}`}>–</span>
                                            <span>{match.away_score}</span>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-[9px] font-black uppercase tracking-[0.35em] text-muted-foreground/50">Kick-Off</span>
                                            <span className={`text-3xl font-black italic tracking-tighter leading-none ${locked ? 'text-orange-500' : 'text-primary'
                                                }`} suppressHydrationWarning>
                                                {format(new Date(match.kickoff_time), "hh:mm a").toUpperCase()}
                                            </span>
                                        </>
                                    )}
                                    <div className="h-px w-8 bg-border/20 my-1" />
                                    <span className="text-[9px] font-black text-muted-foreground/70 uppercase tracking-widest" suppressHydrationWarning>
                                        {format(new Date(match.kickoff_time), "EEE, MMM d").toUpperCase()}
                                    </span>
                                    <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tight flex items-center gap-1 truncate max-w-[140px]">
                                        <MapPin className="h-2.5 w-2.5 shrink-0" />
                                        {match.stadium}
                                    </span>
                                </div>

                                {/* Away */}
                                <div className="flex flex-col items-center gap-3 w-[85px] z-10">
                                    <Link href={`/teams/${encodeURIComponent(match.away_team)}`}>
                                        <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center bg-white dark:bg-zinc-800 shadow-lg border border-border/10 hover:scale-110 transition-all duration-300">
                                            <Flag emoji={match.away_flag} size={42} />
                                        </div>
                                    </Link>
                                    <Link href={`/teams/${encodeURIComponent(match.away_team)}`} className="text-[11px] font-black uppercase tracking-widest text-center text-foreground/80 hover:text-primary transition-colors leading-tight line-clamp-2 h-8">
                                        {match.away_team}
                                    </Link>
                                    <GoalList goals={match.goals2} align="right" />
                                </div>
                            </div>

                            {/* ── Your prediction summary ── */}
                            {predictions[match.id] && (
                                <div className="mx-6 mb-4 bg-primary/5 border border-primary/10 rounded-2xl p-4 text-sm flex flex-col gap-1 shadow-inner">
                                    <div className="flex justify-between items-center">
                                        <span className="font-black text-primary text-[10px] uppercase tracking-widest">Your Prediction</span>
                                        <span className="font-black text-lg italic tracking-tight">
                                            {predictions[match.id].homeScore} – {predictions[match.id].awayScore}
                                        </span>
                                    </div>
                                    {predictions[match.id].funnyPrediction && (
                                        <div className="flex items-center gap-2 text-muted-foreground/70 mt-1">
                                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                            <span className="text-xs font-medium italic">{predictions[match.id].funnyPrediction}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── Footer ── */}
                            <div className="border-t border-border/5 mt-auto bg-muted/5 p-4">
                                {isPredictionLocked(match) ? (
                                    <div className={`flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl border ${isLive
                                        ? 'bg-green-500/10 text-green-600 border-green-500/20'
                                        : isFinished
                                            ? 'bg-zinc-100 text-muted-foreground border-zinc-200'
                                            : 'bg-orange-500/10 text-orange-600 border-orange-500/20'
                                        }`}>
                                        <Lock className="w-3 h-3" />
                                        {isLive ? 'Match in progress' : isFinished ? 'Match finished' : 'Predictions locked'}
                                    </div>
                                ) : (
                                    <div className="flex gap-3">
                                        <a
                                            href={calUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-secondary hover:bg-secondary/80 transition-all duration-300 text-[10px] font-black uppercase tracking-widest text-secondary-foreground shadow-sm"
                                        >
                                            <CalendarPlus className="h-4 w-4" />
                                            Calendar
                                        </a>
                                        <Dialog>
                                            <DialogTrigger className="flex-[1.5] inline-flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all py-3.5 text-[10px] font-black uppercase tracking-widest">
                                                {predictions[match.id] ? "Update Predict" : "Make Predict"}
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-md rounded-3xl">
                                                <DialogHeader>
                                                    <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Predict {match.home_team} vs {match.away_team}</DialogTitle>
                                                    <DialogDescription className="font-bold uppercase tracking-widest text-[10px]">
                                                        Lock in your chaos prophecy
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <PredictionForm
                                                    current={predictions[match.id]}
                                                    homeTeam={match.home_team}
                                                    awayTeam={match.away_team}
                                                    onSave={(data) => handlePredict(match.id, data)}
                                                />
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function PredictionForm({ current, homeTeam, awayTeam, onSave }: { current: { homeScore?: number | string; awayScore?: number | string; funnyPrediction?: string }, homeTeam: string; awayTeam: string; onSave: (data: { homeScore: number; awayScore: number; funnyPrediction: string }) => void }) {
    const [homeScore, setHomeScore] = useState(current?.homeScore?.toString() || "0");
    const [awayScore, setAwayScore] = useState(current?.awayScore?.toString() || "0");
    const [funnyPrediction, setFunnyPrediction] = useState(current?.funnyPrediction || "");

    return (
        <div className="flex flex-col gap-6 py-4">
            <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-2 flex-1">
                    <Label htmlFor="home-score" className="text-center font-black uppercase tracking-wide text-sm">{homeTeam}</Label>
                    <Input
                        id="home-score"
                        type="number"
                        min="0"
                        className="text-center text-2xl font-bold h-14"
                        value={homeScore}
                        onChange={(e) => setHomeScore(e.target.value)}
                    />
                </div>
                <div className="text-3xl font-black text-muted-foreground pt-6">—</div>
                <div className="flex flex-col gap-2 flex-1">
                    <Label htmlFor="away-score" className="text-center font-black uppercase tracking-wide text-sm">{awayTeam}</Label>
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
                <Label>Chaotic Event Prediction (1 pt)</Label>
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
