const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '../squads_wiki.html');
const metaPath = path.join(__dirname, '../src/lib/teams_meta.json');
const outputPath = path.join(__dirname, '../src/lib/data/squads.json');

const html = fs.readFileSync(htmlPath, 'utf8');
const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

// Improved h3 regex to handle inner spans (like Curacao)
const h3Regex = /<h3 id="([^"]+)">([\s\S]*?)<\/h3>/g;
const teams = [];
let match;
const sections = [];

while ((match = h3Regex.exec(html)) !== null) {
    const rawContent = match[2];
    const cleanName = rawContent.replace(/<[^>]*>/g, '').trim();
    sections.push({
        id: match[1],
        name: cleanName,
        start: match.index
    });
}

function normalize(name) {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

for (let i = 0; i < sections.length; i++) {
    const start = sections[i].start;
    const nextH2 = html.indexOf('<h2', start + 1);
    const nextH3 = html.indexOf('<h3', start + 1);
    let end = html.length;
    if (nextH2 !== -1 && nextH3 !== -1) end = Math.min(nextH2, nextH3);
    else if (nextH2 !== -1) end = nextH2;
    else if (nextH3 !== -1) end = nextH3;

    const sectionHtml = html.substring(start, end);
    const tableMatch = sectionHtml.match(/<table[^>]*>([\s\S]*?)<\/table>/);
    if (!tableMatch) continue;

    const players = [];
    const tableHtml = tableMatch[1];
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
        const rowContent = rowMatch[1];
        if (rowContent.includes('<th scope="col"')) continue;
        const colRegex = /<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/g;
        const cols = [];
        let colMatch;
        while ((colMatch = colRegex.exec(rowContent)) !== null) {
            cols.push(colMatch[1]);
        }
        if (cols.length >= 7) {
            const clean = (str) => {
                let cleaned = str.replace(/<span style="display:none">.*?<\/span>/g, '');
                cleaned = cleaned.replace(/<span class="flagicon">.*?<\/span>/g, '');
                cleaned = cleaned.replace(/<span class="birthdate"><span class="bday">.*?<\/span>/g, '');
                cleaned = cleaned.replace(/<[^>]*>/g, '');
                cleaned = cleaned.replace(/&nbsp;/g, ' ').replace(/&#91;/g, '[').replace(/&#93;/g, ']');
                cleaned = cleaned.replace(/^\s*\)\s*/, '');
                return cleaned.trim();
            };
            players.push({
                no: clean(cols[0]),
                pos: clean(cols[1]),
                name: clean(cols[2]),
                dob: clean(cols[3]),
                caps: clean(cols[4]),
                goals: clean(cols[5]),
                club: clean(cols[6])
            });
        }
    }

    if (players.length > 0) {
        let rawName = sections[i].name;
        const matchedMeta = meta.find(m =>
            normalize(m.name) === normalize(rawName) ||
            normalize(m.name_normalised || '') === normalize(rawName) ||
            (m.name === 'USA' && normalize(rawName) === 'unitedstates') ||
            (m.name === 'Bosnia & Herzegovina' && normalize(rawName) === 'bosniaandherzegovina') ||
            (m.name === 'DR Congo' && normalize(rawName) === 'congohr') || // Wikipedia sometimes uses Congo DR
            (m.name === 'DR Congo' && normalize(rawName) === 'democraticrepublicofthecongo')
        );

        teams.push({
            team: matchedMeta ? matchedMeta.name : rawName,
            players: players
        });
    }
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(teams, null, 2));
console.log(`Successfully parsed ${teams.length} teams into ${outputPath}`);
