"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { invalidateMatchCache } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ShieldAlert, Save, RefreshCw, CheckCircle2, Clock, Zap } from "lucide-react";
import { format } from "date-fns";

type DbMatch = {
    id: string;
    home_team: string;
    away_team: string;
    kickoff_time: string;
    status: string;
    home_score: number | null;
    away_score: number | null;
    group_name: string | null;
    round: string;
};

type MatchRow = DbMatch & {
    editHome: string;
    editAway: string;
    saving: boolean;
};

const statusColors: Record<string, string> = {
    upcoming: "bg-blue-500/20 text-blue-400",
    live: "bg-green-500/20 text-green-400 animate-pulse",
    finished: "bg-muted text-muted-foreground",
};

export default function AdminPage() {
    const { user, profile, loading: authLoading } = useAuth();
    const router = useRouter();

    const [matches, setMatches] = useState<MatchRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCalculating, setIsCalculating] = useState(false);
    const [calcResult, setCalcResult] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>("all");

    const loadMatches = useCallback(async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from("matches")
            .select("id, home_team, away_team, kickoff_time, status, home_score, away_score, group_name, round")
            .order("kickoff_time", { ascending: true });

        if (error) {
            toast.error("Failed to load matches");
        } else {
            setMatches(
                (data || []).map((m: DbMatch) => ({
                    ...m,
                    editHome: m.home_score?.toString() ?? "",
                    editAway: m.away_score?.toString() ?? "",
                    saving: false,
                }))
            );
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (authLoading) return;
        if (!user || !profile?.is_admin) {
            router.push("/");
            return;
        }
        loadMatches();
    }, [user, profile, authLoading, router, loadMatches]);

    const updateMatch = async (matchId: string, homeScore: string, awayScore: string, newStatus: string) => {
        setMatches(prev => prev.map(m => m.id === matchId ? { ...m, saving: true } : m));

        const home = homeScore.trim() !== "" ? parseInt(homeScore) : null;
        const away = awayScore.trim() !== "" ? parseInt(awayScore) : null;

        const { error } = await supabase
            .from("matches")
            .update({
                home_score: home,
                away_score: away,
                status: newStatus,
            })
            .eq("id", matchId);

        if (error) {
            toast.error("Failed to save: " + error.message);
        } else {
            toast.success("Match updated!");
            invalidateMatchCache(); // ensure predictions/bracket pages get fresh status
            setMatches(prev => prev.map(m =>
                m.id === matchId
                    ? { ...m, home_score: home, away_score: away, status: newStatus, saving: false }
                    : m
            ));
        }
    };

    const triggerRecalculate = async () => {
        setIsCalculating(true);
        setCalcResult(null);
        try {
            const res = await fetch("/api/calculate-points", { method: "POST" });

            // Safe parse — empty body causes "Unexpected end of JSON" if we call .json() directly
            const text = await res.text();
            const data = text ? JSON.parse(text) : {};

            if (!res.ok) {
                throw new Error(data.error || `Server returned ${res.status}: ${text || "empty response"}`);
            }

            const msg = `✅ ${data.message} (${data.processed} predictions, ${data.usersUpdated} users updated)`;
            setCalcResult(msg);
            toast.success("Points recalculated!", { description: `${data.usersUpdated} users updated` });
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Unknown error";
            toast.error("Recalculation failed: " + msg);
            setCalcResult("❌ Error: " + msg);
        } finally {
            setIsCalculating(false);
        }
    };

    const filteredMatches = filterStatus === "all" ? matches : matches.filter(m => m.status === filterStatus);

    if (authLoading || isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Guard: don't render if not admin (redirect happens in useEffect)
    if (!user || !profile?.is_admin) return null;

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-orange-500/20 text-orange-400">
                        <ShieldAlert className="h-7 w-7" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black italic uppercase tracking-widest">Super Admin</h1>
                        <p className="text-muted-foreground text-sm">Match Results &amp; Points Engine</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <Button variant="outline" onClick={loadMatches} className="gap-2">
                        <RefreshCw className="h-4 w-4" /> Refresh
                    </Button>
                    <Button
                        onClick={triggerRecalculate}
                        disabled={isCalculating}
                        className="gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold"
                    >
                        {isCalculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                        Recalculate All Points
                    </Button>
                </div>
            </div>

            {/* Scoring Legend */}
            <Card className="mb-6 bg-card/50 border-border/50">
                <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-6 flex-wrap text-sm">
                        <span className="font-bold text-muted-foreground uppercase tracking-wider text-xs">Scoring:</span>
                        <div className="flex items-center gap-2">
                            <span className="text-yellow-400 font-black text-lg">5 pts</span>
                            <span className="text-muted-foreground">Exact scoreline</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-green-400 font-black text-lg">2 pts</span>
                            <span className="text-muted-foreground">Correct result (W/D/L)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-red-400 font-black text-lg">0 pts</span>
                            <span className="text-muted-foreground">Wrong result</span>
                        </div>
                    </div>
                    {calcResult && (
                        <div className="mt-3 text-sm font-medium text-green-400 bg-green-500/10 rounded-lg px-3 py-2">
                            {calcResult}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6">
                {["all", "upcoming", "live", "finished"].map(s => (
                    <Button
                        key={s}
                        variant={filterStatus === s ? "default" : "secondary"}
                        size="sm"
                        className="capitalize font-bold text-xs"
                        onClick={() => setFilterStatus(s)}
                    >
                        {s === "all" ? `All (${matches.length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${matches.filter(m => m.status === s).length})`}
                    </Button>
                ))}
            </div>

            {/* Match List */}
            <div className="space-y-3">
                {filteredMatches.map((match) => (
                    <Card key={match.id} className="bg-card/50 border-border/50 hover:border-primary/30 transition-all">
                        <CardContent className="py-4">
                            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                {/* Match Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${statusColors[match.status] || "bg-muted text-muted-foreground"}`}>
                                            {match.status}
                                        </span>
                                        <span className="text-xs text-muted-foreground">{match.round}</span>
                                        {match.group_name && <span className="text-xs text-muted-foreground">• {match.group_name}</span>}
                                    </div>
                                    <div className="font-bold text-lg">
                                        {match.home_team} <span className="text-muted-foreground font-normal text-sm">vs</span> {match.away_team}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                        <Clock className="h-3 w-3" />
                                        {format(new Date(match.kickoff_time), "EEE d MMM yyyy, HH:mm")}
                                    </div>
                                </div>

                                {/* Current Score Display */}
                                {match.status === "finished" && match.home_score !== null && (
                                    <div className="flex items-center gap-2 text-2xl font-black">
                                        <span>{match.home_score}</span>
                                        <span className="text-muted-foreground text-base">-</span>
                                        <span>{match.away_score}</span>
                                        <CheckCircle2 className="h-4 w-4 text-green-400 ml-1" />
                                    </div>
                                )}

                                {/* Score Input */}
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <Label className="text-xs text-muted-foreground shrink-0">Home</Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            max={99}
                                            value={match.editHome}
                                            onChange={(e) => setMatches(prev =>
                                                prev.map(m => m.id === match.id ? { ...m, editHome: e.target.value } : m)
                                            )}
                                            className="w-16 h-9 text-center font-bold text-lg"
                                            placeholder="–"
                                        />
                                    </div>
                                    <span className="font-bold text-muted-foreground">:</span>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            min={0}
                                            max={99}
                                            value={match.editAway}
                                            onChange={(e) => setMatches(prev =>
                                                prev.map(m => m.id === match.id ? { ...m, editAway: e.target.value } : m)
                                            )}
                                            className="w-16 h-9 text-center font-bold text-lg"
                                            placeholder="–"
                                        />
                                        <Label className="text-xs text-muted-foreground shrink-0">Away</Label>
                                    </div>
                                </div>

                                {/* Status Buttons */}
                                <div className="flex gap-2 flex-wrap">
                                    <Button
                                        size="sm"
                                        variant={match.status === "live" ? "default" : "outline"}
                                        className="text-xs font-bold gap-1"
                                        onClick={() => updateMatch(match.id, match.editHome, match.editAway, "live")}
                                        disabled={match.saving}
                                    >
                                        {match.saving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                                        🟢 Live
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={match.status === "finished" ? "default" : "outline"}
                                        className="text-xs font-bold gap-1 bg-green-600 hover:bg-green-700 text-white border-0"
                                        onClick={() => updateMatch(match.id, match.editHome, match.editAway, "finished")}
                                        disabled={match.saving}
                                    >
                                        {match.saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                        Save & Finish
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {filteredMatches.length === 0 && (
                    <div className="text-center text-muted-foreground py-16 text-sm italic">
                        No matches in this category.
                    </div>
                )}
            </div>
        </div>
    );
}
