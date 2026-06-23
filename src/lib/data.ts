import teamsMetaRaw from './teams_meta.json';
import squadsDataRaw from './data/squads.json';
import worldCup2026Raw from '../../public/data/worldcups/2026.json';
import { supabase } from './supabase';

export type Goal = {
    name: string;
    minute: string;
    penalty?: boolean;
    owngoal?: boolean;
};

export interface JsonMatch {
    team1: string;
    team2: string;
    score?: { ft: [number, number] };
    goals1?: Goal[];
    goals2?: Goal[];
}

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
    goals1?: Goal[];
    goals2?: Goal[];
};

type TeamJson = { name: string; flag_icon: string;[key: string]: unknown };

// Match data fetching singleton to prevent thundering herd
let matchCache: { data: Match[]; timestamp: number } | null = null;
let pendingMatchesRequest: Promise<Match[]> | null = null;
const CACHE_TTL_MS = 10_000; // 10 seconds

export async function fetchMatches(force = false): Promise<Match[]> {
    // 1. If we have a fresh cache and no force, return it
    if (!force && matchCache && Date.now() - matchCache.timestamp < CACHE_TTL_MS) {
        return matchCache.data;
    }

    // 2. If a request is already in flight, wait for that same request
    if (pendingMatchesRequest) {
        return pendingMatchesRequest;
    }

    // 3. Otherwise, start a new request and track it
    pendingMatchesRequest = (async () => {
        const MAX_RETRIES = 3;
        const ATTEMPT_TIMEOUT_MS = 5000;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                console.log(`fetchMatches: Attempt ${attempt}/${MAX_RETRIES} (force=${force})...`);

                // Select only specific columns to optimize performance and reduce bandwidth
                const matchesPromise = supabase
                    .from('matches')
                    .select('id, round, home_team, away_team, kickoff_time, status, home_score, away_score, group_name, stadium')
                    .order('kickoff_time', { ascending: true });

                const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((_, reject) =>
                    setTimeout(() => reject(new Error(`Timeout attempt ${attempt}`)), ATTEMPT_TIMEOUT_MS)
                );

                interface DBMatch {
                    id: string;
                    round: string;
                    home_team: string;
                    away_team: string;
                    kickoff_time: string;
                    status: Match['status'];
                    home_score: number | null;
                    away_score: number | null;
                    group_name?: string;
                    stadium?: string;
                }

                const result = await Promise.race([
                    matchesPromise,
                    timeoutPromise
                ]) as { data: DBMatch[] | null; error: { message: string } | null };

                const dbMatches = result.data;
                const error = result.error;

                if (error) {
                    throw new Error(error.message);
                }

                if (!dbMatches) {
                    throw new Error("No data returned");
                }

                const mapped = dbMatches.map((m) => {
                    const homeTeamInfo = TEAMS.find((t) => t.name === m.home_team);
                    const awayTeamInfo = TEAMS.find((t) => t.name === m.away_team);



                    // Try to find goal info in our local JSON
                    const jsonMatch = (worldCup2026Raw.matches as JsonMatch[]).find(jm =>
                        (jm.team1 === m.home_team && jm.team2 === m.away_team) ||
                        (jm.team1 === m.away_team && jm.team2 === m.home_team)
                    );

                    const isReversed = jsonMatch && jsonMatch.team1 !== m.home_team;

                    return {
                        id: m.id,
                        round: m.round,
                        home_team: m.home_team,
                        away_team: m.away_team,
                        kickoff_time: m.kickoff_time,
                        status: m.status,
                        home_score: m.home_score ?? (jsonMatch?.score?.ft ? (isReversed ? jsonMatch.score.ft[1] : jsonMatch.score.ft[0]) : null),
                        away_score: m.away_score ?? (jsonMatch?.score?.ft ? (isReversed ? jsonMatch.score.ft[0] : jsonMatch.score.ft[1]) : null),
                        home_flag: homeTeamInfo?.flag_icon || "🚩",
                        away_flag: awayTeamInfo?.flag_icon || "🚩",
                        group: m.group_name || homeTeamInfo?.group || "Unknown",
                        stadium: m.stadium || "Unknown",
                        goals1: isReversed ? jsonMatch?.goals2 : jsonMatch?.goals1,
                        goals2: isReversed ? jsonMatch?.goals1 : jsonMatch?.goals2,
                    };
                });

                console.log(`fetchMatches: Success on attempt ${attempt}. Found ${mapped.length} matches.`);
                matchCache = { data: mapped, timestamp: Date.now() };
                return mapped;
            } catch (err) {
                console.warn(`fetchMatches: Attempt ${attempt} failed:`, err instanceof Error ? err.message : err);
                if (attempt === MAX_RETRIES) {
                    console.error("fetchMatches: All retry attempts failed.");
                    return matchCache?.data ?? [];
                }
                // Wait briefly before retrying
                await new Promise(resolve => setTimeout(resolve, 500 * attempt));
            }
        }
        return matchCache?.data ?? [];
    })().finally(() => {
        pendingMatchesRequest = null;
    });

    return pendingMatchesRequest;
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

