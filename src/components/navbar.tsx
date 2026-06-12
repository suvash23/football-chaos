"use client";

import Link from 'next/link';
import { Globe, Trophy, Home, ClipboardList, MonitorPlay, MessageSquareText, User, Network, LogIn, ShieldAlert } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from './ui/sheet';
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
        { href: '/history', label: 'Vault', icon: Trophy },
        { href: '/leaderboard', label: 'Rankings', icon: Trophy },
    ];

    return (
        <nav className="sticky top-0 z-50 w-full bg-[#182357] text-white shadow-md">
            <div className="container mx-auto flex h-16 items-center px-4 justify-between">
                <div className="flex gap-6 md:gap-10">
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="text-2xl font-black italic text-white tracking-widest">⚽ CHAOS</span>
                    </Link>
                    <div className="hidden md:flex gap-6">
                        {navLinks.slice(1).map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="flex items-center text-sm font-semibold text-gray-200 transition-colors hover:text-white uppercase tracking-wide"
                            >
                                <link.icon className="mr-2 h-4 w-4" />
                                {link.label}
                            </Link>
                        ))}
                        {profile?.is_admin && (
                            <Link
                                href="/admin"
                                className="flex items-center text-sm font-bold text-orange-400 transition-colors hover:text-orange-300 uppercase tracking-wide"
                            >
                                <ShieldAlert className="mr-2 h-4 w-4" />
                                Admin
                            </Link>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {user && (
                        <div className="hidden md:flex items-center gap-2 text-sm font-semibold bg-[#20327A] px-3 py-1.5 rounded-full border border-blue-400/30">
                            <Trophy className="h-4 w-4 text-[#FFD700]" />
                            <span className="text-white">{profile?.points || 0} pts</span>
                        </div>
                    )}

                    <div className="md:hidden flex items-center gap-2">
                        {/* Compact auth button visible on mobile next to hamburger */}
                        {user ? (
                            <Link href="/profile">
                                <Button variant="secondary" size="icon" className="rounded-full bg-white text-[#182357] hover:bg-gray-200 h-8 w-8">
                                    <User className="h-4 w-4" />
                                    <span className="sr-only">Profile</span>
                                </Button>
                            </Link>
                        ) : (
                            <Link href="/auth">
                                <Button size="sm" className="font-bold bg-white text-[#182357] hover:bg-gray-200 h-8 px-3 text-xs">
                                    <LogIn className="h-3.5 w-3.5 mr-1" /> Sign In
                                </Button>
                            </Link>
                        )}
                        <Sheet>
                            <SheetTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-transparent text-white hover:bg-[#20327A] h-9 w-9">
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
                                <div className="flex flex-col space-y-1 mt-6">
                                    {navLinks.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className="flex items-center text-lg font-medium text-muted-foreground hover:text-primary py-2"
                                        >
                                            <link.icon className="mr-4 h-5 w-5" />
                                            {link.label}
                                        </Link>
                                    ))}
                                    {profile?.is_admin && (
                                        <Link
                                            href="/admin"
                                            className="flex items-center text-lg font-bold text-orange-500 hover:text-orange-600 py-2"
                                        >
                                            <ShieldAlert className="mr-4 h-5 w-5" />
                                            Admin Panel
                                        </Link>
                                    )}

                                    {/* Auth section at bottom of drawer */}
                                    <div className="pt-4 mt-4 border-t border-border">
                                        {user ? (
                                            <div className="flex flex-col gap-3">
                                                {profile?.favorite_team && (
                                                    <div className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-lg w-full">
                                                        <span className="text-xl">{profile.avatar_url || "⚽"}</span>
                                                        <span className="font-bold text-sm">{profile.favorite_team}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-lg w-max">
                                                    <Trophy className="h-5 w-5 text-yellow-500" />
                                                    <span className="font-semibold">{profile?.points || 0} pts</span>
                                                </div>
                                                <Link href="/profile" className="w-full">
                                                    <Button variant="outline" className="w-full font-bold gap-2">
                                                        <User className="h-4 w-4" /> My Profile
                                                    </Button>
                                                </Link>
                                            </div>
                                        ) : (
                                            <Link href="/auth" className="w-full">
                                                <Button className="w-full font-black uppercase italic text-base h-12 gap-2">
                                                    <LogIn className="h-5 w-5" /> Sign In
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        {profile?.favorite_team && (
                            <div className="flex items-center gap-2 bg-[#20327A] px-3 py-1 rounded-full whitespace-nowrap border border-blue-400/30">
                                <span className="text-xl">{profile.avatar_url || "⚽"}</span>
                                <span className="font-bold text-sm hidden lg:inline text-white">{profile.favorite_team}</span>
                            </div>
                        )}
                        {user ? (
                            <Link href="/profile">
                                <Button variant="secondary" size="icon" className="rounded-full relative bg-white text-[#182357] hover:bg-gray-200">
                                    <User className="h-5 w-5" />
                                    <span className="sr-only">Profile</span>
                                </Button>
                            </Link>
                        ) : (
                            <Link href="/auth">
                                <Button variant="default" className="font-bold bg-white text-[#182357] hover:bg-gray-200">Sign In</Button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
