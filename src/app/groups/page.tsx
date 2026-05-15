import { TEAMS } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe } from "lucide-react";

export default function GroupsPage() {
    // Group teams by their group name
    const groupedTeams = TEAMS.reduce((acc, team) => {
        if (!acc[team.group]) {
            acc[team.group] = [];
        }
        acc[team.group].push(team);
        return acc;
    }, {} as Record<string, typeof TEAMS>);

    const sortedGroupNames = Object.keys(groupedTeams).sort();

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="flex flex-col items-center justify-center text-center space-y-4 mb-12 animate-in fade-in slide-in-from-bottom-4">
                <div className="p-3 w-16 h-16 rounded-2xl bg-primary/20 text-primary flex items-center justify-center mb-2">
                    <Globe className="w-8 h-8" />
                </div>
                <h1 className="text-4xl font-black italic tracking-tight uppercase">Tournament Groups</h1>
                <p className="text-muted-foreground text-lg max-w-2xl">
                    All 48 teams competing for the ultimate glory. View the 12 groups for the 2026 World Cup.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sortedGroupNames.map((groupName) => (
                    <Card key={groupName} className="overflow-hidden border-border/50 bg-card/50 backdrop-blur hover:bg-card/80 transition-all hover:scale-[1.02] duration-300 shadow-lg">
                        <CardHeader className="bg-muted/30 pb-4 border-b border-border/50">
                            <CardTitle className="text-center text-2xl font-black uppercase tracking-wider text-primary">{groupName}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <ul className="space-y-4">
                                {groupedTeams[groupName].map((team) => (
                                    <li key={team.name} className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                                        <span className="text-3xl drop-shadow-md">{team.flag_icon}</span>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-lg leading-tight">{team.name}</span>
                                            <span className="text-xs text-muted-foreground uppercase font-semibold">{team.continent}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
