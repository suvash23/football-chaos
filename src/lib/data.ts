import worldcupRaw from './worldcup.json';
import teamsMetaRaw from './teams_meta.json';

export type Match = {
    id: string;
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

type MatchJson = { team1: string; team2: string; time: string; date: string;[key: string]: unknown };
type TeamJson = { name: string; flag_icon: string;[key: string]: unknown };

// Filter out placeholder match IDs like "2A", "W74", etc., to only show group stages that have known teams.
export const MOCK_MATCHES: Match[] = (worldcupRaw.matches as MatchJson[])
    .filter((m) => m.team1.length > 2 && !m.team1.startsWith("W") && !m.team1.startsWith("L"))
    .map((m, index: number) => {
        const homeTeamInfo = (teamsMetaRaw as TeamJson[]).find((t) => t.name === m.team1) || { flag_icon: "🚩" };
        const awayTeamInfo = (teamsMetaRaw as TeamJson[]).find((t) => t.name === m.team2) || { flag_icon: "🚩" };

        // Parse time into ISO format "YYYY-MM-DDTHH:mm:00-00:00"
        let tzOffsetRaw = m.time.split(' ')[1]?.replace('UTC', '') || "+0";
        if (tzOffsetRaw === "") tzOffsetRaw = "+0"; // Handle raw "UTC"

        const timeRaw = m.time.split(' ')[0];
        const sign = tzOffsetRaw.startsWith('-') ? '-' : '+';
        let hoursStr = tzOffsetRaw.replace('-', '').replace('+', '');
        if (hoursStr.length === 1) hoursStr = "0" + hoursStr;
        const isoString = `${m.date}T${timeRaw}:00${sign}${hoursStr}:00`;

        return {
            id: `m_${index}`,
            home_team: m.team1,
            away_team: m.team2,
            kickoff_time: isoString,
            status: 'upcoming',
            home_score: null,
            away_score: null,
            home_flag: homeTeamInfo.flag_icon,
            away_flag: awayTeamInfo.flag_icon,
            group: (m.group as string) || '',
            stadium: (m.ground as string) || '',
        };
    });

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