export type Scorer = {
    name: string;
    team: string;
    flag: string;
    goals: number;
};

export async function fetchTopScorers(): Promise<Scorer[]> {
    const matches = (worldCup2026Raw.matches as JsonMatch[]);
    const scorerMap: Record<string, { goals: number, team: string, flag: string }> = {};

    matches.forEach(m => {
        const processGoals = (goals: Goal[] | undefined, teamName: string) => {
            if (!goals) return;
            goals.forEach(g => {
                if (g.owngoal) return; // Own goals don't count for the player
                const key = `${g.name}|${teamName}`;
                if (!scorerMap[key]) {
                    const teamInfo = TEAMS.find(t => t.name === teamName);
                    scorerMap[key] = {
                        goals: 0,
                        team: teamName,
                        flag: teamInfo?.flag_icon || "🚩"
                    };
                }
                scorerMap[key].goals += 1;
            });
        };

        processGoals(m.goals1, m.team1);
        processGoals(m.goals2, m.team2);
    });

    return Object.entries(scorerMap)
        .map(([key, data]) => ({
            name: key.split('|')[0],
            team: data.team,
            flag: data.flag,
            goals: data.goals
        }))
        .sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name))
        .slice(0, 10); // Top 10
}

export const MOCK_LEADERBOARD = [
    { id: "1", username: "TacticalGenius", points: 150, title: "Football Prophet", avatar: "🧠" },
    { id: "2", username: "VAR_Manager", points: 130, title: "Assistant Referee", avatar: "📺" },
    { id: "3", username: "SofaCoach99", points: 110, title: "Certified Couch Coach", avatar: "🛋️" },
    { id: "4", username: "DiveMaster", points: 90, title: "Penalty Merchant", avatar: "🏊‍♂️" },
    { id: "5", username: "TwitterBallK", points: 70, title: "Twitter Tactical Expert", avatar: "🐦" },
];

export type WorldCupRecord = {
    winners: number;
    runnersUp: number;
    yearsWon: number[];
    yearsRunnerUp: number[];
};

export const WORLD_CUP_WINNERS: Record<string, WorldCupRecord> = {
    "Brazil": { winners: 5, runnersUp: 2, yearsWon: [1958, 1962, 1970, 1994, 2002], yearsRunnerUp: [1950, 1998] },
    "Germany": { winners: 4, runnersUp: 4, yearsWon: [1954, 1974, 1990, 2014], yearsRunnerUp: [1966, 1982, 1986, 2002] },
    "Italy": { winners: 4, runnersUp: 2, yearsWon: [1934, 1938, 1982, 2006], yearsRunnerUp: [1970, 1994] },
    "Argentina": { winners: 3, runnersUp: 3, yearsWon: [1978, 1986, 2022], yearsRunnerUp: [1930, 1990, 2014] },
    "France": { winners: 2, runnersUp: 2, yearsWon: [1998, 2018], yearsRunnerUp: [2006, 2022] },
    "Uruguay": { winners: 2, runnersUp: 0, yearsWon: [1930, 1950], yearsRunnerUp: [] },
    "England": { winners: 1, runnersUp: 0, yearsWon: [1966], yearsRunnerUp: [] },
    "Spain": { winners: 1, runnersUp: 0, yearsWon: [2010], yearsRunnerUp: [] },
};

