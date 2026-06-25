import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, ClipboardList, MonitorPlay, MessageSquareText, ArrowRight, Globe, History, Zap } from "lucide-react";
import Image from "next/image";
import { fetchMatches, fetchTopScorers } from "@/lib/data";
import { UpcomingMatchesCarousel } from "@/components/upcoming-matches-carousel";
import { Flag } from "@/components/flag";

export const dynamic = "force-dynamic";

export default async function Home() {
  const matches = await fetchMatches();
  const upcoming = matches
    .filter(m => m.status === 'upcoming' || m.status === 'live')
    .slice(0, 9);

  const topScorers = await fetchTopScorers();

  const features = [
    {
      title: "Match Predictions",
      description: "Guess the score and predict chaotic moments (e.g. 'Manager loses mind') to win points.",
      icon: ClipboardList,
      href: "/fixtures",
      color: "text-blue-400",
      bg: "bg-blue-500/10"
    },
    {
      title: "Tournament Groups",
      description: "View all 48 teams competing for ultimate glory. Check official squad lists and player stats.",
      icon: Globe,
      href: "/groups",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10"
    },
    {
      title: "VAR Simulator",
      description: "Draw random offside lines to ruin matches. Experience the true chaos of modern officiating.",
      icon: MonitorPlay,
      href: "/var-simulator",
      color: "text-red-400",
      bg: "bg-red-500/10"
    },
    {
      title: "Excuse Generator",
      description: "Did your team lose? Generate the perfect delusional excuse for social media meltdowns.",
      icon: MessageSquareText,
      href: "/excuses",
      color: "text-green-400",
      bg: "bg-green-500/10"
    },
    {
      title: "World Cup Vault",
      description: "Relive history. View interactive brackets and results from every tournament since 1930.",
      icon: History,
      href: "/history",
      color: "text-yellow-400",
      bg: "bg-yellow-500/10"
    },
    {
      title: "Fan Leaderboard",
      description: "Climb from 'Certified Couch Coach' to 'Football Prophet' and claim global bragging rights.",
      icon: Trophy,
      href: "/leaderboard",
      color: "text-purple-400",
      bg: "bg-purple-500/10"
    }
  ];

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section - Purely for the legends now */}
      <section className="relative w-full min-h-[700px] flex flex-col items-center justify-start overflow-hidden pt-12">
        <Image
          src={(() => {
            const heroes = [
              "/heroes/legends-0.png",
              "/heroes/legends-1.png",
              "/heroes/legends-2.png",
              "/heroes/legends-3.png",
              "/heroes/legends-4.png"
            ];
            return heroes[Math.floor(Math.random() * heroes.length)];
          })()}
          alt="World Cup Legends"
          fill
          className="object-cover object-center brightness-[1.1] contrast-[1.05]"
          priority
        />

        <div className="relative z-30 container mx-auto px-4 text-center space-y-2 animate-in fade-in slide-in-from-top-4 duration-1000">
          <h1 className="text-4xl md:text-7xl lg:text-[7rem] font-black uppercase italic tracking-tighter leading-none drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] text-white/90">
            Football <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Chaos</span>
          </h1>
          <p className="text-sm md:text-xl text-white font-black uppercase tracking-[0.5em] italic drop-shadow-lg">
            Predict every moment
          </p>
        </div>

        {/* Bottom gradient to blend into cards */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-100 h-1/2 mt-auto" />
      </section>

      {/* Live Status Section */}
      <section className="container mx-auto px-4 -mt-32 relative z-40">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tournament Live Card with Buttons */}
          <Card className="lg:col-span-3 overflow-hidden border-border/50 bg-card/70 backdrop-blur-3xl shadow-2xl flex flex-col">
            <CardHeader className="text-center pb-2 border-b border-border/10">
              <CardTitle className="text-sm font-black uppercase tracking-[0.3em] text-primary italic flex items-center justify-center gap-2">
                <Zap className="h-4 w-4 fill-primary animate-pulse" /> Tournament in Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="py-12 flex-1 flex flex-col items-center justify-center gap-8 text-center px-4">
              <div className="space-y-2">
                <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none mb-4">
                  Survival of <br />
                  <span className="text-primary italic">The Fittest.</span>
                </h2>
                <p className="text-muted-foreground text-lg font-bold uppercase tracking-widest opacity-80 max-w-2xl mx-auto">
                  The margin for error is gone. One mistake means elimination. One moment of brilliance means immortality. Predict the Bracket now.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 w-full max-w-4xl px-6 pt-4">
                <Link href="/fixtures" className="flex-1 min-w-[280px]">
                  <Button size="lg" className="w-full rounded-2xl px-10 text-2xl font-black h-20 shadow-2xl hover:scale-[1.03] transition-all italic uppercase tracking-wider bg-yellow-400 hover:bg-yellow-300 text-black border-4 border-black group">
                    Play Now <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/groups" className="flex-1 min-w-[280px]">
                  <Button variant="outline" size="lg" className="w-full rounded-2xl px-10 text-2xl font-black h-20 backdrop-blur-md bg-muted/50 transition-all italic uppercase tracking-wider hover:bg-muted/80 border-2 border-border/80">
                    Squad Stats
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Group Stage Conclusion / Knockouts Hype Section */}
      <section className="container mx-auto px-4 mt-24 mb-12">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-background to-orange-500/10 border border-primary/20 p-8 md:p-12 text-center shadow-2xl">
          {/* Decorative background flair */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-orange-500/20 rounded-full blur-[100px]" />

          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-center gap-3">
              <span className="h-px w-8 md:w-16 bg-primary/40" />
              <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-primary italic drop-shadow-sm">Tournament Status Update</span>
              <span className="h-px w-8 md:w-16 bg-primary/40" />
            </div>

            <h2 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter leading-none mb-4">
              Group Stage <span className="text-muted-foreground opacity-30">Concluded.</span><br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Round of 32 Loading...</span>
            </h2>

            <p className="max-w-3xl mx-auto text-base md:text-xl font-bold text-muted-foreground uppercase tracking-widest opacity-80 leading-relaxed">
              The noise of the groups fades. The intensity of the <span className="text-foreground italic underline decoration-primary decoration-4">Knockouts</span> begins.
              Only the strong survive from here.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
              <div className="flex items-center gap-3 bg-card/50 backdrop-blur-md px-6 py-3 rounded-2xl border border-border/10">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Bracket Finalizing</span>
              </div>

              <div className="flex items-center gap-3 bg-card/50 backdrop-blur-md px-6 py-3 rounded-2xl border border-border/10">
                <Zap className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <span className="text-[10px] font-black uppercase tracking-widest">High Intensity Expected</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Matches Full Width Section */}
      <section className="w-full bg-muted/30 border-y border-border/50 py-16 mb-16 mt-16 relative overflow-hidden">
        {/* Subtle background flair */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
            <div className="text-center md:text-left">
              <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none mb-2">Next on the Pitch</h2>
              <p className="text-muted-foreground font-bold text-sm uppercase tracking-widest opacity-70">Don&apos;t miss a single second of the chaos</p>
            </div>
            <Link href="/fixtures">
              <Button variant="outline" className="rounded-xl font-black uppercase italic tracking-wider gap-2 hover:bg-primary/10 transition-all">
                All Fixtures <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <UpcomingMatchesCarousel matches={upcoming} />
        </div>
      </section>

      {/* Player Rank Section */}
      <section className="container mx-auto px-4 py-24 relative">
        <div className="flex flex-col items-center justify-center text-center space-y-4 mb-16 px-4">
          <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">
            Golden <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Boot</span> Race
          </h2>
          <p className="text-muted-foreground font-bold text-sm uppercase tracking-[0.2em] opacity-70">The World&apos;s Deadliest Finishers</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {topScorers.map((scorer, i) => (
            <div
              key={i}
              className="group relative flex items-center gap-4 p-6 rounded-[2rem] bg-card/40 backdrop-blur-3xl border border-border/10 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:scale-[1.02]"
            >
              {/* Rank Badge */}
              <div className={`flex items-center justify-center w-12 h-12 rounded-2xl font-black italic text-xl shadow-lg shrink-0 ${i === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-black animate-pulse' :
                i === 1 ? 'bg-gradient-to-br from-zinc-300 to-zinc-500 text-black' :
                  i === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-700 text-white' :
                    'bg-muted/50 text-muted-foreground'
                }`}>
                {i + 1}
              </div>

              {/* Player Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Flag emoji={scorer.flag} size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{scorer.team}</span>
                </div>
                <h3 className="text-xl font-black uppercase italic tracking-tight truncate leading-tight group-hover:text-primary transition-colors">
                  {scorer.name}
                </h3>
              </div>

              {/* Goal Count */}
              <div className="flex flex-col items-end">
                <span className="text-3xl font-black italic tracking-tighter text-primary">{scorer.goals}</span>
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Goals</span>
              </div>

              {/* Glow for top 3 */}
              {i < 3 && (
                <div className={`absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none ${i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-zinc-300' : 'bg-orange-500'
                  }`} />
              )}
            </div>
          ))}
        </div>

        {topScorers.length === 0 && (
          <div className="text-center py-20 bg-muted/20 rounded-[3rem] border border-dashed border-border/40">
            <p className="text-muted-foreground font-bold italic uppercase tracking-widest">No goals registered yet. The chaos awaits.</p>
          </div>
        )}
      </section>

      {/* Quick Stats Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-24">
          <div className="flex flex-col items-center text-center p-6 rounded-3xl bg-muted/30 border border-border/50">
            <div className="text-5xl font-black text-primary mb-1">48</div>
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Teams</div>
          </div>
          <div className="flex flex-col items-center text-center p-6 rounded-3xl bg-muted/30 border border-border/50">
            <div className="text-5xl font-black text-primary mb-1">12</div>
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Groups</div>
          </div>
          <div className="flex flex-col items-center text-center p-6 rounded-3xl bg-muted/30 border border-border/50">
            <div className="text-5xl font-black text-primary mb-1">16</div>
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Host Cities</div>
          </div>
          <div className="flex flex-col items-center text-center p-6 rounded-3xl bg-muted/30 border border-border/50">
            <div className="text-5xl font-black text-primary mb-1">3</div>
            <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Host Nations</div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center text-center space-y-4 mb-16 px-4">
          <h2 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter">
            Experience the <span className="text-primary italic">Spectacle</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl">
            From the Azteca to SoFi Stadium, track every match, predict every goal, and experience the first 48-team World Cup in history.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <Card key={i} className="group relative overflow-hidden border-border/50 bg-card/40 backdrop-blur-sm transition-all hover:shadow-[0_0_50px_-10px_rgba(var(--primary),0.3)] hover:scale-[1.03] duration-500 hover:border-primary/50">
              <Link href={feature.href} className="absolute inset-0 z-10">
                <span className="sr-only">Go to {feature.title}</span>
              </Link>
              <CardHeader>
                <div className={`p-4 w-16 h-16 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 border border-transparent group-hover:border-primary/20`}>
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <CardTitle className="text-3xl font-black italic uppercase tracking-tight leading-none mb-2">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-lg text-muted-foreground leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0">
                <ArrowRight className="w-8 h-8 text-primary" />
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
