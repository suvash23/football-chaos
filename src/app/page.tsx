import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, ClipboardList, MonitorPlay, MessageSquareText, Grid3X3, ArrowRight, Globe, History } from "lucide-react";

export default function Home() {
  const features = [
    {
      title: "Match Predictions",
      description: "Guess the score, choose the winner, and predict pure chaotic moments (e.g. 'Manager loses mind').",
      icon: ClipboardList,
      href: "/predictions",
      color: "text-blue-400"
    },
    {
      title: "Tournament Groups",
      description: "View all 48 teams competing for ultimate glory, categorized by their respective groups.",
      icon: Globe,
      href: "/groups",
      color: "text-emerald-400"
    },
    {
      title: "VAR Simulator",
      description: "Upload a screenshot and let our highly-certified 'refs' draw random offside lines to ruin the match.",
      icon: MonitorPlay,
      href: "/var-simulator",
      color: "text-red-400"
    },
    {
      title: "Excuse Generator",
      description: "Did your team lose? Generate the perfect, highly delusional excuse for Twitter.",
      icon: MessageSquareText,
      href: "/excuses",
      color: "text-green-400"
    },
    {
      title: "World Cup Vault",
      description: "Travel back in time and view interactive brackets from every single World Cup dating back to 1930.",
      icon: History,
      href: "/history",
      color: "text-yellow-400"
    },
    {
      title: "Fan Leaderboard",
      description: "Climb the ranks from 'Certified Couch Coach' to 'Football Prophet' and claim glory.",
      icon: Trophy,
      href: "/leaderboard",
      color: "text-purple-400"
    }
  ];

  return (
    <div className="flex-1 container mx-auto px-4 py-8 md:py-16 max-w-5xl">
      <div className="flex flex-col items-center justify-center text-center space-y-6 mb-16">
        <div className="inline-block rounded-full bg-primary/20 px-3 py-1 text-sm font-semibold text-primary mb-4 ring-1 ring-primary/30">
          🏆 The Unofficial Home of Football Banter
        </div>
        <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent uppercase italic tracking-tight">
          Football Chaos
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl font-medium">
          Predict scores, simulate absurd VAR decisions, generate excuses, and embrace the beautiful game&apos;s darkest arts.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
          <Link href="/predictions">
            <Button size="lg" className="rounded-full px-8 text-lg font-bold h-14">
              Start Predicting <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Link href="/var-simulator">
            <Button variant="outline" size="lg" className="rounded-full px-8 text-lg font-bold h-14">
              Try VAR Simulator
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, i) => (
          <Card key={i} className="group relative overflow-hidden transition-all hover:shadow-[0_0_40px_-10px_rgba(168,85,247,0.4)] hover:border-primary/50">
            <Link href={feature.href} className="absolute inset-0 z-10">
              <span className="sr-only">Go to {feature.title}</span>
            </Link>
            <CardHeader>
              <div className={`p-3 w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${feature.color}`}>
                <feature.icon className="w-6 h-6" />
              </div>
              <CardTitle className="text-2xl font-bold">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base text-muted-foreground">
                {feature.description}
              </CardDescription>
            </CardContent>
            <div className="absolute top-4 right-4 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0">
              <ArrowRight className="w-5 h-5 text-muted-foreground" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
