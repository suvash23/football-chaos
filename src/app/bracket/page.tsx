"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchMatches, TEAMS, type Match } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Trophy, Info, CheckCircle2, XCircle, Lock } from "lucide-react";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────

const KNOCKOUT_ROUNDS = [
    "Round of 32",
    "Round of 16",
    "Quarter-final",
    "Semi-final",
    "Final",
] as const;

type KnockoutRound = typeof KNOCKOUT_ROUNDS[number];

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamSlot {
    name: string;
    flag: string;
}

interface BracketMatch {
    id: string;           // real match id from DB (if known), else temp slug
    round: KnockoutRound;
    position: number;     // index within slotted matches for this round
    home: TeamSlot | null;
    away: TeamSlot | null;
    actualHomeScore: number | null;
    actualAwayScore: number | null;
    status: string;
    isThirdPlace: boolean;
}

type BracketPicks = Record<string, string>; // matchId → pickedTeamName

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFlag(teamName: string): string {
    const t = TEAMS.find(t => t.name === teamName);
    return t?.flag_icon ?? "🚩";
}

function getWinner(match: BracketMatch): string | null {
    if (match.status !== "finished") return null;
    if (match.actualHomeScore === null || match.actualAwayScore === null) return null;
    if (match.actualHomeScore > match.actualAwayScore) return match.home?.name ?? null;
    if (match.actualAwayScore > match.actualHomeScore) return match.away?.name ?? null;
    return null; // Draw (shouldn't happen in KO)
}

function pickStatus(
    match: BracketMatch,
    pick: string | undefined
): "correct" | "wrong" | "pending" | "none" {
    if (!pick) return "none";
    if (match.status !== "finished") return "pending";
    const winner = getWinner(match);
    if (!winner) return "pending";
    return pick === winner ? "correct" : "wrong";
}

// ─── Build initial bracket structure from DB matches ──────────────────────────

function buildBracketSlots(matches: Match[]): BracketMatch[] {
    const result: BracketMatch[] = [];

    const koMatches = matches.filter(m =>
        (KNOCKOUT_ROUNDS as readonly string[]).includes(m.round) || m.round === "Match for third place"
    );

    KNOCKOUT_ROUNDS.forEach(round => {
        const roundMatches = koMatches
            .filter(m => m.round === round)
            .sort((a, b) => new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime());

        roundMatches.forEach((m, pos) => {
            result.push({
                id: m.id,
                round,
                position: pos,
                home: m.home_team ? { name: m.home_team, flag: m.home_flag } : null,
                away: m.away_team ? { name: m.away_team, flag: m.away_flag } : null,
                actualHomeScore: m.home_score,
                actualAwayScore: m.away_score,
                status: m.status,
                isThirdPlace: false,
            });
        });
    });

    // Third place
    const thirdPlace = koMatches.filter(m => m.round === "Match for third place");
    thirdPlace.forEach((m, pos) => {
        result.push({
            id: m.id,
            round: "Final",
            position: 100 + pos,
            home: m.home_team ? { name: m.home_team, flag: m.home_flag } : null,
            away: m.away_team ? { name: m.away_team, flag: m.away_flag } : null,
            actualHomeScore: m.home_score,
            actualAwayScore: m.away_score,
            status: m.status,
            isThirdPlace: true,
        });
    });

    return result;
}

// ─── Component ────────────────────────────────────────────────────────────────

const ROUND_LABELS: Record<KnockoutRound, string> = {
    "Round of 32": "R32",
    "Round of 16": "R16",
    "Quarter-final": "QF",
    "Semi-final": "SF",
    "Final": "Final",
};

