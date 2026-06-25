import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateKnockouts() {
    const targetRoundArg = process.argv[2]

    const roundMap = {
        '32': ['Round of 32'],
        '16': ['Round of 16'],
        '8': ['Quarter-final'],
        '4': ['Semi-final'],
        '2': ['Match for third place', 'Final'],
        'all': ['Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final', 'Match for third place', 'Final']
    }

    const targetRounds = roundMap[targetRoundArg] || roundMap['all']
    const jsonPath = path.resolve(__dirname, '../public/data/worldcups/2026.json')
    const worldCupData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
    const matches = worldCupData.matches

    const knockouts = matches.filter(m => targetRounds.includes(m.round))

    console.log(`Processing ${knockouts.length} matches for round(s): ${targetRounds.join(', ')}...`)

    for (const m of knockouts) {
        // Only update if team names are actual teams (not placeholders like 1A, 2B, etc.)
        // Regular expression to check if it looks like a placeholder
        const isPlaceholder = (team) => !team || /^[123][A-L]$|^[WL][0-9]{1,3}$|^[1-3][A-L]\/.*$/.test(team)

        const homeTeam = m.team1
        const awayTeam = m.team2

        // Update if at least one team is not a placeholder anymore
        if (!isPlaceholder(homeTeam) || !isPlaceholder(awayTeam)) {
            console.log(`Updating Match #${m.num || 'N/A'} (${m.round}): ${homeTeam} vs ${awayTeam}`)

            const { data, error } = await supabase
                .from('matches')
                .update({
                    home_team: homeTeam,
                    away_team: awayTeam
                })
                .eq('match_number', m.num)
                .eq('round', m.round)

            if (error) {
                console.error(`Error updating Match #${m.num}:`, error.message)
            } else {
                console.log(`Successfully updated Match #${m.num}`)
            }
        }
    }

    console.log('Update complete!')
}

updateKnockouts()
