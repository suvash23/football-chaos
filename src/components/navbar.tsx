"use client";

import Link from 'next/link';
import { Globe, Trophy, Home, ClipboardList, MonitorPlay, MessageSquareText, Grid3X3, User, Network } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from './ui/sheet';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/use-auth';

export function Navbar() {
    const { user, profile } = useAuth();

    const navLinks = [
        { href: '/', label: 'Home', icon: Home },
        { href: '/groups', label: 'Groups', icon: Globe },
        { href: '/predictions', label: 'Predictions', icon: ClipboardList },
        { href: '/bracket', label: 'Bracket', icon: Network },
        { href: '/var-simulator', label: 'VAR Sim', icon: MonitorPlay },
        { href: '/excuses', label: 'Excuses', icon: MessageSquareText },
        // { href: '/bingo', label: 'Bingo', icon: Grid3X3 },
        { href: '/leaderboard', label: 'Rankings', icon: Trophy },
    ];

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center px-4 justify-between">
                <div className="flex gap-6 md:gap-10">
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="text-2xl font-black italic text-primary">⚽ CHAOS</span>
                    </Link>
                    <div className="hidden md:flex gap-6">
                        {navLinks.slice(1).map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                            >
                                <link.icon className="mr-2 h-4 w-4" />
                                {link.label}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 text-sm font-semibold bg-secondary px-3 py-1.5 rounded-full">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        <span>0 pts</span>
                    </div>

                    <div className="md:hidden flex items-center">
                        <Sheet>
                            <SheetTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 w-9">
                                <span className="sr-only">Toggle Menu</span>
                                <div className="space-y-1">
                                    <span className="block h-0.5 w-4 bg-current"></span>
                                    <span className="block h-0.5 w-4 bg-current"></span>
                                    <span className="block h-0.5 w-4 bg-current"></span>
                                </div>
                            </SheetTrigger>
                            <SheetContent side="right">
                                <SheetHeader>
                                    <SheetTitle>Menu</SheetTitle>
                                </SheetHeader>
                                <div className="flex flex-col space-y-4 mt-6">
                                    {navLinks.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className="flex items-center text-lg font-medium text-muted-foreground hover:text-primary"
                                        >
                                            <link.icon className="mr-4 h-5 w-5" />
                                            {link.label}
                                        </Link>
                                    ))}
                                    {user && (
                                        <div className="flex items-center gap-2 text-lg font-semibold bg-secondary px-4 py-2 rounded-lg mt-4 w-max">
                                            <Trophy className="h-5 w-5 text-yellow-500" />
                                            <span>0 pts</span>
                                        </div>
                                    )}
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        {profile?.favorite_team && (
                            <div className="flex items-center gap-2 bg-secondary px-3 py-1 rounded-full whitespace-nowrap">
                                <span className="text-xl">{profile.avatar_url || "⚽"}</span>
                                <span className="font-bold text-sm hidden lg:inline">{profile.favorite_team}</span>
                            </div>
                        )}
                        {user ? (
                            <Link href="/profile">
                                <Button variant="secondary" size="icon" className="rounded-full relative">
                                    <User className="h-5 w-5" />
                                    <span className="sr-only">Profile</span>
                                </Button>
                            </Link>
                        ) : (
                            <Link href="/auth">
                                <Button variant="default" className="font-bold">Sign In</Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
