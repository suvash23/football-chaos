import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, ClipboardList, MonitorPlay, MessageSquareText, ArrowRight, Globe, History, Calendar, MapPin, Zap } from "lucide-react";
import { Countdown } from "@/components/countdown";
import Image from "next/image";

export default function Home() {
  const features = [
    {
      title: "Match Predictions",
      description: "Guess the score and predict chaotic moments (e.g. 'Manager loses mind') to win points.",
      icon: ClipboardList,
      href: "/predictions",
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
          src="/hero-legends.png"
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

      {/* Countdown & Info Section */}
      <section className="container mx-auto px-4 -mt-32 relative z-40">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Countdown Card with Buttons */}
          <Card className="lg:col-span-2 overflow-hidden border-border/50 bg-card/70 backdrop-blur-3xl shadow-2xl flex flex-col">
            <CardHeader className="text-center pb-2 border-b border-border/10">
              <CardTitle className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground italic flex items-center justify-center gap-2">
                <Calendar className="h-4 w-4" /> Kickoff Starts In
              </CardTitle>
            </CardHeader>
            <CardContent className="py-12 flex-1 flex flex-col items-center justify-center gap-10">
              <Countdown targetDate="2026-06-11T13:00:00-06:00" />

              <div className="flex flex-wrap items-center justify-center gap-4 w-full">
                <Link href="/predictions" className="flex-1 min-w-[200px]">
                  <Button size="lg" className="w-full rounded-2xl px-8 text-xl font-black h-16 shadow-xl hover:scale-[1.02] transition-all italic uppercase tracking-wider bg-yellow-500 hover:bg-yellow-400 text-black border-2 border-black group">
                    Start Predicting <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/groups" className="flex-1 min-w-[200px]">
                  <Button variant="outline" size="lg" className="w-full rounded-2xl px-8 text-xl font-black h-16 backdrop-blur-md bg-muted/50 transition-all italic uppercase tracking-wider hover:bg-muted/80">
                    Tournament Wiki
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Opening Match Card */}
          <Card className="overflow-hidden border-border/50 bg-primary shadow-2xl text-primary-foreground relative group">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
            <CardHeader className="pb-2 border-b border-white/10">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-white/70 italic flex items-center gap-2">
                <Zap className="h-3 w-3 fill-white/70" /> Opening Match Highlight
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 relative z-10">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex items-center justify-between w-full px-4">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl">🇲🇽</span>
                    <span className="text-sm font-black uppercase italic">Mexico</span>
                  </div>
                  <div className="text-2xl font-black italic text-white/50">VS</div>
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl">🇿🇦</span>
                    <span className="text-sm font-black uppercase italic">S. Africa</span>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-xl font-black italic tracking-tight">Estadio Azteca</p>
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-white/80 uppercase">
                    <MapPin className="h-3 w-3" /> Mexico City, MEX
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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
