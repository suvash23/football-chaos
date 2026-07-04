"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchMatches, TEAMS, type Match, type Goal } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Trophy, Info, CheckCircle2, XCircle, Lock, Printer } from "lucide-react";
import { toast } from "sonner";
import { Flag } from "@/components/flag";
import { format } from "date-fns";

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
    goals1?: Goal[];
    goals2?: Goal[];
    scoreDetail?: {
        ht?: [number, number];
        ft?: [number, number];
        et?: [number, number];
        p?: [number, number];
    };
    kickoffTime?: string;
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

    // Penalties decider
    if (match.scoreDetail?.p) {
        const [hp, ap] = match.scoreDetail.p;
        if (hp > ap) return match.home?.name ?? null;
        if (ap > hp) return match.away?.name ?? null;
    }
    return null; // Draw
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

const ROUND_SEQUENCES: Record<string, number[]> = {
    "Round of 32": [74, 77, 73, 75, 83, 84, 81, 82, 76, 78, 79, 80, 86, 88, 85, 87],
    "Round of 16": [89, 90, 93, 94, 91, 92, 95, 96],
    "Quarter-final": [97, 98, 99, 100],
    "Semi-final": [101, 102],
    "Final": [104],
};

function buildBracketSlots(matches: Match[]): BracketMatch[] {
    const result: BracketMatch[] = [];

    const koMatches = matches.filter(m =>
        (KNOCKOUT_ROUNDS as readonly string[]).includes(m.round) || m.round === "Match for third place"
    );

    KNOCKOUT_ROUNDS.forEach(round => {
        const seq = ROUND_SEQUENCES[round] || [];
        const roundMatches = koMatches
            .filter(m => m.round === round)
            .sort((a, b) => {
                const aNum = a.match_number ?? 0;
                const bNum = b.match_number ?? 0;
                const idxA = seq.indexOf(aNum);
                const idxB = seq.indexOf(bNum);
                if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                if (idxA !== -1) return -1;
                if (idxB !== -1) return 1;
                return aNum - bNum;
            });

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
                goals1: m.goals1,
                goals2: m.goals2,
                scoreDetail: m.score_detail,
                kickoffTime: m.kickoff_time,
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
            goals1: m.goals1,
            goals2: m.goals2,
            scoreDetail: m.score_detail,
            kickoffTime: m.kickoff_time,
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
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        window.print();
    };

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

                // Determine the loser of the semi-final if we are in semi-final round
                let loserTeam: TeamSlot | null = null;
                if (match.round === "Semi-final") {
                    if (pickedTeam.name === match.home?.name) {
                        loserTeam = match.away;
                    } else if (pickedTeam.name === match.away?.name) {
                        loserTeam = match.home;
                    }
                }

                // Place the pick into next round's slot (update bracketSlots)
                setBracketSlots(prevSlots =>
                    prevSlots.map(slot => {
                        if (slot.id === nextMatch.id) {
                            if (isHome) {
                                return { ...slot, home: pickedTeam };
                            } else {
                                return { ...slot, away: pickedTeam };
                            }
                        }
                        if (match.round === "Semi-final" && slot.isThirdPlace) {
                            if (isHome) {
                                return { ...slot, home: loserTeam };
                            } else {
                                return { ...slot, away: loserTeam };
                            }
                        }
                        return slot;
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

                // Also clear third place pick if the loser changes
                if (match.round === "Semi-final") {
                    const thirdPlaceMatch = bracketSlots.find(s => s.isThirdPlace);
                    if (thirdPlaceMatch && loserTeam) {
                        const oldPickInThird = updated[thirdPlaceMatch.id];
                        const previousLoser = isHome ? thirdPlaceMatch.home?.name : thirdPlaceMatch.away?.name;
                        if (oldPickInThird && oldPickInThird === previousLoser && previousLoser !== loserTeam.name) {
                            delete updated[thirdPlaceMatch.id];
                        }
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

    return (
        <div className="container mx-auto px-4 py-8 max-w-full">
            {/* Print styles injected inline */}
            <style>{`
                @media print {
                    /* Hide everything but the bracket */
                    nav, header, footer,
                    .no-print { display: none !important; }
                    body { background: white !important; color: black !important; }
                    .print-bracket {
                        width: 100% !important;
                        overflow: visible !important;
                        padding: 0 !important;
                    }
                    /* Force colour cards to print */
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    @page { size: A3 landscape; margin: 10mm; }
                }
            `}</style>
            {/* Header */}
            <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black italic uppercase tracking-wider mb-1 flex items-center gap-2">
                        <div className="relative w-8 h-10 shrink-0 drop-shadow-[0_4px_8px_rgba(234,179,8,0.4)]">
                            <Image src="/wc-trophy.png" alt="World Cup Trophy" fill className="object-contain" />
                        </div>
                        Bracket Builder
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

                    {/* Print / Download PDF — available to all users */}
                    <Button
                        onClick={handlePrint}
                        variant="outline"
                        className="font-bold gap-2 no-print"
                    >
                        <Printer className="w-4 h-4" />
                        Print / Save PDF
                    </Button>
                </div>
            </div>

            {/* Info Banner */}
            <div className="no-print flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 mb-6 text-sm text-blue-700 dark:text-blue-300">
                <Info className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                    Click a team to pick them as the winner. Their name will advance to the next round.
                    After matches finish, your picks will show <strong>✅ correct</strong> or <strong>❌ wrong</strong>.
                </span>
            </div>

            {/* Round Tabs */}
            <div className="no-print flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
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
            <div ref={printRef} className="print-bracket w-full overflow-x-auto pb-8">
                {activeRound === "All" ? (
                    // Split Bracket Layout (Left Side vs Right Side)
                    <div className="flex gap-6 min-w-max items-stretch px-4">
                        {/* 1. R32 Left */}
                        <BracketColumn
                            title="Round of 32 (Left)"
                            matches={bracketSlots.filter(m => m.round === "Round of 32" && m.position < 8)}
                            picks={picks}
                            onPick={handlePick}
                        />
                        {/* 2. R16 Left */}
                        <BracketColumn
                            title="Round of 16 (Left)"
                            matches={bracketSlots.filter(m => m.round === "Round of 16" && m.position < 4)}
                            picks={picks}
                            onPick={handlePick}
                        />
                        {/* 3. QF Left */}
                        <BracketColumn
                            title="Quarter-final (Left)"
                            matches={bracketSlots.filter(m => m.round === "Quarter-final" && m.position < 2)}
                            picks={picks}
                            onPick={handlePick}
                        />
                        {/* 4. SF Left */}
                        <BracketColumn
                            title="Semi-final (Left)"
                            matches={bracketSlots.filter(m => m.round === "Semi-final" && m.position === 0)}
                            picks={picks}
                            onPick={handlePick}
                        />

                        {/* 5. Center (Finals + 3rd Place) */}
                        <div className="flex flex-col gap-3 w-[260px] justify-between py-8">
                            <div className="flex flex-col gap-3 justify-center flex-1">
                                <div className="text-xs font-black py-2 px-3 rounded-xl text-center uppercase tracking-widest bg-primary text-primary-foreground border border-primary">
                                    Final
                                </div>
                                {(() => {
                                    const m = bracketSlots.find(m => m.round === "Final" && !m.isThirdPlace);
                                    return m ? (
                                        <BracketMatchCard
                                            match={m}
                                            pick={picks[m.id]}
                                            onPick={handlePick}
                                        />
                                    ) : (
                                        <div className="text-center text-muted-foreground text-xs italic py-4">TBD</div>
                                    );
                                })()}
                            </div>

                            {/* Third Place playoff */}
                            {(() => {
                                const m = bracketSlots.find(m => m.isThirdPlace);
                                return m ? (
                                    <div className="mt-8 flex flex-col gap-2">
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">
                                            🥉 3rd Place Playoff
                                        </div>
                                        <BracketMatchCard
                                            match={m}
                                            pick={picks[m.id]}
                                            onPick={handlePick}
                                            isThirdPlace
                                        />
                                    </div>
                                ) : null;
                            })()}
                        </div>

                        {/* 6. SF Right */}
                        <BracketColumn
                            title="Semi-final (Right)"
                            matches={bracketSlots.filter(m => m.round === "Semi-final" && m.position === 1)}
                            picks={picks}
                            onPick={handlePick}
                        />
                        {/* 7. QF Right */}
                        <BracketColumn
                            title="Quarter-final (Right)"
                            matches={bracketSlots.filter(m => m.round === "Quarter-final" && m.position >= 2)}
                            picks={picks}
                            onPick={handlePick}
                        />
                        {/* 8. R16 Right */}
                        <BracketColumn
                            title="Round of 16 (Right)"
                            matches={bracketSlots.filter(m => m.round === "Round of 16" && m.position >= 4)}
                            picks={picks}
                            onPick={handlePick}
                        />
                        {/* 9. R32 Right */}
                        <BracketColumn
                            title="Round of 32 (Right)"
                            matches={bracketSlots.filter(m => m.round === "Round of 32" && m.position >= 8)}
                            picks={picks}
                            onPick={handlePick}
                        />
                    </div>
                ) : (() => {
                    const splitRounds = ["Round of 32", "Round of 16", "Quarter-final"];
                    const isSplit = splitRounds.includes(activeRound);
                    const allRoundMatches = bracketSlots
                        .filter(m => m.round === activeRound && !m.isThirdPlace)
                        .sort((a, b) => a.position - b.position);
                    const half = Math.ceil(allRoundMatches.length / 2);
                    const leftMatches = allRoundMatches.slice(0, half);
                    const rightMatches = allRoundMatches.slice(half);

                    if (isSplit) {
                        return (
                            <div className="flex gap-6 justify-center items-start px-4">
                                <BracketColumn
                                    title={`${activeRound} (Left)`}
                                    matches={leftMatches}
                                    picks={picks}
                                    onPick={handlePick}
                                    widthClass="w-[280px]"
                                />
                                <BracketColumn
                                    title={`${activeRound} (Right)`}
                                    matches={rightMatches}
                                    picks={picks}
                                    onPick={handlePick}
                                    widthClass="w-[280px]"
                                />
                            </div>
                        );
                    }

                    return (
                        // SF / Final — single centred column
                        <div className="flex justify-center items-start px-4">
                            <BracketColumn
                                title={activeRound}
                                matches={allRoundMatches}
                                picks={picks}
                                onPick={handlePick}
                                widthClass="w-[320px]"
                                thirdPlaceMatches={activeRound === "Final" ? bracketSlots.filter(m => m.isThirdPlace) : []}
                            />
                        </div>
                    );
                })()}
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
                <div className="text-[9px] text-muted-foreground font-semibold flex flex-col gap-0.5 mb-1.5 pb-1.5 border-b border-border/50">
                    <div className="flex justify-between items-center w-full">
                        <span className="uppercase tracking-wider font-bold">{isThirdPlace ? "3rd Place" : match.round}</span>
                        {hasActiveScore && (
                            <span className={`font-black ${match.status === "live" ? "text-green-500 animate-pulse" : ""}`}>
                                {match.status === "live" ? "🟢 LIVE" : "FINAL"}
                            </span>
                        )}
                    </div>
                    {match.kickoffTime && (
                        <div suppressHydrationWarning className="text-[8px] opacity-75 font-normal">
                            {format(new Date(match.kickoffTime), "EEE MMM d, h:mm a")} <span className="opacity-60">Local</span>
                        </div>
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
                        isLocked={isFinished}
                        onClick={() => {
                            if (!match.home || isFinished) return;
                            onPick(match.id, match.home);
                        }}
                        goals={match.goals1}
                    />
                    <TeamRow
                        team={match.away}
                        score={match.actualAwayScore}
                        isWinner={actualWinner === match.away?.name}
                        isLoser={isFinished && actualWinner !== null && actualWinner !== match.away?.name}
                        isPicked={pick === match.away?.name}
                        status={pick === match.away?.name ? status : "none"}
                        isLocked={isFinished}
                        onClick={() => {
                            if (!match.away || isFinished) return;
                            onPick(match.id, match.away);
                        }}
                        goals={match.goals2}
                    />
                </div>

                {/* Score details (HT, FT, ET, Penalties) */}
                {(() => {
                    const sd = match.scoreDetail;
                    if (!sd) return null;
                    const parts: string[] = [];
                    if (sd.ht) parts.push(`HT ${sd.ht[0]}-${sd.ht[1]}`);
                    if (sd.ft && (sd.et || sd.p)) parts.push(`FT ${sd.ft[0]}-${sd.ft[1]}`);
                    if (sd.et) parts.push(`AET ${sd.et[0]}-${sd.et[1]}`);
                    if (sd.p) parts.push(`PEN ${sd.p[0]}-${sd.p[1]}`);
                    if (parts.length === 0) return null;
                    return (
                        <div className="mt-1.5 pt-1.5 border-t border-border/30 flex flex-wrap justify-center gap-1.5 text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                            {parts.map((p, idx) => (
                                <span key={idx} className="bg-muted px-1.5 py-0.5 rounded border border-border/10 dark:bg-zinc-800/80">
                                    {p}
                                </span>
                            ))}
                        </div>
                    );
                })()}
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
    goals,
}: {
    team: TeamSlot | null;
    score: number | null;
    isPicked: boolean;
    isWinner: boolean;
    isLoser: boolean;
    status: "correct" | "wrong" | "pending" | "none";
    isLocked: boolean;
    onClick: () => void;
    goals?: Goal[];
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
        <div className={`${rowBase} ${clickable} ${rowColor} flex-col !items-stretch gap-0.5`} onClick={onClick} title={isLocked ? undefined : `Pick ${team.name}`}>
            <div className="flex items-center justify-between min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                    <Flag emoji={team.flag} size={16} />
                    <span className={`text-[11px] font-semibold truncate max-w-[120px] ${isPicked ? "font-black" : ""}`}>
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
            {goals && goals.length > 0 && (
                <div className="flex flex-wrap gap-1 pl-5 pt-0.5 pb-0.5">
                    {goals.map((g, i) => (
                        <span key={i} className="text-[8px] text-muted-foreground/75 bg-muted/30 px-1.5 py-0.5 rounded flex items-center gap-0.5 scale-95 origin-left">
                            ⚽ {g.name} {g.minute}&apos;{g.penalty ? '(P)' : ''}{g.owngoal ? '(OG)' : ''}
                        </span>
                    ))}
                </div>
            )}
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

// ─── BracketColumn Component ───────────────────────────────────────────────────

function BracketColumn({
    title,
    matches,
    picks,
    onPick,
    widthClass = "w-[220px]",
    thirdPlaceMatches = []
}: {
    title: string;
    matches: BracketMatch[];
    picks: BracketPicks;
    onPick: (matchId: string, team: TeamSlot) => void;
    widthClass?: string;
    thirdPlaceMatches?: BracketMatch[];
}) {
    return (
        <div className={`flex flex-col gap-3 ${widthClass}`}>
            <div className="text-xs font-black py-2 px-3 rounded-xl text-center uppercase tracking-widest bg-secondary/60 border border-border/50 text-muted-foreground">
                {title}
            </div>
            <div className={`flex flex-col flex-1 justify-around gap-2 py-2 min-h-[600px]`}>
                {matches.map((match) => (
                    <BracketMatchCard
                        key={match.id}
                        match={match}
                        pick={picks[match.id]}
                        onPick={onPick}
                    />
                ))}
                {matches.length === 0 && (
                    <div className="text-center text-muted-foreground text-xs italic py-4">
                        Matches TBD
                    </div>
                )}
            </div>
            {thirdPlaceMatches.length > 0 && (
                <div className="mt-4 flex flex-col gap-2">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">
                        🥉 3rd Place Playoff
                    </div>
                    {thirdPlaceMatches.map(match => (
                        <BracketMatchCard
                            key={match.id}
                            match={match}
                            pick={picks[match.id]}
                            onPick={onPick}
                            isThirdPlace
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
