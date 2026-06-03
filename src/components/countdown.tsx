"use client";

import { useState, useEffect } from "react";

interface CountdownProps {
    targetDate: string;
}

export function Countdown({ targetDate }: CountdownProps) {
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = +new Date(targetDate) - +new Date();
            let timeLeft = {
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0
            };

            if (difference > 0) {
                timeLeft = {
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                };
            }

            return timeLeft;
        };

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        setTimeLeft(calculateTimeLeft());

        return () => clearInterval(timer);
    }, [targetDate]);

    return (
        <div className="flex gap-4 md:gap-8 justify-center items-center scale-75 md:scale-100">
            <div className="flex flex-col items-center">
                <div className="text-4xl md:text-6xl font-black text-primary animate-pulse">{timeLeft.days}</div>
                <div className="text-xs md:text-sm font-bold uppercase tracking-widest text-muted-foreground">Days</div>
            </div>
            <div className="text-4xl md:text-6xl font-black text-muted-foreground/30 self-start mt-[-10px]">:</div>
            <div className="flex flex-col items-center">
                <div className="text-4xl md:text-6xl font-black text-primary">{timeLeft.hours}</div>
                <div className="text-xs md:text-sm font-bold uppercase tracking-widest text-muted-foreground">Hrs</div>
            </div>
            <div className="text-4xl md:text-6xl font-black text-muted-foreground/30 self-start mt-[-10px]">:</div>
            <div className="flex flex-col items-center">
                <div className="text-4xl md:text-6xl font-black text-primary">{timeLeft.minutes}</div>
                <div className="text-xs md:text-sm font-bold uppercase tracking-widest text-muted-foreground">Min</div>
            </div>
            <div className="text-4xl md:text-6xl font-black text-muted-foreground/30 self-start mt-[-10px]">:</div>
            <div className="flex flex-col items-center">
                <div className="text-4xl md:text-6xl font-black text-primary">{timeLeft.seconds}</div>
                <div className="text-xs md:text-sm font-bold uppercase tracking-widest text-muted-foreground">Sec</div>
            </div>
        </div>
    );
}
