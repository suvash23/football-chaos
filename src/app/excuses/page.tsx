"use client";

import { useState } from "react";
import { EXCUSE_TEMPLATES, TEAMS } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MessageSquareText, Copy, Shuffle, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// SVG icons for social platforms
const TwitterXIcon = () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
);

const FacebookIcon = () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);

const OUTCOMES = ["draw", "loss", "bottling", "disasterclass"];

export default function ExcusesPage() {
    const sortedTeams = [...TEAMS].sort((a, b) => a.name.localeCompare(b.name));

    const [team, setTeam] = useState(sortedTeams[0].name);
    const [outcome, setOutcome] = useState(OUTCOMES[1]);
    const [excuse, setExcuse] = useState<string | null>(null);
    const [openTeam, setOpenTeam] = useState(false);

    const selectedTeam = sortedTeams.find(t => t.name === team);

    const shareToTwitter = () => {
        if (!excuse) return;
        const text = encodeURIComponent(excuse + " #WorldCup2026 #FootballChaos");
        window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank", "noopener,noreferrer");
    };

    const shareToFacebook = () => {
        if (!excuse) return;
        const url = encodeURIComponent(window.location.href);
        const quote = encodeURIComponent(excuse);
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${quote}`, "_blank", "noopener,noreferrer");
    };

    const generateExcuse = () => {
        const template = EXCUSE_TEMPLATES[Math.floor(Math.random() * EXCUSE_TEMPLATES.length)];
        const generated = template.replace("{outcome}", outcome);
        // Modern format with hashtags
        const formattedTeam = team.replace(/\s+/g, "");
        setExcuse(`${generated} #${formattedTeam} ${selectedTeam?.flag_icon || ""} #WorldCup2026 #FootballChaos`);
    };

    const copyToClipboard = () => {
        if (excuse) {
            navigator.clipboard.writeText(excuse);
            toast.success("Copied to clipboard!", { description: "Ready to go viral." });
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 max-w-3xl">
            <div className="flex flex-col items-center justify-center text-center space-y-4 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="p-4 w-20 h-20 rounded-3xl bg-green-500/10 text-green-500 flex items-center justify-center mb-2 shadow-inner border border-green-500/20">
                    <MessageSquareText className="w-10 h-10" />
                </div>
                <h1 className="text-5xl font-black italic tracking-tighter uppercase leading-none">
                    Manager <span className="text-green-500">Excuse</span> Generator
                </h1>
                <p className="text-muted-foreground text-xl max-w-2xl font-medium">
                    Tactical masterclass or delusional meltdown? You decide.
                </p>
            </div>

            <Card className="w-full bg-card/40 backdrop-blur-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border-border/40 overflow-hidden rounded-[2rem]">
                <CardHeader className="bg-muted/30 pb-8">
                    <CardTitle className="text-2xl font-black uppercase italic tracking-tight">Configure Delusion</CardTitle>
                    <CardDescription className="text-base font-medium">Select the parameters of your team&apos;s beautiful failure.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 pt-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground">Your Team</Label>
                            <Popover open={openTeam} onOpenChange={setOpenTeam}>
                                <PopoverTrigger
                                    className="flex h-12 w-full items-center justify-between rounded-xl border border-border/50 bg-background/50 px-4 text-base font-bold shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                                >
                                    {selectedTeam ? (
                                        <span className="flex items-center gap-3">
                                            <span className="text-2xl">{selectedTeam.flag_icon}</span>
                                            <span>{selectedTeam.name}</span>
                                        </span>
                                    ) : "Find your team..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </PopoverTrigger>
                                <PopoverContent className="w-[320px] p-0 rounded-2xl overflow-hidden shadow-2xl border-border/50" align="start">
                                    <Command className="bg-background/95 backdrop-blur-xl">
                                        <CommandInput placeholder="Search national teams..." className="h-12 text-base" />
                                        <CommandList className="max-h-[300px]">
                                            <CommandEmpty>No delusions found for this team.</CommandEmpty>
                                            <CommandGroup>
                                                {sortedTeams.map((t) => (
                                                    <CommandItem
                                                        key={t.name}
                                                        value={t.name}
                                                        className="px-4 py-3 text-base font-semibold"
                                                        onSelect={(currentValue) => {
                                                            const actual = sortedTeams.find(x => x.name.toLowerCase() === currentValue.toLowerCase())?.name || currentValue;
                                                            setTeam(actual);
                                                            setOpenTeam(false);
                                                        }}
                                                    >
                                                        <span className="mr-3 text-xl">{t.flag_icon}</span>
                                                        {t.name}
                                                        <Check
                                                            className={cn(
                                                                "ml-auto h-5 w-5 text-green-500",
                                                                team === t.name ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground">The Outcome</Label>
                            <Select value={outcome} onValueChange={(val) => setOutcome(val || OUTCOMES[1])}>
                                <SelectTrigger className="h-12 w-full rounded-xl border-border/50 bg-background/50 px-4 text-base font-bold shadow-sm">
                                    <SelectValue placeholder="What happened?" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-border/50 bg-background/95 backdrop-blur-xl font-bold">
                                    {OUTCOMES.map((o) => (
                                        <SelectItem key={o} value={o} className="text-base uppercase tracking-wider">{o}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Button onClick={generateExcuse} size="lg" className="w-full font-black h-16 text-xl rounded-2xl shadow-xl hover:scale-[1.02] transition-all bg-green-500 hover:bg-green-400 text-white uppercase tracking-wider italic">
                        <Shuffle className="w-6 h-6 mr-3" /> Generate Excuse
                    </Button>

                    {excuse && (
                        <div className="mt-8 animate-in zoom-in-95 fade-in duration-500">
                            {/* Social Media Post Style */}
                            <div className="bg-background-secondary/50 rounded-[1.5rem] p-6 border-2 border-border/50 shadow-2xl space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-3xl shadow-sm border border-border/50">
                                        {selectedTeam?.flag_icon || "⚽"}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-black text-base italic leading-tight">{team} Fan</span>
                                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">@chaos_merchant • Just now</span>
                                    </div>
                                </div>
                                <p className="text-2xl font-bold leading-tight tracking-tight">
                                    {excuse.split(" #").map((part, i) => i === 0 ? part : <span key={i} className="text-blue-500 font-black"> #{part}</span>)}
                                </p>
                            </div>

                            <div className="flex gap-4 mt-8 justify-center flex-wrap">
                                <Button variant="outline" onClick={copyToClipboard} className="h-12 rounded-full px-6 font-bold shadow-sm border-border/50">
                                    <Copy className="w-4 h-4 mr-2" /> Copy Text
                                </Button>
                                <Button
                                    onClick={shareToTwitter}
                                    className="bg-black text-white hover:bg-zinc-800 font-bold h-12 rounded-full px-6 shadow-xl gap-2 transition-all hover:scale-105"
                                >
                                    <TwitterXIcon /> Post on X
                                </Button>
                                <Button
                                    onClick={shareToFacebook}
                                    className="bg-[#1877F2] text-white hover:bg-[#0d6be0] font-bold h-12 rounded-full px-6 shadow-xl gap-2 transition-all hover:scale-105"
                                >
                                    <FacebookIcon /> Facebook
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
