const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const round = (value, digits = 2) => {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
};

const parseOversToBalls = (oversValue) => {
    const raw = String(oversValue ?? '0');
    if (!raw.includes('.')) {
        return (toNumber(raw, 0) * 6);
    }

    const [oversPart, ballsPart] = raw.split('.');
    const overs = toNumber(oversPart, 0);
    const balls = Math.min(Math.max(toNumber(ballsPart, 0), 0), 5);
    return (overs * 6) + balls;
};

const ballsToOversText = (balls) => {
    const total = Math.max(0, toNumber(balls, 0));
    const overs = Math.floor(total / 6);
    const rem = total % 6;
    return `${overs}.${rem}`;
};

const getName = (entity, fallback = 'Unknown') => {
    if (!entity) return fallback;
    if (typeof entity === 'string') return entity;
    return entity.name || entity.fullName || entity.shortname || fallback;
};

const normalizeSeriesText = (value) => String(value || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

const inferSeriesName = (match) => {
    const explicit = match?.series_name || match?.seriesName || match?.series?.name;
    if (explicit) return String(explicit).trim();

    const rawName = String(match?.name || '').trim();
    if (!rawName) return 'Current Series';

    const parts = rawName.split(',').map((part) => part.trim()).filter(Boolean);
    if (parts.length >= 2) {
        return parts[parts.length - 1];
    }

    return rawName;
};

const getSeriesMeta = (match) => {
    const seriesId = String(match?.series_id || match?.seriesId || match?.series?.id || '').trim();
    const seriesName = inferSeriesName(match);
    const seriesKey = seriesId || normalizeSeriesText(seriesName) || `series-${String(match?.matchType || 'unknown').toLowerCase()}`;

    return {
        seriesKey,
        seriesId: seriesId || null,
        seriesName
    };
};

const parseTeamFromInning = (inningText) => {
    const raw = String(inningText || '').trim();
    if (!raw) return 'Unknown Team';

    const lower = raw.toLowerCase();
    const index = lower.indexOf(' inning');
    if (index > 0) {
        return raw.slice(0, index).trim();
    }

    return raw;
};

const safePlayerName = (row) => {
    const name = getName(row?.batsman || row?.player || row?.name || row?.bowler, '').trim();
    if (!name) return null;
    if (/^extras$/i.test(name) || /^total$/i.test(name)) return null;
    return name;
};

const createBattingEntry = (player, team) => ({
    player,
    team,
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    innings: 0,
    matches: new Set()
});

const createBowlingEntry = (player, team) => ({
    player,
    team,
    wickets: 0,
    runsConceded: 0,
    oversBalls: 0,
    spells: 0,
    matches: new Set()
});

const aggregateLeaderboards = ({ matches, scorecardsByMatchId, limit = 10 }) => {
    const battingMap = new Map();
    const bowlingMap = new Map();

    let inningsProcessed = 0;
    let matchesWithScorecards = 0;

    for (const match of matches) {
        const matchId = String(match?.id || match?._id || '');
        if (!matchId) continue;

        const payload = scorecardsByMatchId.get(matchId);
        const normalized = payload?.data || payload || null;
        const inningsList = Array.isArray(normalized?.scorecard) ? normalized.scorecard : [];
        if (!inningsList.length) continue;

        matchesWithScorecards += 1;

        inningsList.forEach((inning) => {
            inningsProcessed += 1;
            const team = parseTeamFromInning(inning?.inning);

            const battingRows = Array.isArray(inning?.batting) ? inning.batting : [];
            battingRows.forEach((row) => {
                const player = safePlayerName(row);
                if (!player) return;

                const key = `${player.toLowerCase()}::${team.toLowerCase()}`;
                const entry = battingMap.get(key) || createBattingEntry(player, team);

                entry.runs += toNumber(row?.runs ?? row?.r, 0);
                entry.balls += toNumber(row?.balls ?? row?.b, 0);
                entry.fours += toNumber(row?.fours ?? row?.['4s'] ?? row?.['4'], 0);
                entry.sixes += toNumber(row?.sixes ?? row?.['6s'] ?? row?.['6'], 0);
                entry.innings += 1;
                entry.matches.add(matchId);

                battingMap.set(key, entry);
            });

            const bowlingRows = Array.isArray(inning?.bowling) ? inning.bowling : [];
            bowlingRows.forEach((row) => {
                const player = safePlayerName(row);
                if (!player) return;

                const key = `${player.toLowerCase()}::${team.toLowerCase()}`;
                const entry = bowlingMap.get(key) || createBowlingEntry(player, team);

                entry.wickets += toNumber(row?.wickets ?? row?.w, 0);
                entry.runsConceded += toNumber(row?.runs ?? row?.r, 0);
                entry.oversBalls += parseOversToBalls(row?.overs ?? row?.o);
                entry.spells += 1;
                entry.matches.add(matchId);

                bowlingMap.set(key, entry);
            });
        });
    }

    const battingRows = [...battingMap.values()].map((entry) => {
        const strikeRate = entry.balls > 0 ? (entry.runs * 100) / entry.balls : 0;
        return {
            player: entry.player,
            team: entry.team,
            runs: entry.runs,
            balls: entry.balls,
            fours: entry.fours,
            sixes: entry.sixes,
            innings: entry.innings,
            matches: entry.matches.size,
            strikeRate: round(strikeRate, 2)
        };
    });

    const bowlingRows = [...bowlingMap.values()].map((entry) => {
        const overs = entry.oversBalls / 6;
        const economy = overs > 0 ? entry.runsConceded / overs : 99;
        return {
            player: entry.player,
            team: entry.team,
            wickets: entry.wickets,
            runsConceded: entry.runsConceded,
            oversBalls: entry.oversBalls,
            oversText: ballsToOversText(entry.oversBalls),
            spells: entry.spells,
            matches: entry.matches.size,
            economy: round(economy, 2)
        };
    });

    const topRunScorers = battingRows
        .sort((a, b) => b.runs - a.runs || b.strikeRate - a.strikeRate)
        .slice(0, limit);

    const topWicketTakers = bowlingRows
        .sort((a, b) => b.wickets - a.wickets || a.economy - b.economy)
        .slice(0, limit);

    const bestEconomy = bowlingRows
        .filter((entry) => entry.oversBalls >= 12)
        .sort((a, b) => a.economy - b.economy || b.wickets - a.wickets)
        .slice(0, limit);

    const bestStrikeRates = battingRows
        .filter((entry) => entry.balls >= 20)
        .sort((a, b) => b.strikeRate - a.strikeRate || b.runs - a.runs)
        .slice(0, limit);

    return {
        leaderboards: {
            topRunScorers,
            topWicketTakers,
            bestEconomy,
            bestStrikeRates
        },
        coverage: {
            matchesWithScorecards,
            inningsProcessed,
            battingRows: battingRows.length,
            bowlingRows: bowlingRows.length
        }
    };
};

module.exports = {
    getSeriesMeta,
    aggregateLeaderboards
};
