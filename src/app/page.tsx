import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, ClipboardList, MonitorPlay, MessageSquareText, ArrowRight, Globe, History, Zap, Award, Flame, Shield } from "lucide-react";
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
    /* Hidden post-tournament — can re-enable for future tournaments
    {
      title: "Match Predictions",
      description: "Guess the score and predict chaotic moments (e.g. 'Manager loses mind') to win points.",
      icon: ClipboardList,
      href: "/fixtures",
      color: "text-blue-400",
      bg: "bg-blue-500/10"
    },
    */
    {
      title: "Tournament Groups",
      description: "View all 48 teams competing for ultimate glory. Check official squad lists and player stats.",
      icon: Globe,
      href: "/groups",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10"
    },
    /* Hidden post-tournament — can re-enable for future tournaments
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
    */
    {
      title: "Tournament Vault",
      description: "Relive history. View interactive brackets and results from Euros, Copa América, and World Cups.",
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
      {/* Hero Section - Spain Champions 2026 */}
      <section className="relative w-full min-h-[700px] flex flex-col items-center justify-start overflow-hidden pt-12">
        <Image
          src="/heroes/spain-squad-five.png"
          alt="Spain World Cup Champions 2026 - Yamal, Nico Williams, Rodri, Ferran Torres, Cucurella"
          fill
          className="object-cover object-center brightness-[1.1] contrast-[1.05]"
          priority
        />

        <div className="relative z-30 container mx-auto px-4 text-center space-y-2 animate-in fade-in slide-in-from-top-4 duration-1000">
          <h1 className="text-4xl md:text-7xl lg:text-[7rem] font-black uppercase italic tracking-tighter leading-none drop-shadow-[0_0_30px_rgba(255,255,255,0.4)] text-white/90">
            Football <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Chaos</span>
          </h1>
          <p className="text-sm md:text-xl text-white font-black uppercase tracking-[0.5em] italic drop-shadow-lg">
            Spain are the champions
          </p>
        </div>

        {/* Bottom gradient to blend into cards */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-100 h-1/2 mt-auto" />
      </section>

      {/* Knockouts Hero Section — Spain Championship Celebration */}
      <section className="container mx-auto px-4 -mt-32 relative z-40">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-card/70 backdrop-blur-3xl border border-border/50 shadow-2xl p-8 md:p-14 text-center">
          {/* Decorative blobs */}
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-primary/15 rounded-full blur-[100px]" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-orange-500/15 rounded-full blur-[100px]" />

          <div className="relative z-10 flex flex-col items-center gap-8">
            {/* Label */}
            <div className="flex items-center gap-3">
              <span className="h-px w-8 md:w-16 bg-primary/40" />
              <span className="flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-primary italic">
                <Trophy className="h-3 w-3 fill-primary animate-bounce text-yellow-400" /> Tournament Concluded
              </span>
              <span className="h-px w-8 md:w-16 bg-primary/40" />
            </div>

            {/* Headline */}
            <div className="space-y-1">
              <h2 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter leading-none">
                Spain Are <span className="text-muted-foreground opacity-30">The Champions.</span><br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Viva España! 🇪🇸🏆</span>
              </h2>
              <p className="text-muted-foreground text-base md:text-lg font-bold uppercase tracking-widest opacity-80 max-w-3xl mx-auto pt-4">
                Spain defeated Argentina 1-0 after extra time (Ferran Torres 106&apos;) at MetLife Stadium to win their second FIFA World Cup! Check the final bracket standings and review prediction scores.
              </p>
            </div>

            {/* Status Badges */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-3 bg-card/50 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-border/20">
                <div className="h-2 w-2 rounded-full bg-yellow-400 shadow-[0_0_8px_#facc15]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-yellow-400">Spain: 2026 World Champion</span>
              </div>
              <div className="flex items-center gap-3 bg-card/50 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-border/20">
                <Zap className="h-4 w-4 text-primary fill-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest">Tournament Locked</span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-4 w-full max-w-4xl px-6">
              <Link href="/bracket" className="flex-1 min-w-[260px]">
                <Button size="lg" className="w-full rounded-2xl px-10 text-2xl font-black h-20 shadow-2xl hover:scale-[1.03] transition-all italic uppercase tracking-wider bg-yellow-400 hover:bg-yellow-300 text-black border-4 border-black group">
                  Check Bracket <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/history" className="flex-1 min-w-[260px]">
                <Button variant="outline" size="lg" className="w-full rounded-2xl px-10 text-2xl font-black h-20 backdrop-blur-md bg-muted/50 transition-all italic uppercase tracking-wider hover:bg-muted/80 border-2 border-border/80">
                  History Vault
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Matches Full Width Section - Hiding / Commenting out for post-tournament state */}
      {/*
      <section className="w-full bg-muted/30 border-y border-border/50 py-16 mb-16 mt-16 relative overflow-hidden">
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
      */}

      {/* Individual Awards Section */}
      <section className="container mx-auto px-4 py-24 relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="flex flex-col items-center justify-center text-center space-y-4 mb-20 px-4">
          <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">
            Tournament <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Awards</span>
          </h2>
          <p className="text-muted-foreground font-bold text-sm uppercase tracking-[0.2em] opacity-70">World Cup 2026 Honor Roll</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto relative z-10">
          {/* Golden Ball Card */}
          <Card className="relative overflow-hidden border-yellow-500/20 bg-yellow-500/5 backdrop-blur-xl shadow-xl p-8 rounded-[2.5rem] flex flex-col items-center text-center transition-all duration-300 hover:scale-[1.03] hover:shadow-yellow-500/5 group border border-border/10">
            <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl" />
            <div className="h-16 w-16 bg-yellow-500/15 border border-yellow-500/30 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-yellow-500/5">
              <Award className="h-8 w-8 text-yellow-400 fill-yellow-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-yellow-500/80 mb-2">Golden Ball (Best Player)</span>
            <div className="flex items-center gap-2 mb-1">
              <Flag emoji="🇪🇸" size={24} />
              <h3 className="text-2xl font-black uppercase italic tracking-tight text-foreground">Rodri</h3>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Spain | Midfielder</p>
            <p className="text-sm text-muted-foreground font-medium max-w-xs leading-relaxed">
              The engine room of the Champions. Dominated every masterclass display in midfield and guided La Roja to global dominance.
            </p>
          </Card>

          {/* Golden Boot Card */}
          <Card className="relative overflow-hidden border-orange-500/20 bg-orange-500/5 backdrop-blur-xl shadow-xl p-8 rounded-[2.5rem] flex flex-col items-center text-center transition-all duration-300 hover:scale-[1.03] hover:shadow-orange-500/5 group border border-border/10">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl" />
            <div className="h-16 w-16 bg-orange-500/15 border border-orange-500/30 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/5">
              <Flame className="h-8 w-8 text-orange-400 fill-orange-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-500/80 mb-2">Golden Boot (Top Scorer)</span>
            <div className="flex items-center gap-2 mb-1">
              <Flag emoji="🇫🇷" size={24} />
              <h3 className="text-2xl font-black uppercase italic tracking-tight text-foreground">Kylian Mbappé</h3>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">France | Forward</p>
            <p className="text-sm text-muted-foreground font-medium max-w-xs leading-relaxed">
              A devastating, lightning-fast display of clinical finishing. Netted <span className="text-orange-400 font-bold border-b border-orange-400/20">10 goals</span> to capture the scoring charts.
            </p>
          </Card>

          {/* Golden Glove Card */}
          <Card className="relative overflow-hidden border-blue-500/20 bg-blue-500/5 backdrop-blur-xl shadow-xl p-8 rounded-[2.5rem] flex flex-col items-center text-center transition-all duration-300 hover:scale-[1.03] hover:shadow-blue-500/5 group border border-border/10">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
            <div className="h-16 w-16 bg-blue-500/15 border border-blue-500/30 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/5">
              <Shield className="h-8 w-8 text-blue-400 fill-blue-400 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-blue-500/80 mb-2">Golden Glove (Best GK)</span>
            <div className="flex items-center gap-2 mb-1">
              <Flag emoji="🇪🇸" size={24} />
              <h3 className="text-2xl font-black uppercase italic tracking-tight text-foreground">Unai Simón</h3>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Spain | Goalkeeper</p>
            <p className="text-sm text-muted-foreground font-medium max-w-xs leading-relaxed">
              An impenetrable wall. Kept <span className="text-blue-400 font-bold border-b border-blue-400/20">7 clean sheets</span> during the tournament, culminating in a pristine shutout in the Final.
            </p>
          </Card>
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
