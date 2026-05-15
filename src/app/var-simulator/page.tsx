"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Upload, RefreshCw, ZoomIn, MonitorPlay } from "lucide-react";

const VERDICTS_OPTIONS = [
    "Offside by left eyebrow.",
    "Goal disallowed due to bad vibes.",
    "After 12 minutes of confusion, it's a goal.",
    "Offside because the striker was thinking about being offside.",
    "Onside! The defender's shadow played him on.",
    "Goal ruled out: the ball was clearly a paid actor.",
    "Foul in the build-up... from last week's match."
];

export default function VarSimulatorPage() {
    const [image, setImage] = useState<string | null>(null);
    const [verdict, setVerdict] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImage(event.target?.result as string);
                setVerdict(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const drawVAR = () => {
        if (!image || !canvasRef.current) return;

        setIsProcessing(true);
        setVerdict(null);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
            // Simulate dramatic loading
            setTimeout(() => {
                // Draw image keeping aspect ratio
                canvas.width = canvas.parentElement?.clientWidth || 600;
                const ratio = img.height / img.width;
                canvas.height = canvas.width * ratio;

                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Draw random offside lines
                const numLines = Math.floor(Math.random() * 3) + 2; // 2 to 4 lines

                for (let i = 0; i < numLines; i++) {
                    const startX = Math.random() * canvas.width;
                    const isHorizontal = Math.random() > 0.5;
                    const yPos = Math.random() * canvas.height;

                    ctx.beginPath();
                    if (isHorizontal) {
                        ctx.moveTo(0, yPos);
                        ctx.lineTo(canvas.width, yPos + (Math.random() * 40 - 20));
                    } else {
                        ctx.moveTo(startX, 0);
                        ctx.lineTo(startX + (Math.random() * 40 - 20), canvas.height);
                    }

                    ctx.lineWidth = 3;
                    ctx.strokeStyle = i % 2 === 0 ? "red" : "blue";
                    if (i === 2) ctx.strokeStyle = "yellow";

                    ctx.setLineDash([10, 5]);
                    ctx.stroke();
                }

                // Add VAR Overlay Text
                ctx.fillStyle = "rgba(0,0,0,0.6)";
                ctx.fillRect(10, 10, 150, 40);
                ctx.font = "bold 20px monospace";
                ctx.fillStyle = "white";
                ctx.fillText("VAR REVIEW", 25, 37);

                setVerdict(VERDICTS_OPTIONS[Math.floor(Math.random() * VERDICTS_OPTIONS.length)]);
                setIsProcessing(false);
            }, 1500); // Fake delay
        };
        img.src = image;
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex flex-col items-center justify-center text-center space-y-4 mb-8">
                <div className="p-3 w-16 h-16 rounded-2xl bg-red-500/20 text-red-500 flex items-center justify-center mb-2">
                    <MonitorPlay className="w-8 h-8" />
                </div>
                <h1 className="text-4xl font-black italic tracking-tight uppercase">Fake VAR Simulator</h1>
                <p className="text-muted-foreground text-lg max-w-2xl">
                    Upload a match screenshot and let our completely biased algorithm draw random lines to ruin the beautiful game.
                </p>
            </div>

            <Card className="w-full bg-card/50 backdrop-blur border-border/50 shadow-2xl">
                <CardHeader>
                    <CardTitle>VAR Monitor</CardTitle>
                    <CardDescription>Upload an image to start the review process.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                    {!image ? (
                        <div className="w-full h-80 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-4 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer relative">
                            <Upload className="w-10 h-10 text-muted-foreground" />
                            <div className="text-center">
                                <p className="font-semibold">Click to upload or drag and drop</p>
                                <p className="text-sm text-muted-foreground">Any screenshot works (SVG, PNG, JPG)</p>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleImageUpload}
                            />
                        </div>
                    ) : (
                        <div className="w-full relative rounded-xl overflow-hidden border border-border shadow-inner bg-black flex items-center justify-center min-h-[300px]">
                            <canvas ref={canvasRef} className="max-w-full rounded-md shadow-lg" />

                            {isProcessing && (
                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
                                    <RefreshCw className="w-12 h-12 text-primary animate-spin" />
                                    <p className="text-xl font-bold tracking-widest uppercase animate-pulse">Checking Potential Offside...</p>
                                    <p className="text-sm text-muted-foreground">Drawing completely arbitrary lines</p>
                                </div>
                            )}

                            {!isProcessing && image && !verdict && (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={image} className="w-full h-auto max-h-[60vh] object-contain opacity-50" alt="Preview" />
                            )}
                        </div>
                    )}

                    {verdict && (
                        <div className="mt-8 w-full animate-in fade-in slide-in-from-bottom-4">
                            <div className="bg-destructive/10 border-2 border-destructive rounded-2xl p-6 text-center shadow-[0_0_30px_-5px_rgba(225,29,72,0.3)]">
                                <p className="text-sm font-bold text-destructive uppercase tracking-widest mb-2">Final Verdict</p>
                                <p className="text-3xl font-black italic">{verdict}</p>
                                <div className="mt-4 flex justify-between items-center text-xs text-muted-foreground font-mono">
                                    <span>Confidence: {Math.floor(Math.random() * 20)}%</span>
                                    <span>Margin: {Math.floor(Math.random() * 100)}mm</span>
                                </div>
                            </div>
                        </div>
                    )}

                </CardContent>
                <CardFooter className="flex flex-wrap justify-center gap-4 bg-muted/10 pt-6">
                    <Button variant="outline" onClick={() => { setImage(null); setVerdict(null); }} disabled={isProcessing}>
                        <Upload className="w-4 h-4 mr-2" /> Upload Different
                    </Button>
                    <Button onClick={drawVAR} disabled={!image || isProcessing} size="lg" className="font-bold">
                        <ZoomIn className="w-5 h-5 mr-2" />
                        {verdict ? "Generate Another Verdict" : "Enhance & Evaluate"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
