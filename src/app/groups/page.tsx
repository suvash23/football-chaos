"use client";

import { useEffect, useState } from "react";
import { fetchMatches, TEAMS, type Match, type Team } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";
import Link from "next/link";
import { format } from "date-fns";
import { Flag } from "@/components/flag";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamStanding {
    team: Team;
    mp: number;  // Matches Played
    w: number;   // Wins
    d: number;   // Draws
    l: number;   // Losses
    gf: number;  // Goals For
    ga: number;  // Goals Against
    gd: number;  // Goal Difference
    pts: number; // Points
}

// ─── Standings Calculator ─────────────────────────────────────────────────────

function computeStandings(groupTeams: Team[], groupMatches: Match[]): TeamStanding[] {
    const map: Record<string, TeamStanding> = {};

    groupTeams.forEach(team => {
        map[team.name] = { team, mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
    });

    groupMatches.forEach(match => {
        if (match.status !== "finished" || match.home_score === null || match.away_score === null) return;

        const home = map[match.home_team];
        const away = map[match.away_team];
        if (!home || !away) return;

        const hs = match.home_score;
        const as_ = match.away_score;

        home.mp++;
        away.mp++;
        home.gf += hs;
        home.ga += as_;
        away.gf += as_;
        away.ga += hs;

        if (hs > as_) {
            home.w++; home.pts += 3;
            away.l++;
        } else if (hs < as_) {
            away.w++; away.pts += 3;
            home.l++;
        } else {
            home.d++; home.pts += 1;
            away.d++; away.pts += 1;
        }

        home.gd = home.gf - home.ga;
        away.gd = away.gf - away.ga;
    });

    return Object.values(map).sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.gd !== a.gd) return b.gd - a.gd;
        if (b.gf !== a.gf) return b.gf - a.gf;
        return a.team.name.localeCompare(b.team.name);
    });
}

// ─── Status badge helper ──────────────────────────────────────────────────────

