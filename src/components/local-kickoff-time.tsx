"use client";

import { format } from "date-fns";

interface LocalKickoffTimeProps {
    kickoffTime: string;
    isLive?: boolean;
}

export function LocalKickoffTime({ kickoffTime, isLive }: LocalKickoffTimeProps) {
    if (isLive) {
        return (
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 animate-pulse">
                Live Now
            </span>
        );
    }

    return (
        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            <span suppressHydrationWarning>
                {format(new Date(kickoffTime), "h:mm a")}
            </span>
            <span className="opacity-60 ml-1">Local</span>
        </span>
    );
}

export function LocalKickoffDate({ kickoffTime }: { kickoffTime: string }) {
    return (
        <span suppressHydrationWarning>
            {format(new Date(kickoffTime), "EEE, MMM d")}
        </span>
    );
}
