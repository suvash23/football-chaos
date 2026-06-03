import { SQUADS, TEAMS } from "@/lib/data";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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

            {/* Team Header */}
            <div className="flex flex-col md:flex-row items-center gap-8 mb-12 animate-in fade-in slide-in-from-bottom-4">
                <div className="text-8xl md:text-9xl drop-shadow-2xl animate-bounce-slow">
                    {teamMeta?.flag_icon || "🚩"}
                </div>
                <div className="text-center md:text-left space-y-2">
                    <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500">
                        {teamSquad.team}
                    </h1>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-muted-foreground uppercase font-bold tracking-widest text-sm">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-muted/50 rounded-full">
                            <Trophy className="h-4 w-4 text-yellow-500" />
                            {teamMeta?.group || "World Cup 2026"}
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-muted/50 rounded-full">
                            <MapPin className="h-4 w-4 text-blue-500" />
                            {teamMeta?.continent || "FIFA"}
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-muted/50 rounded-full">
                            <Users className="h-4 w-4 text-green-500" />
                            {teamSquad.players.length} Players
                        </div>
                    </div>
                </div>
            </div>

            {/* Squad Table */}
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
