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
        setExcuse(`As a ${selectedTeam?.flag_icon || ""} ${team} fan, I must say: ${generated}`);
    };

    const copyToClipboard = () => {
        if (excuse) {
            navigator.clipboard.writeText(excuse);
            toast.success("Copied to clipboard!", { description: "Ready for Twitter." });
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-3xl">
            <div className="flex flex-col items-center justify-center text-center space-y-4 mb-8">
                <div className="p-3 w-16 h-16 rounded-2xl bg-green-500/20 text-green-500 flex items-center justify-center mb-2">
                    <MessageSquareText className="w-8 h-8" />
                </div>
                <h1 className="text-4xl font-black italic tracking-tight uppercase">Manager Excuse Generator</h1>
                <p className="text-muted-foreground text-lg max-w-2xl">
                    Did your team drop points again? Don&apos;t blame the tactics. Use our highly-advanced delusional AI to craft the perfect excuse.
                </p>
            </div>

            <Card className="w-full bg-card/50 backdrop-blur shadow-xl border-border/50">
                <CardHeader>
                    <CardTitle>Configure Delusion</CardTitle>
                    <CardDescription>Select the parameters of your team&apos;s failure.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Team</Label>
                            <Popover open={openTeam} onOpenChange={setOpenTeam}>
                                <PopoverTrigger
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                                >
                                    {selectedTeam ? (
                                        <span className="flex items-center gap-2">
                                            <span>{selectedTeam.flag_icon}</span>
                                            <span>{selectedTeam.name}</span>
                                        </span>
                                    ) : "Select team..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </PopoverTrigger>
                                <PopoverContent className="w-[320px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Search team..." />
                                        <CommandList>
                                            <CommandEmpty>No team found.</CommandEmpty>
                                            <CommandGroup>
                                                {sortedTeams.map((t) => (
                                                    <CommandItem
                                                        key={t.name}
                                                        value={t.name}
                                                        onSelect={(currentValue) => {
                                                            const actual = sortedTeams.find(x => x.name.toLowerCase() === currentValue.toLowerCase())?.name || currentValue;
                                                            setTeam(actual);
                                                            setOpenTeam(false);
                                                        }}
                                                    >
                                                        <span className="mr-2">{t.flag_icon}</span>
                                                        {t.name}
                                                        <Check
                                                            className={cn(
                                                                "ml-auto h-4 w-4",
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
                        <div className="space-y-2">
                            <Label>Outcome</Label>
                            <Select value={outcome} onValueChange={(val) => setOutcome(val || OUTCOMES[1])}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select outcome..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {OUTCOMES.map((o) => (
                                        <SelectItem key={o} value={o}>{o.toUpperCase()}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Button onClick={generateExcuse} size="lg" className="w-full font-bold h-14 text-lg">
                        <Shuffle className="w-5 h-5 mr-2" /> Generate Excuse
                    </Button>

                    {excuse && (
                        <div className="mt-8 animate-in zoom-in-95 fade-in">
                            <div className="bg-muted rounded-2xl p-6 relative border border-border">
                                <div className="absolute -top-3 -left-2 text-4xl text-primary/40">❝</div>
                                <p className="text-2xl font-medium italic relative z-10 pl-4">{excuse}</p>
                                <div className="absolute -bottom-6 -right-2 text-4xl text-primary/40">❞</div>
                            </div>

                            <div className="flex gap-3 mt-6 justify-end flex-wrap">
                                <Button variant="outline" onClick={copyToClipboard}>
                                    <Copy className="w-4 h-4 mr-2" /> Copy text
                                </Button>
                                <Button
                                    onClick={shareToTwitter}
                                    className="bg-black text-white hover:bg-zinc-800 font-bold gap-2"
                                >
                                    <TwitterXIcon /> Post on X
                                </Button>
                                <Button
                                    onClick={shareToFacebook}
                                    className="bg-[#1877F2] text-white hover:bg-[#0d6be0] font-bold gap-2"
                                >
                                    <FacebookIcon /> Share on Facebook
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
