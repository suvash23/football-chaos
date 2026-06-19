"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, CalendarPlus } from "lucide-react";
import { format } from "date-fns";
import { Flag } from "@/components/flag";
import type { Match } from "@/lib/data";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildGoogleCalendarUrl(match: Match): string {
    const title = encodeURIComponent(`⚽ ${match.home_team} vs ${match.away_team} – FIFA World Cup 2026`);
    const location = encodeURIComponent(match.stadium);
    const details = encodeURIComponent(
        `${match.group} match • ${match.home_team} vs ${match.away_team}\nVenue: ${match.stadium}\n\nTrack & predict on Football Chaos!`
    );
    const start = new Date(match.kickoff_time);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    return (
        `https://calendar.google.com/calendar/render?action=TEMPLATE` +
        `&text=${title}&dates=${fmt(start)}/${fmt(end)}&details=${details}&location=${location}`
    );
}

// Shorten team name to 3-letter abbreviation
function abbr(name: string): string {
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
    return (words[0][0] + (words[1]?.[0] || words[0][1]) + (words[2]?.[0] || words[0][2])).toUpperCase();
}

// ─── Match Card ──────────────────────────────────────────────────────────────

function MatchCard({ match, mounted }: { match: Match; mounted: boolean }) {
    const isLive = match.status === "live";
    const calUrl = buildGoogleCalendarUrl(match);

    const kickoffTime = mounted
        ? format(new Date(match.kickoff_time), "hh:mm a").toUpperCase()
        : "--:-- --";
    const kickoffDate = mounted
        ? format(new Date(match.kickoff_time), "EEEE d MMMM").toUpperCase()
        : "-- -- ----";

    return (
        <div className="snap-start flex-none w-[min(340px,88vw)] md:w-[320px]">
            <div className="group rounded-3xl overflow-hidden shadow-2xl border border-border/10 flex flex-col bg-card/40 backdrop-blur-3xl hover:border-primary/30 transition-all duration-500">

                {/* ── Header bar: Sleek Dark / Live Green ── */}
                <div className={`flex items-center justify-between px-4 py-3 ${isLive
                        ? "bg-gradient-to-r from-green-600 to-emerald-600"
                        : "bg-gradient-to-r from-zinc-900 to-zinc-800 dark:from-black dark:to-zinc-900"
                    }`}>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                        {isLive ? (
                            <>
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                </span>
                                Live Now
                            </>
                        ) : "Upcoming"}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">
                        {match.group}
                    </span>
                </div>

                {/* ── Body ── */}
                <div className="flex items-center justify-between px-5 py-8 gap-2 relative">
                    {/* Subtle BG Glow */}
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                    {/* Home team */}
                    <div className="flex flex-col items-center gap-3 w-[72px] z-10 transition-transform duration-500 group-hover:-translate-x-1">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center bg-white dark:bg-zinc-800 shadow-lg border border-border/10 group-hover:scale-110 transition-transform duration-500">
                            <Flag emoji={match.home_flag} size={42} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-foreground/80">
                            {abbr(match.home_team)}
                        </span>
                    </div>

                    {/* Centre: time + date + stadium */}
                    <div className="flex-1 flex flex-col items-center gap-1 text-center z-10">
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 mb-1">
                            Kick-Off
                        </span>
                        <span
                            className={`text-3xl font-black tracking-tighter leading-none italic ${isLive ? "text-green-500" : "text-primary tracking-tighter"
                                }`}
                        >
                            {kickoffTime}
                        </span>
                        <div className="h-px w-8 bg-border/40 my-1" />
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                            {kickoffDate}
                        </span>
                        <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-tight truncate max-w-[120px]">
                            {match.stadium}
                        </span>
                    </div>

                    {/* Away team */}
                    <div className="flex flex-col items-center gap-3 w-[72px] z-10 transition-transform duration-500 group-hover:translate-x-1">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center bg-white dark:bg-zinc-800 shadow-lg border border-border/10 group-hover:scale-110 transition-transform duration-500">
                            <Flag emoji={match.away_flag} size={42} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-foreground/80">
                            {abbr(match.away_team)}
                        </span>
                    </div>
                </div>

                {/* ── Footer actions ── */}
                <div className="border-t border-border/5 px-4 pb-4 mt-2">
                    <a
                        href={calUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 py-3.5 w-full rounded-2xl bg-secondary hover:bg-primary hover:text-white transition-all duration-300 text-[11px] font-black uppercase tracking-widest text-secondary-foreground shadow-sm hover:shadow-primary/20"
                    >
                        <CalendarPlus className="h-3.5 w-3.5" />
                        Add to Calendar
                    </a>
                </div>
            </div>
        </div>
    );
}

// ─── Carousel ────────────────────────────────────────────────────────────────

interface Props {
    matches: Match[];
}

export function UpcomingMatchesCarousel({ matches }: Props) {
    const trackRef = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const onScroll = useCallback(() => {
        const el = trackRef.current;
        if (!el) return;
        const cardWidth = el.scrollWidth / matches.length;
        const idx = Math.round(el.scrollLeft / cardWidth);
        setActive(Math.min(Math.max(idx, 0), matches.length - 1));
    }, [matches.length]);

    useEffect(() => {
        const el = trackRef.current;
        if (!el) return;
        el.addEventListener("scroll", onScroll, { passive: true });
        return () => el.removeEventListener("scroll", onScroll);
    }, [onScroll]);

    const scrollTo = (idx: number) => {
        const el = trackRef.current;
        if (!el) return;
        const cardWidth = el.scrollWidth / matches.length;
        el.scrollTo({ left: cardWidth * idx, behavior: "smooth" });
        setActive(idx);
    };

    const prev = () => scrollTo(Math.max(active - 1, 0));
    const next = () => scrollTo(Math.min(active + 1, matches.length - 1));

    if (matches.length === 0) {
        return (
            <div className="py-12 text-center text-muted-foreground italic bg-muted/20 rounded-3xl border border-dashed border-border/50">
                All scheduled matches have concluded. Wait for the knockouts!
            </div>
        );
    }

    return (
        <div className="relative w-full">
            {/* Track */}
            <div
                ref={trackRef}
                className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-8 -mx-2 px-2"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
                {matches.map((match) => (
                    <MatchCard key={match.id} match={match} mounted={mounted} />
                ))}
            </div>

            {/* Prev / Next */}
            {matches.length > 1 && (
                <>
                    <button
                        onClick={prev}
                        disabled={active === 0}
                        aria-label="Previous match"
                        className="absolute left-0 top-[42%] -translate-y-1/2 -translate-x-4 z-20 w-11 h-11 rounded-full border border-border/40 bg-background/90 backdrop-blur-xl flex items-center justify-center shadow-xl hover:text-primary hover:border-primary/50 transition-all disabled:opacity-0 disabled:pointer-events-none"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        onClick={next}
                        disabled={active === matches.length - 1}
                        aria-label="Next match"
                        className="absolute right-0 top-[42%] -translate-y-1/2 translate-x-4 z-20 w-11 h-11 rounded-full border border-border/40 bg-background/90 backdrop-blur-xl flex items-center justify-center shadow-xl hover:text-primary hover:border-primary/50 transition-all disabled:opacity-0 disabled:pointer-events-none"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </>
            )}

            {/* Dots */}
            {matches.length > 1 && (
                <div className="flex items-center justify-center gap-3 mt-2">
                    {matches.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => scrollTo(i)}
                            aria-label={`Go to match ${i + 1}`}
                            className={`rounded-full transition-all duration-500 ${i === active
                                    ? "w-8 h-2 bg-primary shadow-[0_0_15px_rgba(var(--primary),0.5)]"
                                    : "w-2 h-2 bg-primary/20 hover:bg-primary/40"
                                }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
