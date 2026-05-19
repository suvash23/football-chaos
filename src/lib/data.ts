import teamsMetaRaw from './teams_meta.json';
import { supabase } from './supabase';

export type Match = {
    id: string;
    round: string;
    home_team: string;
    away_team: string;
    kickoff_time: string;
    status: 'upcoming' | 'live' | 'finished';
    home_score: number | null;
    away_score: number | null;
    home_flag: string;
    away_flag: string;
    group: string;
    stadium: string;
};

type TeamJson = { name: string; flag_icon: string;[key: string]: unknown };

// Simple in-memory cache — avoids hitting Supabase on every page navigation
let matchCache: { data: Match[]; timestamp: number } | null = null;
const CACHE_TTL_MS = 60_000; // 60 seconds

export async function fetchMatches(): Promise<Match[]> {
    // Return cached data if still fresh
    if (matchCache && Date.now() - matchCache.timestamp < CACHE_TTL_MS) {
        return matchCache.data;
    }

    const { data: dbMatches, error } = await supabase.from('matches').select('*').order('kickoff_time', { ascending: true });
    if (error) {
        console.error("Error fetching matches:", error);
        return matchCache?.data ?? []; // return stale cache on error rather than empty
    }

    const mapped = dbMatches.map((m: { id: string, round: string, home_team: string, away_team: string, kickoff_time: string, status: 'upcoming' | 'live' | 'finished', home_score: number | null, away_score: number | null, group_name?: string, stadium?: string, [key: string]: unknown }) => {
        const homeTeamInfo = TEAMS.find((t) => t.name === m.home_team);
        const awayTeamInfo = TEAMS.find((t) => t.name === m.away_team);
        return {
            id: m.id,
            round: m.round,
            home_team: m.home_team,
            away_team: m.away_team,
            kickoff_time: m.kickoff_time,
            status: m.status,
            home_score: m.home_score,
            away_score: m.away_score,
            home_flag: homeTeamInfo?.flag_icon || "🚩",
            away_flag: awayTeamInfo?.flag_icon || "🚩",
            group: m.group_name || homeTeamInfo?.group || "Unknown",
            stadium: m.stadium || "Unknown",
        };
    });

    matchCache = { data: mapped, timestamp: Date.now() };
    return mapped;
}

// Call this after admin updates a match result so cache invalidates immediately
export function invalidateMatchCache() {
    matchCache = null;
}

export type Team = {
    name: string;
    flag_icon: string;
    group: string;
    continent: string;
};

export const TEAMS: Team[] = (teamsMetaRaw as TeamJson[]).map((t) => ({
    name: t.name,
    flag_icon: t.flag_icon,
    group: `Group ${t.group as string}`,
    continent: t.continent as string,
}));

export const MOCK_LEADERBOARD = [
    { id: "1", username: "TacticalGenius", points: 150, title: "Football Prophet", avatar: "🧠" },
    { id: "2", username: "VAR_Manager", points: 130, title: "Assistant Referee", avatar: "📺" },
    { id: "3", username: "SofaCoach99", points: 110, title: "Certified Couch Coach", avatar: "🛋️" },
    { id: "4", username: "DiveMaster", points: 90, title: "Penalty Merchant", avatar: "🏊‍♂️" },
    { id: "5", username: "TwitterBallK", points: 70, title: "Twitter Tactical Expert", avatar: "🐦" },
];

export const EXCUSE_TEMPLATES = [
    "We completely dominated spiritually, despite the {outcome}.",
    "The grass was definitely suspicious today.",
    "Clearly, the referee ruined football heritage.",
    "Our players were distracted by the opposition's vibes.",
    "The {outcome} is unacceptable, but consider the wind direction.",
    "I blame the early kickoff time. Unfair.",
    "We didn't lose, we just ran out of time to win."
];

export const FUNNY_PREDICTION_OPTIONS = [
    "VAR disaster",
    "Manager loses mind",
    "Penalty drama",
    "Last-minute heartbreak",
    "Twitter meltdown",
    "Player removes shirt",
    "Crowd boos referee"
];

export const BINGO_ITEMS = [
    "Player dives",
    "Commentator screams",
    "VAR takes forever",
    "Angry coach",
    "Crowd shown crying",
    "Dramatic replay",
    "Player removes shirt",
    "Unnecessary yellow card",
    "Ball hits the woodwork",
    "Fans invading pitch",
    "Manager kicks water bottle",
    "Goalkeeper goes up for corner",
    "Tears after full time",
    "Offside by an eyelash",
    "Embarrassing own goal",
    "Unexpected red card",
    "Substitute scores",
    "Injury time drama",
    "Camera catches fan eating",
    "Controversial penalty",
    "Player complains to ref",
    "Over-the-top celebration",
    "Manager pacing furiously",
    "Missed open goal",
    "Perfect top bin"
];
