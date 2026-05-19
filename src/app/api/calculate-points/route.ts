import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
}

function getMatchResult(home: number, away: number): 'home' | 'draw' | 'away' {
    if (home > away) return 'home';
    if (away > home) return 'away';
    return 'draw';
}

function calculatePoints(
    homeScore: number,
    awayScore: number,
    predictedHome: number,
    predictedAway: number,
): number {
    // Exact score: 5 points
    if (homeScore === predictedHome && awayScore === predictedAway) return 5;
    // Correct result direction: 2 points
    if (getMatchResult(homeScore, awayScore) === getMatchResult(predictedHome, predictedAway)) return 2;
    return 0;
}

export async function POST(request: Request) {
    // Guard: missing service role key gives a clear JSON error instead of empty crash
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json(
            { error: 'SUPABASE_SERVICE_ROLE_KEY is not set in environment variables. Add it to .env.local and restart the dev server.' },
            { status: 500 }
        );
    }

    // Validate cron secret or admin token
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = getAdminClient();

    try {
        // 1. Fetch all finished matches
        const { data: finishedMatches, error: matchError } = await admin
            .from('matches')
            .select('id, home_score, away_score')
            .eq('status', 'finished')
            .not('home_score', 'is', null)
            .not('away_score', 'is', null);

        if (matchError) throw matchError;
        if (!finishedMatches || finishedMatches.length === 0) {
            return NextResponse.json({ message: 'No finished matches to process.', processed: 0 });
        }

        const matchIds = (finishedMatches as { id: string; home_score: number; away_score: number }[]).map(m => m.id);

        // 2. Fetch all predictions for those matches
        const { data: predictions, error: predError } = await admin
            .from('predictions')
            .select('id, user_id, match_id, predicted_home_score, predicted_away_score')
            .in('match_id', matchIds);

        if (predError) throw predError;
        if (!predictions || predictions.length === 0) {
            return NextResponse.json({ message: 'No predictions found for finished matches.', processed: 0 });
        }

        // 3. Calculate points for each prediction
        type FinishedMatch = { id: string; home_score: number; away_score: number };
        type Prediction = { id: string; user_id: string; match_id: string; predicted_home_score: number; predicted_away_score: number };

        const matchMap = new Map<string, FinishedMatch>(
            (finishedMatches as FinishedMatch[]).map(m => [m.id, m])
        );

        const updatedPredictions = (predictions as Prediction[]).map(p => {
            const match = matchMap.get(p.match_id);
            if (!match) return { id: p.id, user_id: p.user_id, points_awarded: 0 };
            const pts = calculatePoints(match.home_score, match.away_score, p.predicted_home_score, p.predicted_away_score);
            return { id: p.id, user_id: p.user_id, points_awarded: pts };
        });

        // 4. Update predictions with awarded points
        for (const pred of updatedPredictions) {
            await admin
                .from('predictions')
                .update({ points_awarded: pred.points_awarded })
                .eq('id', pred.id);
        }

        // 5. Aggregate total points per user and update profiles
        const userPoints = new Map<string, number>();
        for (const pred of updatedPredictions) {
            userPoints.set(pred.user_id, (userPoints.get(pred.user_id) || 0) + pred.points_awarded);
        }

        for (const [userId, totalPoints] of userPoints.entries()) {
            await admin
                .from('profiles')
                .update({ points: totalPoints })
                .eq('id', userId);
        }

        return NextResponse.json({
            message: 'Points calculated and updated successfully!',
            processed: predictions.length,
            usersUpdated: userPoints.size,
            scoring: { exact_score: 5, correct_result: 2 },
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

// Also allow GET so Vercel cron can hit it
export async function GET(request: Request) {
    return POST(request);
}
