"use client";

import { useState } from "react";
import { EXCUSE_TEMPLATES } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MessageSquareText, Copy, Share2, Shuffle } from "lucide-react";
import { toast } from "sonner";

const TEAMS = ["My Team", "Arsenal", "Man United", "Chelsea", "Spurs", "Liverpool", "Real Madrid", "Barcelona", "Bayern"];
const OUTCOMES = ["draw", "loss", "bottling", "disasterclass"];

export default function ExcusesPage() {
    const [team, setTeam] = useState(TEAMS[0]);
    const [outcome, setOutcome] = useState(OUTCOMES[1]);
    const [excuse, setExcuse] = useState<string | null>(null);

    const generateExcuse = () => {
        const template = EXCUSE_TEMPLATES[Math.floor(Math.random() * EXCUSE_TEMPLATES.length)];
        const generated = template.replace("{outcome}", outcome);
        setExcuse(`As a ${team} fan, I must say: ${generated}`);
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
                            <Select value={team} onValueChange={(val) => setTeam(val || TEAMS[0])}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select team..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {TEAMS.map((t) => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
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

                            <div className="flex gap-4 mt-6 justify-end">
                                <Button variant="outline" onClick={copyToClipboard}>
                                    <Copy className="w-4 h-4 mr-2" /> Copy text
                                </Button>
                                <Button variant="secondary" onClick={() => { toast("Share logic placeholder") }}>
                                    <Share2 className="w-4 h-4 mr-2" /> Share
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