function MatchStatusBadge({ status }: { status: string }) {
    if (status === "live") {
        return (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-500/10 border border-green-500/30 rounded-full px-2 py-0.5 animate-pulse">
                🟢 LIVE
            </span>
        );
    }
    if (status === "finished") {
        return <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">FT</span>;
    }
    return null;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function GroupsPage() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchMatches(true)
            .then(data => setMatches(data))
            .catch(err => console.error("Error loading groups:", err))
            .finally(() => setIsLoading(false));
    }, []);

    // Group teams by group name
    const groupedTeams = TEAMS.reduce((acc, team) => {
        if (!acc[team.group]) acc[team.group] = [];
        acc[team.group].push(team);
        return acc;
    }, {} as Record<string, Team[]>);

    const sortedGroupNames = Object.keys(groupedTeams).sort();

    // Group-stage matches only
    const groupMatches = matches.filter(m =>
        m.round?.toLowerCase().startsWith("group") ||
        // also match by group field: group_name is populated
        sortedGroupNames.includes(m.group)
    );

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header */}
            <div className="flex flex-col items-center justify-center text-center space-y-3 mb-10">
                <div className="p-3 w-16 h-16 rounded-2xl bg-primary/20 text-primary flex items-center justify-center">
                    <Globe className="w-8 h-8" />
                </div>
                <h1 className="text-4xl font-black italic tracking-tight uppercase">Tournament Groups</h1>
                <p className="text-muted-foreground text-lg max-w-2xl">
                    Live standings for all 12 groups. Updates as matches are played.
                </p>
            </div>

            {isLoading && (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            )}

            {!isLoading && (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {sortedGroupNames.map(groupName => {
                        const teams = groupedTeams[groupName];
                        const gMatches = groupMatches.filter(m => m.group === groupName);
                        const standings = computeStandings(teams, gMatches);
                        const hasStarted = gMatches.some(m => m.status === "finished" || m.status === "live");

                        return (
                            <Card
                                key={groupName}
                                className="overflow-hidden border-border/50 bg-card/60 backdrop-blur shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                                {/* Card Header */}
                                <CardHeader className="bg-primary/10 border-b border-border/50 py-3 px-4">
                                    <CardTitle className="text-center text-xl font-black uppercase tracking-widest text-primary">
                                        {groupName}
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="p-0">
                                    {/* Standings Table */}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-muted/40 border-b border-border/50">
                                                    <th className="text-left pl-3 pr-1 py-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground w-6">#</th>
                                                    <th className="text-left pl-1 py-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Team</th>
                                                    <th className="text-center py-2 px-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground w-7" title="Matches Played">MP</th>
                                                    <th className="text-center py-2 px-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground w-7" title="Wins">W</th>
                                                    <th className="text-center py-2 px-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground w-7" title="Draws">D</th>
                                                    <th className="text-center py-2 px-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground w-7" title="Losses">L</th>
                                                    <th className="text-center py-2 px-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground w-7" title="Goals For">GF</th>
                                                    <th className="text-center py-2 px-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground w-7" title="Goals Against">GA</th>
                                                    <th className="text-center py-2 px-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground w-8" title="Goal Difference">GD</th>
                                                    <th className="text-center py-2 pl-1 pr-3 text-[10px] font-black uppercase tracking-wider text-primary w-8" title="Points">Pts</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {standings.map((row, idx) => {
                                                    // Top 2 advance (qualify zone), 3rd/4th can go as best 3rd place
                                                    const isQualified = idx < 2 && hasStarted;
                                                    const isBorderRow = idx === 1;

                                                    return (
                                                        <tr
                                                            key={row.team.name}
                                                            className={`border-b border-border/30 transition-colors hover:bg-muted/30 ${isQualified ? "bg-green-500/5" : ""} ${isBorderRow ? "border-b-2 border-green-500/30" : ""}`}
                                                        >
                                                            {/* Rank */}
                                                            <td className="pl-3 pr-1 py-2.5 text-center">
                                                                <span className={`text-xs font-black ${isQualified ? "text-green-600" : "text-muted-foreground"}`}>
                                                                    {idx + 1}
                                                                </span>
                                                            </td>

                                                            {/* Team */}
                                                            <td className="pl-1 py-2.5 pr-2">
                                                                <Link
                                                                    href={`/teams/${encodeURIComponent(row.team.name)}`}
                                                                    className="flex items-center gap-2 group"
                                                                >
                                                                    <Flag emoji={row.team.flag_icon} size={20} />
                                                                    <span className="font-semibold text-xs leading-tight group-hover:text-primary transition-colors truncate max-w-[80px]">
                                                                        {row.team.name}
                                                                    </span>
                                                                </Link>
                                                            </td>

                                                            {/* Stats */}
                                                            <td className="text-center py-2.5 px-1 text-xs font-medium tabular-nums">{row.mp}</td>
                                                            <td className="text-center py-2.5 px-1 text-xs font-medium tabular-nums">{row.w}</td>
                                                            <td className="text-center py-2.5 px-1 text-xs font-medium tabular-nums">{row.d}</td>
                                                            <td className="text-center py-2.5 px-1 text-xs font-medium tabular-nums">{row.l}</td>
                                                            <td className="text-center py-2.5 px-1 text-xs font-medium tabular-nums">{row.gf}</td>
                                                            <td className="text-center py-2.5 px-1 text-xs font-medium tabular-nums">{row.ga}</td>
                                                            <td className={`text-center py-2.5 px-1 text-xs font-bold tabular-nums ${row.gd > 0 ? "text-green-600" : row.gd < 0 ? "text-red-500" : "text-muted-foreground"}`}>
                                                                {row.gd > 0 ? `+${row.gd}` : row.gd}
                                                            </td>
                                                            <td className="text-center py-2.5 pl-1 pr-3">
                                                                <span className="font-black text-sm text-primary tabular-nums">
                                                                    {row.pts}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Legend: qualified zone */}
                                    {hasStarted && (
                                        <div className="flex items-center gap-2 px-3 py-2 border-t border-border/30">
                                            <div className="w-2.5 h-2.5 rounded-sm bg-green-500/20 border border-green-500/40 shrink-0" />
                                            <span className="text-[10px] text-muted-foreground font-medium">Knockout stage qualification zone</span>
                                        </div>
                                    )}

                                    {/* Fixtures */}
                                    {gMatches.length > 0 && (
                                        <div className="border-t border-border/40">
                                            <div className="px-3 pt-3 pb-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                                Fixtures
                                            </div>
                                            <ul className="divide-y divide-border/30">
                                                {gMatches
                                                    .slice()
                                                    .sort((a, b) => new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime())
                                                    .map(match => (
                                                        <li key={match.id} className="flex items-center justify-between px-3 py-2 hover:bg-muted/20 transition-colors gap-2">
                                                            {/* Date */}
                                                            <span className="text-[10px] text-muted-foreground font-medium shrink-0 w-10" suppressHydrationWarning>
                                                                {format(new Date(match.kickoff_time), "MMM d")}
                                                            </span>

                                                            {/* Match */}
                                                            <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-center">
                                                                <span className="text-sm leading-none" title={match.home_team}>{match.home_flag}</span>
                                                                <span className="text-[10px] font-bold truncate max-w-[52px] text-right">{match.home_team}</span>

                                                                {(match.status === "finished" || match.status === "live") && match.home_score !== null ? (
                                                                    <span className={`font-black text-xs px-1.5 py-0.5 rounded min-w-[32px] text-center ${match.status === "live" ? "bg-green-500 text-white" : "bg-secondary"}`}>
                                                                        {match.home_score}–{match.away_score}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[10px] font-bold text-muted-foreground px-1" suppressHydrationWarning>
                                                                        {format(new Date(match.kickoff_time), "HH:mm")}
                                                                    </span>
                                                                )}

                                                                <span className="text-[10px] font-bold truncate max-w-[52px] text-left">{match.away_team}</span>
                                                                <span className="text-sm leading-none" title={match.away_team}>{match.away_flag}</span>
                                                            </div>

                                                            {/* Status */}
                                                            <div className="shrink-0 w-12 flex justify-end">
                                                                <MatchStatusBadge status={match.status} />
                                                            </div>
                                                        </li>
                                                    ))}
                                            </ul>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
