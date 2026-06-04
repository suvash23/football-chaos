import { SQUADS, TEAMS, WORLD_CUP_WINNERS } from "@/lib/data";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Users, Trophy, MapPin, User } from "lucide-react";

interface PageProps {
    params: Promise<{ teamName: string }>;
}

export default async function TeamPage({ params }: PageProps) {
    const { teamName } = await params;
    const decodedName = decodeURIComponent(teamName);

    const teamSquad = SQUADS.find(s => s.team.toLowerCase() === decodedName.toLowerCase());
    const teamMeta = TEAMS.find(t => t.name.toLowerCase() === decodedName.toLowerCase());

    if (!teamSquad) {
        notFound();
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Back Button */}
            <Link href="/groups">
                <Button variant="ghost" className="mb-6 gap-2 hover:bg-primary/10 transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Back to Groups
                </Button>
            </Link>

            {/* Team Header - 50/50 grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 animate-in fade-in slide-in-from-bottom-4">
                {/* Left: Flag + Name + Meta */}
                <Card className="border-border/50 bg-card/30 backdrop-blur-xl shadow-xl overflow-hidden">
                    <CardContent className="p-6 flex flex-col md:flex-row items-center md:items-start gap-5 h-full">
                        <div className="text-7xl drop-shadow-2xl shrink-0">
                            {teamMeta?.flag_icon || "🚩"}
                        </div>
                        <div className="text-center md:text-left space-y-3">
                            <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500">
                                {teamSquad.team}
                            </h1>
                            <div className="flex flex-wrap justify-center md:justify-start gap-2 text-muted-foreground uppercase font-bold tracking-widest text-xs">
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-muted/50 rounded-full">
                                    <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                                    {teamMeta?.group || "World Cup 2026"}
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-muted/50 rounded-full">
                                    <MapPin className="h-3.5 w-3.5 text-blue-500" />
                                    {teamMeta?.continent || "FIFA"}
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-muted/50 rounded-full">
                                    <Users className="h-3.5 w-3.5 text-green-500" />
                                    {teamSquad.players.length} Players
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Right: World Cup Legacy */}
                {(() => {
                    const record = WORLD_CUP_WINNERS[teamSquad.team];
                    if (!record) return (
                        <Card className="border-border/50 bg-card/30 backdrop-blur-xl shadow-xl overflow-hidden flex items-center justify-center">
                            <CardContent className="p-6 text-center text-muted-foreground">
                                <Trophy className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                <p className="text-sm font-black uppercase tracking-widest opacity-40">No World Cup titles yet</p>
                            </CardContent>
                        </Card>
                    );
                    return (
                        <Card className="border-yellow-500/20 bg-yellow-500/5 backdrop-blur-xl shadow-xl overflow-hidden animate-in fade-in duration-700">
                            <CardHeader className="py-3 px-5 border-b border-yellow-500/15">
                                <CardTitle className="flex items-center gap-2 text-sm font-black uppercase italic tracking-wider text-yellow-500">
                                    <Trophy className="h-4 w-4" />
                                    World Cup Legacy
                                    <span className="ml-auto text-xs font-black bg-yellow-500/15 text-yellow-500 border border-yellow-500/20 px-2 py-0.5 rounded-full">
                                        {record.winners}× Champ
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="py-4 px-5 space-y-4">
                                {record.yearsWon.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-yellow-500/70 mb-2">🏆 Champion</p>
                                        <div className="flex flex-wrap gap-3">
                                            {record.yearsWon.map((year) => (
                                                <div key={year} className="flex flex-col items-center gap-1 group cursor-default">
                                                    <div className="relative w-9 h-11 group-hover:scale-125 transition-transform duration-300 drop-shadow-[0_4px_8px_rgba(234,179,8,0.5)]">
                                                        <Image src="/wc-trophy.png" alt={`WC ${year}`} fill className="object-contain" />
                                                    </div>
                                                    <span className="text-[10px] font-black text-yellow-500">{year}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {record.yearsRunnerUp.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400/70 mb-2">🥈 Runner-Up</p>
                                        <div className="flex flex-wrap gap-3">
                                            {record.yearsRunnerUp.map((year) => (
                                                <div key={year} className="flex flex-col items-center gap-1 group cursor-default">
                                                    <div className="relative w-9 h-11 opacity-35 grayscale group-hover:opacity-70 group-hover:scale-110 transition-all duration-300">
                                                        <Image src="/wc-trophy.png" alt={`RU ${year}`} fill className="object-contain" />
                                                    </div>
                                                    <span className="text-[10px] font-black text-slate-400">{year}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })()}
            </div>

            <Card className="border-border/50 bg-card/30 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
                <CardHeader className="bg-muted/50 border-b border-border/50 py-6">
                    <CardTitle className="flex items-center gap-3 text-2xl font-black uppercase italic tracking-wider">
                        <Users className="h-6 w-6 text-primary" />
                        Official Squad List
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="text-left bg-muted/20 text-muted-foreground text-xs uppercase font-black tracking-widest border-b border-border/50">
                                    <th className="px-6 py-4 w-16">No.</th>
                                    <th className="px-6 py-4">Player</th>
                                    <th className="px-6 py-4 w-20 text-center">Pos.</th>
                                    <th className="px-6 py-4 hidden md:table-cell">Club</th>
                                    <th className="px-6 py-4 hidden lg:table-cell text-center">Caps</th>
                                    <th className="px-6 py-4 hidden lg:table-cell text-center">Goals</th>
                                    <th className="px-6 py-4 hidden sm:table-cell">Age / DoB</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {teamSquad.players.map((player, idx) => (
                                    <tr
                                        key={`${player.name}-${idx}`}
                                        className="hover:bg-primary/5 transition-colors group cursor-default"
                                    >
                                        <td className="px-6 py-4 font-black text-primary/60 group-hover:text-primary transition-colors">
                                            #{player.no}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-all">
                                                    <User className="h-4 w-4" />
                                                </div>
                                                <span className="font-bold text-base">{player.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase border ${player.pos === 'GK' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                player.pos === 'DF' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                                                    player.pos === 'MF' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                                                        'bg-red-500/10 text-red-500 border-red-500/20'
                                                }`}>
                                                {player.pos}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell text-sm text-muted-foreground italic">
                                            {player.club}
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell text-center font-mono text-sm">
                                            {player.caps}
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell text-center font-mono text-sm font-bold text-primary">
                                            {player.goals}
                                        </td>
                                        <td className="px-6 py-4 hidden sm:table-cell text-xs text-muted-foreground">
                                            {player.dob}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
