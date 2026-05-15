"use client";

import { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { BINGO_ITEMS } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Grid3X3, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function BingoPage() {
    const [board, setBoard] = useState<{ id: number; text: string; checked: boolean }[]>([]);
    const [hasWon, setHasWon] = useState(false);

    // Initialize a random 5x5 board
    const generateBoard = () => {
        const shuffled = [...BINGO_ITEMS].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 25);

        // Put "FREE SPACE" in the middle (index 12)
        selected[12] = "FREE SPACE - Ref makes bad call";

        setBoard(
            selected.map((text, i) => ({
                id: i,
                text,
                checked: i === 12, // Free space is checked by default
            }))
        );
        setHasWon(false);
    };

    useEffect(() => {
        generateBoard();
    }, []);

    const toggleCell = (id: number) => {
        if (id === 12 || hasWon) return; // Can't uncheck free space or play after winning

        setBoard(prev => {
            const newBoard = prev.map(cell => cell.id === id ? { ...cell, checked: !cell.checked } : cell);
            checkWin(newBoard);
            return newBoard;
        });
    };

    const checkWin = (currentBoard: { checked: boolean }[]) => {
        // Check rows, cols, diagonals
        const lines = [
            [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24], // Rows
            [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24], // Cols
            [0, 6, 12, 18, 24], [4, 8, 12, 16, 20] // Diagonals
        ];

        for (const line of lines) {
            if (line.every(index => currentBoard[index].checked)) {
                triggerWin();
                return;
            }
        }
    };

    const triggerWin = () => {
        if (hasWon) return;
        setHasWon(true);

        // Confetti explosion
        const duration = 3 * 1000;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#a855f7', '#ec4899', '#eab308']
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#a855f7', '#ec4899', '#eab308']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();

        toast.success("BINGO!", {
            description: "You've successfully witnessed peak football chaos.",
            duration: 5000,
        });
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="flex flex-col items-center justify-center text-center space-y-4 mb-8">
                <div className="p-3 w-16 h-16 rounded-2xl bg-yellow-500/20 text-yellow-500 flex items-center justify-center mb-2">
                    <Grid3X3 className="w-8 h-8" />
                </div>
                <h1 className="text-4xl font-black italic tracking-tight uppercase">Chaos Bingo</h1>
                <p className="text-muted-foreground text-lg max-w-2xl">
                    Watch the match, mark the squares when ridiculous things happen. First to get 5 in a row wins.
                </p>
            </div>

            <Card className="w-full bg-card/50 backdrop-blur shadow-2xl border-border/50">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Your Bingo Card</CardTitle>
                        <CardDescription>Click a square when the event happens.</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={generateBoard}>
                        <RefreshCw className="w-4 h-4 mr-2" /> New Card
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-5 gap-2 md:gap-4 w-full aspect-square md:aspect-auto md:h-[600px]">
                        {board.map((cell) => (
                            <button
                                key={cell.id}
                                onClick={() => toggleCell(cell.id)}
                                disabled={cell.id === 12 || hasWon}
                                className={`
                  relative flex items-center justify-center p-2 text-center text-xs md:text-sm font-bold border rounded-lg transition-all
                  ${cell.id === 12 ? 'bg-primary/20 border-primary text-primary cursor-default' : ''}
                  ${cell.checked && cell.id !== 12 ? 'bg-primary text-primary-foreground border-primary scale-95 shadow-inner' : ''}
                  ${!cell.checked ? 'bg-card hover:bg-muted border-border hover:border-primary/50' : ''}
                `}
                            >
                                <span className="line-clamp-4 leading-tight">{cell.text}</span>
                                {cell.checked && (
                                    <div className="absolute inset-0 bg-black/10 rounded-lg pointer-events-none" />
                                )}
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
