import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase Connection using Anon key
const SUPABASE_URL = "https://bnhqsjvqywbttaqkvpes.supabase.co";
const SUPABASE_KEY = "sb_publishable_thRaJ_1VIbBYVuv8hsScsg_FPP0EDBw";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seed() {
    console.log("Preparing data from worldcup.json...");
    const dataPath = path.resolve('./src/lib/worldcup.json');
    const d = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    const out = d.matches.map(m => {
        let tzOffsetRaw = m.time.split(' ')[1]?.replace('UTC', '') || '+0';
        if (tzOffsetRaw === '') tzOffsetRaw = '+0';
        const timeRaw = m.time.split(' ')[0];
        const sign = tzOffsetRaw.startsWith('-') ? '-' : '+';
        let hoursStr = tzOffsetRaw.replace('-', '').replace('+', '');
        if (hoursStr.length === 1) hoursStr = '0' + hoursStr;
        const isoString = `${m.date}T${timeRaw}:00${sign}${hoursStr}:00`;

        return {
            round: m.round,
            match_number: m.num ? parseInt(m.num) : null,
            date: m.date,
            time: m.time,
            home_team: m.team1,
            away_team: m.team2,
            kickoff_time: isoString,
            group_name: m.group || null,
            stadium: m.ground || null,
            status: 'upcoming'
        };
    });

    console.log(`Uploading ${out.length} matches to Supabase table 'matches'...`);

    // Clean existing rows securely so we can safely re-seed
    const { error: delError } = await supabase.from('matches').delete().neq('home_team', 'dummy1234');
    if (delError) console.log("Note: Could not delete existing rows (maybe none exist or permissions).", delError.message);

    // Chunk insert to avoid payload size errors
    const chunkSize = 25;
    for (let i = 0; i < out.length; i += chunkSize) {
        const chunk = out.slice(i, i + chunkSize);
        const { error } = await supabase.from('matches').insert(chunk);
        if (error) {
            console.error(`Error inserting chunk ${i} to ${i + chunkSize}:`, error);
            return;
        }
    }

    console.log("Seeding completed successfully! You can verify in the Supabase Dashboard.");
}

seed();
