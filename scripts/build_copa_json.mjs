/**
 * Parses Copa América .txt tournament files from openfootball/copa-america
 * and writes JSON files compatible with the vault format used in the app.
 *
 * Usage: node scripts/build_copa_json.mjs
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'public', 'data', 'copas');
mkdirSync(OUT_DIR, { recursive: true });

// ─── Month map ────────────────────────────────────────────────────────────────
const MONTH = {
    Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
    Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

// ─── Score parser ─────────────────────────────────────────────────────────────
function parseScore(raw) {
    if (!raw) return undefined;
    raw = raw.trim();
    const hasPen = /pen/i.test(raw);
    const hasAet = /a\.e\.t/i.test(raw);
    const scores = [...raw.matchAll(/(\d+)-(\d+)/g)].map(m => [+m[1], +m[2]]);
    if (!scores.length) return undefined;
    if (!hasPen && !hasAet) return { ft: scores[0] };
    if (hasPen && !hasAet) {
        if (scores.length >= 2) return { p: scores[0], et: scores[1], ft: scores[1] };
        return { p: scores[0], ft: scores[0] };
    }
    if (!hasPen && hasAet) {
        if (scores.length >= 2) return { et: scores[0], ft: scores[1] };
        return { et: scores[0], ft: scores[0] };
    }
    // pen + aet
    if (scores.length >= 3) return { p: scores[0], et: scores[1], ft: scores[2] };
    if (scores.length === 2) return { p: scores[0], et: scores[1], ft: scores[1] };
    return { p: scores[0], ft: scores[0] };
}

// ─── Goal parser ──────────────────────────────────────────────────────────────
function parseGoals(goalsContent) {
    const [part1 = '', part2 = ''] = goalsContent.split(';');
    const parseTeam = (str) => {
        const goals = [];
        const re = /([A-ZÁÀÂÃÉÈÊÍÎÓÔÕÚÛÑÇÄÖÜÆØÅĢŠŽ][^']+?)\s+(\d+)(?:\+(\d+))?'([^A-ZÁÀÂÃÉÈÊÍÎÓÔÕÚÛÑÇÄÖÜÆØÅĢŠŽ,;]*)/g;
        let m;
        while ((m = re.exec(str)) !== null) {
            const name = m[1].trim();
            const minute = parseInt(m[2], 10);
            const flags = m[4] || '';
            const goal = { name, minute };
            if (/pen/i.test(flags)) goal.penalty = true;
            if (/o\.g/i.test(flags)) goal.owngoal = true;
            goals.push(goal);
        }
        return goals;
    };
    return [parseTeam(part1), parseTeam(part2)];
}

// ─── Round normaliser ─────────────────────────────────────────────────────────
function normaliseRound(raw) {
    const r = raw.trim();
    if (/quarter/i.test(r)) return 'Quarter-finals';
    if (/semi/i.test(r)) return 'Semi-finals';
    if (/third|3rd/i.test(r)) return 'Third place play-off';
    if (/^final$/i.test(r)) return 'Final';
    if (/^group\s+[A-F]$/i.test(r)) return 'Group ' + r.slice(-1).toUpperCase();
    if (/matchday/i.test(r)) return 'Group Stage';
    return r;
}

// ─── Section-heading detector ─────────────────────────────────────────────────
// The bullet character ▪ is U+25AA and multi-byte in UTF-8.
// After stripping \r from lines, we check codePoints.
function isSectionHeading(line) {
    return line.trim().startsWith('▪') || line.trimStart().charCodeAt(0) === 0x25AA;
}

// ─── Main parser ──────────────────────────────────────────────────────────────
async function parseTournament({ url, year, name }) {
    console.log(`Fetching ${url} …`);
    const res = await fetch(url);
    const text = await res.text();
    // Normalise line endings (CRLF → LF) and strip stray \r
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

    const matches = [];
    let currentRound = 'Group Stage';
    let currentGroup = null;
    let lastDate = `${year}-06-01`;

    for (let i = 0; i < lines.length; i++) {
        const raw = lines[i];
        const trimmed = raw.trim();

        if (!trimmed) continue;
        if (trimmed.startsWith('#')) continue;
        if (trimmed.startsWith('= Copa')) continue;
        // Skip group roster lines ("Group A  |  ...")
        if (/^Group [A-F]\s*\|/.test(trimmed)) continue;

        // ── Section heading (▪ …)
        if (isSectionHeading(trimmed)) {
            // Skip matchday span lines: "▪ Matchday 1  | …"
            if (/matchday\s+\d+\s*\|/i.test(trimmed)) continue;

            const sectionRaw = trimmed.replace(/^▪\s*/, '').replace(/\s*\|.*$/, '').trim();
            const sectionNorm = normaliseRound(sectionRaw);
            currentRound = sectionNorm;
            currentGroup = /^Group [A-F]$/.test(sectionNorm) ? sectionNorm : null;
            continue;
        }

        // ── Extract date from line prefix if present
        const dateRe = /(?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+)?(?:(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec))\s+(\d{1,2})/;
        const dateMatch = trimmed.match(dateRe);
        if (dateMatch) {
            lastDate = `${year}-${MONTH[dateMatch[1]]}-${String(dateMatch[2]).padStart(2, '0')}`;
        }

        // ── Strip date+time prefix to isolate "Team score Team @ venue"
        let rest = trimmed
            .replace(/^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+/, '')
            .replace(/^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\s+/, '')
            .replace(/^\d{2}:\d{2}\s+(?:UTC[+-]\d+\s+)?/, '')
            .replace(/\s*#.*$/, '')
            .trim();

        // ── Detect and split on score block
        // Score block: \d-\d optionally followed by pen/a.e.t./more N-N / (N-N)
        // There can be as few as 1 space separating team name from score (e.g., "Argentina 1-0 a.e.t.")
        // Strategy: find a score-like pattern anchored by surrounding context

        // Build score regex that captures the full score token
        const scoreTokenRe = /\b(\d+-\d+(?:\s+(?:pen\.?|a\.e\.t\.?|\d+-\d+)|\s+\(\d+-\d+\))*)/;

        const sm = rest.match(
            /^(.+?)\s{1,}(\d+-\d+(?:(?:\s+(?:pen\.?|a\.e\.t\.?|\d+-\d+)|\s+\(\d+-\d+\)))*)\s{1,}(.+?)(?:\s+@\s+(.+))?$/
        );

        if (!sm) continue;

        let team1 = sm[1].trim();
        const scoreRaw = sm[2].trim();
        let team2 = sm[3].trim();
        let ground = sm[4] ? sm[4].trim() : undefined;

        // Strip any trailing venue from team2 if @ was embedded
        if (team2.includes(' @ ')) {
            const atIdx = team2.indexOf(' @ ');
            ground = team2.slice(atIdx + 3).trim();
            team2 = team2.slice(0, atIdx).trim();
        }

        if (!team1 || !team2) continue;

        const match = {
            round: currentRound,
            date: lastDate,
            team1,
            team2,
            score: parseScore(scoreRaw),
        };
        if (currentGroup) match.group = currentGroup;
        if (ground) match.ground = ground;

        // Goals on next line?
        if (i + 1 < lines.length && /^\s+\(/.test(lines[i + 1])) {
            const goalsLine = lines[i + 1].trim().replace(/^\(/, '').replace(/\)$/, '');
            const [g1, g2] = parseGoals(goalsLine);
            if (g1.length) match.goals1 = g1;
            if (g2.length) match.goals2 = g2;
            i++;
        }

        matches.push(match);
    }

    return { name, matches };
}

// ─── Config ───────────────────────────────────────────────────────────────────
const TOURNAMENTS = [
    { url: 'https://raw.githubusercontent.com/openfootball/copa-america/master/2024--usa/copa.txt', year: '2024', name: 'Copa América 2024' },
    { url: 'https://raw.githubusercontent.com/openfootball/copa-america/master/2021--brazil/copa.txt', year: '2021', name: 'Copa América 2021' },
    { url: 'https://raw.githubusercontent.com/openfootball/copa-america/master/2011--argentina/copa.txt', year: '2011', name: 'Copa América 2011' },
];

// ─── Run ──────────────────────────────────────────────────────────────────────
for (const cfg of TOURNAMENTS) {
    const data = await parseTournament(cfg);
    const outPath = join(OUT_DIR, `${cfg.year}.json`);
    writeFileSync(outPath, JSON.stringify(data, null, 1));
    console.log(`✓ ${outPath}  —  ${data.matches.length} matches`);
    console.log('  Rounds:', [...new Set(data.matches.map(m => m.round))].join(', '));
}
console.log('\nDone!');