export const EXCUSE_TEMPLATES = [
    // Tactical Delusions
    "We completely dominated spiritually, despite the {outcome}.",
    "Our tactical setup was too advanced for the referee to understand.",
    "We played 'False 9' but the players took the 'False' part too literally.",
    "We didn't lose, we simply experimented with a 'No-Win' strategy.",
    "The xG (Expected Goals) clearly shows we won the moral battle.",
    "Our high press was suffering from low blood pressure.",
    "The opposition parked the bus so hard they should be fined for traffic obstruction.",
    "We focused on ball retention, the scoreboard retention was secondary.",
    "Our wing-backs were actually playing as semi-detached midfielders.",
    "We won the second half on aggregate if you exclude the goals.",
    "The manager's iPad ran out of battery at the 60th minute.",
    "We were playing 4-4-2 while the universe was playing 11-0-0.",
    "Our 'tiki-taka' turned into 'clippy-cloppy' due to the humidity.",
    "We attempted a low block but forgot the 'block' part.",

    // Officiating & VAR
    "Clearly, the referee ruined football heritage.",
    "The VAR lines were drawn by an intern using a crayon.",
    "The referee's whistle was out of tune, distracting our defense.",
    "The linesman's flag had too much drag, slowing down our counter-attacks.",
    "VAR has a personal vendetta against our striker's haircut.",
    "The referee definitely has the opposition's manager in his Fantasy Football team.",
    "The fourth official gave us a 'look' that demoralized the bench.",
    "How can it be offside if the spirit of the player was onside?",
    "The referee's vanishing spray vanished too quickly, causing confusion.",
    "We were robbed by a man in a neon shirt who clearly hates joy.",
    "The VAR room was probably watching a cooking show during the penalty shout.",

    // Weather & Pitch
    "The grass was definitely suspicious today.",
    "The wind direction favored teams that don't believe in physics.",
    "The floodlights were 2% too dim for our sophisticated vision.",
    "The pitch was too green, it camouflaged the grass.",
    "It rained exactly when we were about to score, purely targeted weather.",
    "The ball was too round, making it difficult to control logically.",
    "The stadium's altitude affected our players' ability to care.",
    "The oxygen levels were optimized for the opposition's lungs.",
    "The grass was mowed in a pattern that induced vertigo in our wingers.",
    "A single leaf fell on the pitch during the decisive moment.",

    // Supernatural & Vibes
    "Our players were distracted by the opposition's vibes.",
    "Mercury is in retrograde, any other result was impossible.",
    "The stadium shadow looked like a giant L from the sky.",
    "Our lucky socks were in the laundry, we were doomed from the start.",
    "A black cat was seen near the team bus; the {outcome} was written in the stars.",
    "The crowd's chanting was at a frequency that disrupted our internal harmony.",
    "We were playing on a Tuesday, everyone knows we are a Wednesday team.",
    "The ball felt 'unhappy' every time we touched it.",
    "There was a glitch in the Matrix during the corner kick.",

    // Player & Staff Drama
    "I blame the early kickoff time. Unfair.",
    "The team chef put too much parsley in the pre-match pasta.",
    "Our captain's dog had a nightmare, the whole team felt the trauma.",
    "The away dressing room smelled slightly of lavender, making us too relaxed.",
    "The opposition manager's tie was so ugly it blinded our midfield.",
    "Our star striker was thinking about his mortgage during the one-on-one.",
    "The substitute's warm-up was too enthusiastic, creating a micro-climate.",
    "We misplaced our tactical whiteboard and had to use a napkin.",
    "The goalkeeper's gloves were too sticky, he couldn't let go of his anxiety.",
    "The kit man forgot the 'Away' shorts, the lack of coordination was fatal.",

    // Purely Delusional
    "We didn't lose, we just ran out of time to win.",
    "The scoreboard is actually a deep-state conspiracy.",
    "The {outcome} was a social experiment to test our fans' loyalty.",
    "If you remove all the goals scored against us, we actually won.",
    "We are boycotting victories until global warming is solved.",
    "The ball traveled through a wormhole during the deflection.",
    "We were playing for the 'Draft Pick', wait, wrong sport.",
    "Our performance was a piece of performance art about futility.",
    "The {outcome} is unacceptable, but consider the geopolitical climate.",
    "We won in the metaverse, which is where it really counts.",

    // Fan-Specific Meltdowns
    "The fans cheered too loudly, we couldn't hear the manager's genius.",
    "A fan in row Z was wearing a hat that looked exactly like a goalpost.",
    "The Twitter mentions were too toxic before kickoff.",
    "The stadium hotdogs were subpar, affecting the collective morale.",
    "The mascot's dance was culturally insensitive to our formation.",

    // Random Chaos
    "A pigeon landed on the crossbar, altering the gravitational field.",
    "The stadium Wi-Fi was down, we couldn't check the stats mid-game.",
    "The opposition's bus was too shiny, distracting our forwards.",
    "We were saving our energy for the post-match interview.",
    "The ball boy gave us the ball with a slightly judgmental expression.",
    "The grass was cut 1mm too short for our 'Poetry in Motion' playstyle.",
    "The kits were a shade of blue that induced sadness in our defenders.",
    "The corner flags were leaning at a 3-degree angle to the left.",
    "The mascot didn't high-five our goalie; the curse was activated.",
    "The post-match results were leaked in a dream I had last night.",
    "We played too well, the universe had to balance it out with a loss.",
    "Our hydration levels were 0.05% below the 'Elite' threshold.",
    "The ball's stitching was uneven, causing it to swerve away from the net.",
    "The grass was watered with sparkling water instead of still.",
    "The opposing goalkeeper was clearly using Jedi mind tricks.",
    "Our winger's boots were too new, they hadn't learned the meaning of friendship yet.",
    "The stadium announcer's voice was too soothing, our defense fell asleep.",
    "A butterfly flapped its wings in Brazil, causing our defense to collapse.",
    "The coin toss was won by the wrong side of the coin.",
    "The halftime oranges were slightly sour, ruining the mood.",
    "We played for the badge, but the badge was slightly crooked today.",
    "The net was too tight, it rejected our shot purely on principle.",
    "The sub was ready, but the fourth official's board had a dead pixel.",
    "Our midfield was social distancing from the ball.",
    "We are 'Resting' for the next millennium.",
    "The grass was too 'Grassy'. We expected something more synthetic.",
    "The ball had a 'Do Not Kick' sticker that only we could see.",
    "The goalkeeper's socks were mismatched, destroying our symmetry.",
    "The opposition's kits were camouflage against the advertising boards.",
    "The referee's whistle sounded like a bird our striker is afraid of.",
    "We were playing in 4D, but the game was only in 3D.",
    "The manager's voice was slightly hoarse, reducing our tactical IQ by 40%.",
    "The ball boy didn't respect our 'Quick Throw' heritage.",
    "Every time we shot, a fan sneezed, altering the ball's trajectory.",
    "The pitch was actually a giant treadmill set to 'Reverse'.",
    "We played with 'Inverted Wingers' who became so inverted they disappeared.",
    "The goalposts moved 2 inches to the right just as we shot.",
    "The {outcome} is just a glitch in the simulation. We go again.",
    "We won the 'Passion' trophy, the points are irrelevant.",
    "Our 'Process' is so long-term it hasn't actually started yet."
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

export type SquadPlayer = {
    no: string;
    pos: string;
    name: string;
    dob: string;
    caps: string;
    goals: string;
    club: string;
};

export type TeamSquad = {
    team: string;
    players: SquadPlayer[];
};

export const SQUADS: TeamSquad[] = squadsDataRaw as TeamSquad[];