export default function BracketBuilderPage() {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [bracketSlots, setBracketSlots] = useState<BracketMatch[]>([]);
    const [picks, setPicks] = useState<BracketPicks>({});
    const [savedPicks, setSavedPicks] = useState<BracketPicks>({});
    const [activeRound, setActiveRound] = useState<KnockoutRound | "All">("All");

    // Load matches and saved bracket
    useEffect(() => {
        async function load() {
            const data = await fetchMatches();
            const slots = buildBracketSlots(data);
            setBracketSlots(slots);

            if (user) {
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("bracket_data")
                    .eq("id", user.id)
                    .maybeSingle();

                if (profile?.bracket_data) {
                    setPicks(profile.bracket_data as BracketPicks);
                    setSavedPicks(profile.bracket_data as BracketPicks);
                }
            }

            setIsLoading(false);
        }
        load();
    }, [user]);

    // When a user picks a team in a round, advance them to the next round slot
    const handlePick = useCallback(
        (matchId: string, pickedTeam: TeamSlot) => {
            setPicks(prev => {
                const updated = { ...prev, [matchId]: pickedTeam.name };

                // Find this match
                const match = bracketSlots.find(m => m.id === matchId);
                if (!match || match.isThirdPlace) return updated;

                // Find this match's position within its round (among non-third-place matches)
                const roundMatches = bracketSlots
                    .filter(m => m.round === match.round && !m.isThirdPlace)
                    .sort((a, b) => a.position - b.position);

                const matchIndexInRound = roundMatches.findIndex(m => m.id === matchId);

                // Map to next round
                const currentRoundIndex = KNOCKOUT_ROUNDS.indexOf(match.round);
                if (currentRoundIndex < 0 || currentRoundIndex >= KNOCKOUT_ROUNDS.length - 1) return updated;

                const nextRound = KNOCKOUT_ROUNDS[currentRoundIndex + 1];
                const nextRoundMatches = bracketSlots
                    .filter(m => m.round === nextRound && !m.isThirdPlace)
                    .sort((a, b) => a.position - b.position);

                // Pairs: match 0+1 → next[0]; 2+3 → next[1], etc.
                const nextMatchIndex = Math.floor(matchIndexInRound / 2);
                const isHome = matchIndexInRound % 2 === 0;
                const nextMatch = nextRoundMatches[nextMatchIndex];

                if (!nextMatch) return updated;

                // Place the pick into next round's slot (update bracketSlots)
                setBracketSlots(prevSlots =>
                    prevSlots.map(slot => {
                        if (slot.id !== nextMatch.id) return slot;
                        if (isHome) {
                            return { ...slot, home: pickedTeam };
                        } else {
                            return { ...slot, away: pickedTeam };
                        }
                    })
                );

                // Clear any downstream picks for the slot that changed
                // (if prev pick in next round is being overridden)
                if (nextMatch) {
                    const oldPickInNext = updated[nextMatch.id];
                    const newSlotTeam = pickedTeam.name;
                    if (oldPickInNext && oldPickInNext !== newSlotTeam) {
                        // Clear downstream cascade — remove nextMatch pick and everything further
                        const toClear = collectDownstreamIds(nextMatch.id, bracketSlots);
                        toClear.forEach(id => delete updated[id]);
                    }
                }

                return updated;
            });
        },
        [bracketSlots]
    );

    const handleSave = async () => {
        if (!user) {
            toast.error("You must be signed in to save your bracket");
            return;
        }
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from("profiles")
                .update({ bracket_data: picks })
                .eq("id", user.id);

            if (error) throw error;
            setSavedPicks({ ...picks });
            toast.success("Bracket saved! 🏆", {
                description: "Your picks are locked in. May your predictions survive contact with reality.",
            });
        } catch (err) {
            toast.error("Failed to save bracket: " + (err instanceof Error ? err.message : String(err)));
        } finally {
            setIsSaving(false);
        }
    };

    const hasUnsavedChanges = JSON.stringify(picks) !== JSON.stringify(savedPicks);
    const totalPicks = Object.keys(picks).length;

    // Stats
    const correctPicks = bracketSlots.filter(m => pickStatus(m, picks[m.id]) === "correct").length;
    const wrongPicks = bracketSlots.filter(m => pickStatus(m, picks[m.id]) === "wrong").length;

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    const visibleRounds = activeRound === "All" ? KNOCKOUT_ROUNDS : [activeRound];

    return (
        <div className="container mx-auto px-4 py-8 max-w-full">
            {/* Header */}
            <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black italic uppercase tracking-wider mb-1">
                        🏆 Bracket Builder
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Pick your winners round by round. Save your bracket and track how badly you got it wrong.
                    </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {/* Stats pills */}
                    {totalPicks > 0 && (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 bg-green-500/10 text-green-600 px-3 py-1.5 rounded-full text-sm font-bold border border-green-500/20">
                                <CheckCircle2 className="w-4 h-4" />
                                {correctPicks} correct
                            </div>
                            <div className="flex items-center gap-1.5 bg-red-500/10 text-red-500 px-3 py-1.5 rounded-full text-sm font-bold border border-red-500/20">
                                <XCircle className="w-4 h-4" />
                                {wrongPicks} wrong
                            </div>
                        </div>
                    )}

                    {user ? (
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || !hasUnsavedChanges}
                            className="font-bold gap-2"
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {isSaving ? "Saving…" : hasUnsavedChanges ? "Save Bracket" : "Saved ✓"}
                        </Button>
                    ) : (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted px-4 py-2 rounded-lg border border-border/50">
                            <Lock className="w-4 h-4" />
                            Sign in to save your bracket
                        </div>
                    )}
                </div>
            </div>

            {/* Info Banner */}
            <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 mb-6 text-sm text-blue-700 dark:text-blue-300">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                    Click a team to pick them as the winner. Their name will advance to the next round.
                    After matches finish, your picks will show <strong>✅ correct</strong> or <strong>❌ wrong</strong>.
                </span>
            </div>

            {/* Round Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
                <button
                    onClick={() => setActiveRound("All")}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all duration-200 ${activeRound === "All"
                        ? "bg-primary text-primary-foreground border-primary shadow-lg"
                        : "bg-secondary/60 text-muted-foreground border-border hover:bg-secondary"
                        }`}
                >
                    Full Bracket
                </button>
                {KNOCKOUT_ROUNDS.map(r => (
                    <button
                        key={r}
                        onClick={() => setActiveRound(r)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all duration-200 ${activeRound === r
                            ? "bg-primary text-primary-foreground border-primary shadow-lg"
                            : "bg-secondary/60 text-muted-foreground border-border hover:bg-secondary"
                            }`}
                    >
                        {ROUND_LABELS[r]}
                    </button>
                ))}
            </div>

            {/* Bracket View */}
            <div className="w-full overflow-x-auto pb-8">
                <div className={`flex gap-5 ${activeRound === "All" ? "min-w-max items-stretch" : "flex-wrap justify-center items-start"}`}>
                    {visibleRounds.map((roundName) => {
                        const roundMatchSlots = bracketSlots
                            .filter(m => m.round === roundName && !m.isThirdPlace)
                            .sort((a, b) => a.position - b.position);

                        const thirdPlaceSlots = roundName === "Final"
                            ? bracketSlots.filter(m => m.isThirdPlace)
                            : [];

                        return (
                            <div
                                key={roundName}
                                className={`flex flex-col gap-3 ${activeRound === "All" ? "w-[230px]" : "w-[280px]"}`}
                            >
                                {/* Round Header */}
                                <div
                                    className={`text-xs font-black py-2 px-3 rounded-xl text-center uppercase tracking-widest border transition-all cursor-pointer ${activeRound === roundName
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-secondary/60 border-border/50 text-muted-foreground hover:bg-secondary"
                                        }`}
                                    onClick={() => setActiveRound(activeRound === roundName ? "All" : roundName)}
                                >
                                    {roundName}
                                </div>

                                {/* Matches */}
                                <div className={`flex flex-col flex-1 gap-3 ${activeRound === "All" ? "justify-around" : "justify-start"}`}>
                                    {roundMatchSlots.map((match) => (
                                        <BracketMatchCard
                                            key={match.id}
                                            match={match}
                                            pick={picks[match.id]}
                                            onPick={handlePick}
                                        />
                                    ))}

                                    {roundMatchSlots.length === 0 && (
                                        <div className="text-center text-muted-foreground text-xs italic py-4">
                                            Matches TBD
                                        </div>
                                    )}
                                </div>

                                {/* Third Place Playoff (shown in Final column) */}
                                {thirdPlaceSlots.length > 0 && (
                                    <div className="mt-4 flex flex-col gap-2">
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">
                                            🥉 3rd Place
                                        </div>
                                        {thirdPlaceSlots.map(match => (
                                            <BracketMatchCard
                                                key={match.id}
                                                match={match}
                                                pick={picks[match.id]}
                                                onPick={handlePick}
                                                isThirdPlace
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Champion Banner */}
            {picks[bracketSlots.find(m => m.round === "Final" && !m.isThirdPlace)?.id ?? ""] && (
                <ChampionBanner
                    teamName={picks[bracketSlots.find(m => m.round === "Final" && !m.isThirdPlace)!.id]}
                    isFinal={bracketSlots.find(m => m.round === "Final" && !m.isThirdPlace)?.status === "finished"}
                    isCorrect={pickStatus(
                        bracketSlots.find(m => m.round === "Final" && !m.isThirdPlace)!,
                        picks[bracketSlots.find(m => m.round === "Final" && !m.isThirdPlace)?.id ?? ""]
                    )}
                />
            )}
        </div>
    );
}

// ─── BracketMatchCard ──────────────────────────────────────────────────────────

function BracketMatchCard({
    match,
    pick,
    onPick,
    isThirdPlace = false,
}: {
    match: BracketMatch;
    pick?: string;
    onPick: (matchId: string, team: TeamSlot) => void;
    isThirdPlace?: boolean;
}) {
    const status = pickStatus(match, pick);
    const isFinished = match.status === "finished";
    const actualWinner = getWinner(match);
    const hasActiveScore = match.status === "live" || match.status === "finished";

    return (
        <Card className="overflow-hidden border-border/50 bg-card/80 backdrop-blur shadow-md hover:shadow-xl transition-all duration-200 group">
            <div className="p-2">
                {/* Match meta */}
                <div className="text-[9px] text-muted-foreground font-semibold flex justify-between mb-1.5 pb-1.5 border-b border-border/50">
                    <span className="uppercase tracking-wider">{isThirdPlace ? "3rd Place" : match.round}</span>
                    {hasActiveScore && (
                        <span className={`font-black ${match.status === "live" ? "text-green-500" : ""}`}>
                            {match.status === "live" ? "🟢 LIVE" : ""}
                            {match.status === "finished" ? "FINAL" : ""}
                        </span>
                    )}
                </div>

                {/* Team rows */}
                <div className="space-y-0.5">
                    <TeamRow
                        team={match.home}
                        score={match.actualHomeScore}
                        isWinner={actualWinner === match.home?.name}
                        isLoser={isFinished && actualWinner !== null && actualWinner !== match.home?.name}
                        isPicked={pick === match.home?.name}
                        status={pick === match.home?.name ? status : "none"}
                        isFinished={isFinished}
                        isLocked={isFinished}
                        onClick={() => {
                            if (!match.home || isFinished) return;
                            onPick(match.id, match.home);
                        }}
                    />
                    <TeamRow
                        team={match.away}
                        score={match.actualAwayScore}
                        isWinner={actualWinner === match.away?.name}
                        isLoser={isFinished && actualWinner !== null && actualWinner !== match.away?.name}
                        isPicked={pick === match.away?.name}
                        status={pick === match.away?.name ? status : "none"}
                        isFinished={isFinished}
                        isLocked={isFinished}
                        onClick={() => {
                            if (!match.away || isFinished) return;
                            onPick(match.id, match.away);
                        }}
                    />
                </div>
            </div>
        </Card>
    );
}

// ─── TeamRow ──────────────────────────────────────────────────────────────────

function TeamRow({
    team,
    score,
    isPicked,
    isWinner,
    isLoser,
    status,
    isLocked,
    onClick,
}: {
    team: TeamSlot | null;
    score: number | null;
    isPicked: boolean;
    isWinner: boolean;
    isLoser: boolean;
    status: "correct" | "wrong" | "pending" | "none";
    isFinished: boolean;
    isLocked: boolean;
    onClick: () => void;
}) {
    if (!team) {
        return (
            <div className="flex items-center justify-between p-1.5 rounded-md bg-muted/30 opacity-40">
                <span className="text-[10px] text-muted-foreground italic">TBD</span>
            </div>
        );
    }

    const rowBase = "flex items-center justify-between p-1.5 rounded-md transition-all duration-150";
    const clickable = !isLocked ? "cursor-pointer hover:bg-primary/10 active:scale-95" : "cursor-default";

    let rowColor = "";
    if (isPicked && status === "correct") rowColor = "bg-green-500/15 ring-1 ring-green-500/40";
    else if (isPicked && status === "wrong") rowColor = "bg-red-500/15 ring-1 ring-red-500/40";
    else if (isPicked && status === "pending") rowColor = "bg-primary/10 ring-1 ring-primary/30";
    else if (isWinner) rowColor = "bg-green-500/10";
    else if (isLoser) rowColor = "opacity-50";

    return (
        <div className={`${rowBase} ${clickable} ${rowColor}`} onClick={onClick} title={isLocked ? undefined : `Pick ${team.name}`}>
            <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-base leading-none">{team.flag}</span>
                <span className={`text-[11px] font-semibold truncate max-w-[90px] ${isPicked ? "font-black" : ""}`}>
                    {team.name}
                </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
                {score !== null && (
                    <span className="font-black text-xs bg-secondary/60 px-1.5 py-0.5 rounded min-w-[20px] text-center">
                        {score}
                    </span>
                )}
                {isPicked && status === "correct" && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                {isPicked && status === "wrong" && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                {isPicked && status === "pending" && <span className="w-3 h-3 rounded-full bg-primary/60 inline-block" />}
            </div>
        </div>
    );
}

// ─── Champion Banner ──────────────────────────────────────────────────────────

function ChampionBanner({
    teamName,
    isFinal,
    isCorrect,
}: {
    teamName: string;
    isFinal: boolean;
    isCorrect: "correct" | "wrong" | "pending" | "none";
}) {
    const flag = getFlag(teamName);

    return (
        <div className={`mt-8 rounded-2xl p-6 text-center border-2 transition-all ${isCorrect === "correct"
            ? "bg-green-500/10 border-green-500/50 shadow-[0_0_40px_rgba(34,197,94,0.2)]"
            : isCorrect === "wrong"
                ? "bg-red-500/10 border-red-500/40"
                : "bg-yellow-500/10 border-yellow-500/30 shadow-[0_0_40px_rgba(234,179,8,0.15)]"
            }`}>
            <div className="flex flex-col items-center gap-2">
                <Trophy className={`w-8 h-8 ${isCorrect === "correct" ? "text-green-500" : isCorrect === "wrong" ? "text-red-500" : "text-yellow-500"}`} />
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {isFinal
                        ? isCorrect === "correct"
                            ? "🎉 You picked the champion correctly!"
                            : isCorrect === "wrong"
                                ? "💔 Not quite — better luck next time"
                                : "Tournament Complete"
                        : "Your Predicted Champion"}
                </div>
                <div className="text-5xl">{flag}</div>
                <div className="text-2xl font-black tracking-wide">{teamName}</div>
            </div>
        </div>
    );
}

// ─── Helper: collect downstream match IDs from a pick ─────────────────────────

function collectDownstreamIds(startMatchId: string, slots: BracketMatch[]): string[] {
    const result: string[] = [startMatchId];
    const queue = [startMatchId];

    while (queue.length > 0) {
        const matchId = queue.shift()!;
        const match = slots.find(m => m.id === matchId);
        if (!match || match.isThirdPlace) continue;

        const currentRoundIndex = KNOCKOUT_ROUNDS.indexOf(match.round);
        if (currentRoundIndex < 0 || currentRoundIndex >= KNOCKOUT_ROUNDS.length - 1) continue;

        const nextRound = KNOCKOUT_ROUNDS[currentRoundIndex + 1];
        const roundMatches = slots.filter(m => m.round === match.round && !m.isThirdPlace).sort((a, b) => a.position - b.position);
        const matchIndex = roundMatches.findIndex(m => m.id === matchId);
        const nextRoundMatches = slots.filter(m => m.round === nextRound && !m.isThirdPlace).sort((a, b) => a.position - b.position);
        const nextMatchIndex = Math.floor(matchIndex / 2);
        const nextMatch = nextRoundMatches[nextMatchIndex];

        if (nextMatch && !result.includes(nextMatch.id)) {
            result.push(nextMatch.id);
            queue.push(nextMatch.id);
        }
    }

    return result;
}
