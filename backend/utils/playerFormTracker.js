const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

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
        return toNumber(raw, 0) * 6;
    }

    const [oversPart, ballsPart] = raw.split('.');
    const overs = toNumber(oversPart, 0);
    const balls = clamp(toNumber(ballsPart, 0), 0, 5);
    return (overs * 6) + balls;
};

const normalizeTeamText = (value) => String(value || '')
    .toLowerCase()
    .replace(/women|womens|a team|xi|under-?\d+/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const getName = (entity, fallback = 'Unknown') => {
    if (!entity) return fallback;
    if (typeof entity === 'string') return entity;
    return entity.name || entity.fullName || entity.shortname || fallback;
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

const average = (list, selector) => {
    if (!list.length) return 0;
    const sum = list.reduce((acc, item) => acc + selector(item), 0);
    return sum / list.length;
};

const standardDeviation = (values) => {
    if (values.length < 2) return 0;
    const mean = values.reduce((acc, value) => acc + value, 0) / values.length;
    const variance = values.reduce((acc, value) => acc + ((value - mean) ** 2), 0) / values.length;
    return Math.sqrt(variance);
};

const computeTrendPct = (currentAvg, previousAvg, defaultRise = 12) => {
    if (previousAvg <= 0) {
        return currentAvg > 0 ? defaultRise : 0;
    }
    return ((currentAvg - previousAvg) / previousAvg) * 100;
};

const getLastWindow = (records, windowSize) => records.slice(Math.max(0, records.length - windowSize));

const getPrevWindow = (records, windowSize) => {
    const end = Math.max(0, records.length - windowSize);
    const start = Math.max(0, end - windowSize);
    return records.slice(start, end);
};

const getStreak = (records, predicate) => {
    let streak = 0;
    for (let index = records.length - 1; index >= 0; index -= 1) {
        if (!predicate(records[index])) break;
        streak += 1;
    }
    return streak;
};

const uniqueTeamsFromMatch = (match, payload) => {
    const fromMatch = Array.isArray(match?.teams) ? match.teams : [];
    const fromTeamInfo = Array.isArray(payload?.teamInfo)
        ? payload.teamInfo.map((team) => getName(team, '')).filter(Boolean)
        : [];

    return [...new Set([...fromMatch, ...fromTeamInfo].filter(Boolean))];
};

const resolveOpponent = (teamName, teams) => {
    const teamKey = normalizeTeamText(teamName);
    if (!teamKey || teams.length < 2) return teams.find(Boolean) || 'Unknown';

    const exact = teams.find((team) => normalizeTeamText(team) === teamKey);
    const others = teams.filter((team) => normalizeTeamText(team) !== teamKey);

    if (!exact && teams.length) {
        const partial = teams.find((team) => normalizeTeamText(team).includes(teamKey) || teamKey.includes(normalizeTeamText(team)));
        if (partial) {
            const rest = teams.find((team) => team !== partial);
            return rest || partial;
        }
    }

    return others[0] || exact || 'Unknown';
};

const createPlayerBucket = (player, team) => ({
    player,
    team,
    batting: [],
    bowling: [],
    matches: new Set()
});

const inferRoleHint = (battingMatches, bowlingMatches) => {
    if (battingMatches >= 3 && battingMatches > (bowlingMatches * 1.2)) return 'Batter';
    if (bowlingMatches >= 3 && bowlingMatches > (battingMatches * 1.2)) return 'Bowler';
    return 'All-Rounder';
};

const aggregatePlayerForm = ({ matches, scorecardsByMatchId, limit = 80 }) => {
    const playerMap = new Map();

    let inningsProcessed = 0;
    let matchesWithScorecards = 0;
    let battingAppearances = 0;
    let bowlingSpells = 0;

    for (const match of matches) {
        const matchId = String(match?.id || match?._id || '');
        if (!matchId) continue;

        const payload = scorecardsByMatchId.get(matchId);
        const normalized = payload?.data || payload || null;
        const inningsList = Array.isArray(normalized?.scorecard) ? normalized.scorecard : [];
        if (!inningsList.length) continue;

        matchesWithScorecards += 1;

        const matchDateMs = Date.parse(
            normalized?.dateTimeGMT
            || match?.dateTimeGMT
            || normalized?.date
            || match?.date
            || normalized?.updatedAt
            || ''
        ) || Date.now();
        const teams = uniqueTeamsFromMatch(match, normalized);
        const matchName = normalized?.name || match?.name || 'Match';

        const battingByPlayer = new Map();
        const bowlingByPlayer = new Map();

        inningsList.forEach((inning) => {
            inningsProcessed += 1;
            const team = parseTeamFromInning(inning?.inning);
            const opponent = resolveOpponent(team, teams);

            const battingRows = Array.isArray(inning?.batting) ? inning.batting : [];
            battingRows.forEach((row) => {
                const player = safePlayerName(row);
                if (!player) return;

                const key = `${player.toLowerCase()}::${team.toLowerCase()}`;
                const entry = battingByPlayer.get(key) || {
                    player,
                    team,
                    opponent,
                    runs: 0,
                    balls: 0,
                    fours: 0,
                    sixes: 0,
                    innings: 0
                };

                entry.runs += toNumber(row?.runs ?? row?.r, 0);
                entry.balls += toNumber(row?.balls ?? row?.b, 0);
                entry.fours += toNumber(row?.fours ?? row?.['4s'] ?? row?.['4'], 0);
                entry.sixes += toNumber(row?.sixes ?? row?.['6s'] ?? row?.['6'], 0);
                entry.innings += 1;

                battingByPlayer.set(key, entry);
            });

            const bowlingRows = Array.isArray(inning?.bowling) ? inning.bowling : [];
            bowlingRows.forEach((row) => {
                const player = safePlayerName(row);
                if (!player) return;

                const key = `${player.toLowerCase()}::${team.toLowerCase()}`;
                const entry = bowlingByPlayer.get(key) || {
                    player,
                    team,
                    opponent,
                    wickets: 0,
                    runsConceded: 0,
                    oversBalls: 0,
                    maidens: 0,
                    spells: 0
                };

                entry.wickets += toNumber(row?.wickets ?? row?.w, 0);
                entry.runsConceded += toNumber(row?.runs ?? row?.r, 0);
                entry.oversBalls += parseOversToBalls(row?.overs ?? row?.o);
                entry.maidens += toNumber(row?.maidens ?? row?.m, 0);
                entry.spells += 1;

                bowlingByPlayer.set(key, entry);
            });
        });

        battingByPlayer.forEach((entry, key) => {
            battingAppearances += 1;
            const playerBucket = playerMap.get(key) || createPlayerBucket(entry.player, entry.team);
            const strikeRate = entry.balls > 0 ? (entry.runs * 100) / entry.balls : 0;

            playerBucket.batting.push({
                matchId,
                matchName,
                dateMs: matchDateMs,
                dateTimeGMT: new Date(matchDateMs).toISOString(),
                team: entry.team,
                opponent: entry.opponent,
                runs: entry.runs,
                balls: entry.balls,
                fours: entry.fours,
                sixes: entry.sixes,
                strikeRate: round(strikeRate, 2)
            });
            playerBucket.matches.add(matchId);
            playerMap.set(key, playerBucket);
        });

        bowlingByPlayer.forEach((entry, key) => {
            bowlingSpells += 1;
            const playerBucket = playerMap.get(key) || createPlayerBucket(entry.player, entry.team);
            const overs = entry.oversBalls / 6;
            const economy = overs > 0 ? (entry.runsConceded / overs) : 0;

            playerBucket.bowling.push({
                matchId,
                matchName,
                dateMs: matchDateMs,
                dateTimeGMT: new Date(matchDateMs).toISOString(),
                team: entry.team,
                opponent: entry.opponent,
                wickets: entry.wickets,
                runsConceded: entry.runsConceded,
                oversBalls: entry.oversBalls,
                maidens: entry.maidens,
                economy: round(economy, 2)
            });
            playerBucket.matches.add(matchId);
            playerMap.set(key, playerBucket);
        });
    }

    const players = [...playerMap.values()].map((bucket) => {
        const batting = [...bucket.batting].sort((a, b) => a.dateMs - b.dateMs);
        const bowling = [...bucket.bowling].sort((a, b) => a.dateMs - b.dateMs);

        const battingLast5 = getLastWindow(batting, 5);
        const battingLast10 = getLastWindow(batting, 10);
        const battingPrev5 = getPrevWindow(batting, 5);

        const bowlingLast5 = getLastWindow(bowling, 5);
        const bowlingLast10 = getLastWindow(bowling, 10);
        const bowlingPrev5 = getPrevWindow(bowling, 5);

        const avgRuns5 = average(battingLast5, (row) => row.runs);
        const avgRuns10 = average(battingLast10, (row) => row.runs);
        const prevAvgRuns5 = average(battingPrev5, (row) => row.runs);
        const runsTrendPct = computeTrendPct(avgRuns5, prevAvgRuns5, 10);

        const strikeRate5 = average(battingLast5, (row) => row.strikeRate);
        const strikeRate10 = average(battingLast10, (row) => row.strikeRate);
        const prevStrikeRate5 = average(battingPrev5, (row) => row.strikeRate);
        const strikeRateTrendPct = computeTrendPct(strikeRate5, prevStrikeRate5, 5);

        const avgWickets5 = average(bowlingLast5, (row) => row.wickets);
        const avgWickets10 = average(bowlingLast10, (row) => row.wickets);
        const prevAvgWickets5 = average(bowlingPrev5, (row) => row.wickets);
        const wicketsTrendPct = computeTrendPct(avgWickets5, prevAvgWickets5, 8);

        const economy5 = average(bowlingLast5, (row) => row.economy);
        const economy10 = average(bowlingLast10, (row) => row.economy);
        const prevEconomy5 = average(bowlingPrev5, (row) => row.economy);
        const economyTrendPct = prevEconomy5 > 0
            ? ((prevEconomy5 - economy5) / prevEconomy5) * 100
            : 0;

        const formScoreRaw = (runsTrendPct * 0.35)
            + (wicketsTrendPct * 0.35)
            + (strikeRateTrendPct * 0.15)
            + (economyTrendPct * 0.15);
        const formScore = round(clamp(formScoreRaw, -100, 100), 2);

        const sampleSize = Math.max(batting.length, bowling.length);
        const confidence = round(clamp(30 + (sampleSize * 6) + Math.min(Math.abs(formScore), 30), 30, 95), 1);

        let formStatus = 'Neutral';
        if (sampleSize < 4 && confidence < 45) {
            formStatus = 'Data Limited';
        } else if (formScore >= 8) {
            formStatus = 'In Form';
        } else if (formScore <= -8) {
            formStatus = 'Out of Form';
        }

        const roleHint = inferRoleHint(batting.length, bowling.length);
        const consistencyInput = roleHint === 'Bowler'
            ? bowlingLast10.map((row) => row.wickets)
            : battingLast10.map((row) => row.runs);
        const consistencyStd = standardDeviation(consistencyInput);
        const consistencyMean = consistencyInput.length
            ? average(consistencyInput, (value) => value)
            : 0;
        const consistencyIndex = consistencyInput.length
            ? round(clamp(100 - ((consistencyStd / Math.max(consistencyMean, 1)) * 35), 0, 100), 1)
            : 0;

        const battingLatest = batting.length ? batting[batting.length - 1] : null;
        const bowlingLatest = bowling.length ? bowling[bowling.length - 1] : null;
        const bestScore = batting.length ? Math.max(...batting.map((row) => row.runs)) : 0;
        const bestWickets = bowling.length ? Math.max(...bowling.map((row) => row.wickets)) : 0;

        const bestSpell = bowling.length
            ? bowling.reduce((best, current) => {
                if (current.wickets > best.wickets) return current;
                if (current.wickets === best.wickets && current.runsConceded < best.runsConceded) return current;
                return best;
            }, bowling[0])
            : null;

        const last5BoundaryPct = battingLast5.length
            ? average(battingLast5, (row) => {
                if (row.runs <= 0) return 0;
                const boundaryRuns = (row.fours * 4) + (row.sixes * 6);
                return (boundaryRuns / row.runs) * 100;
            })
            : 0;

        const battingFiftyStreak = getStreak(batting, (row) => row.runs >= 50);
        const wicketStreak = getStreak(bowling, (row) => row.wickets >= 1);

        const battingRecent = batting.slice(-10).reverse();
        const bowlingRecent = bowling.slice(-10).reverse();

        const recentCombined = [...battingRecent.map((row) => ({
            matchId: row.matchId,
            matchName: row.matchName,
            dateTimeGMT: row.dateTimeGMT,
            opponent: row.opponent,
            runs: row.runs,
            balls: row.balls,
            strikeRate: row.strikeRate,
            wickets: null,
            economy: null
        })), ...bowlingRecent.map((row) => ({
            matchId: row.matchId,
            matchName: row.matchName,
            dateTimeGMT: row.dateTimeGMT,
            opponent: row.opponent,
            runs: null,
            balls: null,
            strikeRate: null,
            wickets: row.wickets,
            economy: row.economy
        }))]
            .sort((a, b) => Date.parse(b.dateTimeGMT) - Date.parse(a.dateTimeGMT))
            .slice(0, 10);

        return {
            player: bucket.player,
            team: bucket.team,
            roleHint,
            matches: bucket.matches.size,
            sampleSize,
            formStatus,
            formScore,
            confidence,
            momentum: formScore >= 8 ? 'Surging' : (formScore <= -8 ? 'Sliding' : 'Stable'),
            consistencyIndex,
            batting: {
                matches: batting.length,
                avgRuns5: round(avgRuns5, 2),
                avgRuns10: round(avgRuns10, 2),
                prevAvgRuns5: round(prevAvgRuns5, 2),
                runsTrendPct: round(runsTrendPct, 1),
                strikeRate5: round(strikeRate5, 2),
                strikeRate10: round(strikeRate10, 2),
                prevStrikeRate5: round(prevStrikeRate5, 2),
                strikeRateTrendPct: round(strikeRateTrendPct, 1),
                boundaryPct5: round(last5BoundaryPct, 1),
                lastScore: battingLatest?.runs || 0,
                bestScore,
                recent: battingRecent
            },
            bowling: {
                matches: bowling.length,
                avgWickets5: round(avgWickets5, 2),
                avgWickets10: round(avgWickets10, 2),
                prevAvgWickets5: round(prevAvgWickets5, 2),
                wicketsTrendPct: round(wicketsTrendPct, 1),
                economy5: round(economy5, 2),
                economy10: round(economy10, 2),
                prevEconomy5: round(prevEconomy5, 2),
                economyTrendPct: round(economyTrendPct, 1),
                lastSpell: bowlingLatest ? `${bowlingLatest.wickets}/${bowlingLatest.runsConceded}` : '0/0',
                bestSpell: bestSpell ? `${bestSpell.wickets}/${bestSpell.runsConceded}` : '0/0',
                bestWickets,
                recent: bowlingRecent
            },
            streaks: {
                fiftyPlus: battingFiftyStreak,
                wicketStreak
            },
            sparkline: {
                runs5: battingLast5.map((row) => row.runs),
                runs10: battingLast10.map((row) => row.runs),
                wickets5: bowlingLast5.map((row) => row.wickets),
                wickets10: bowlingLast10.map((row) => row.wickets),
                economy5: bowlingLast5.map((row) => row.economy),
                economy10: bowlingLast10.map((row) => row.economy),
                strikeRate5: battingLast5.map((row) => row.strikeRate),
                strikeRate10: battingLast10.map((row) => row.strikeRate)
            },
            recentMatches: recentCombined
        };
    });

    const sortedPlayers = [...players].sort((a, b) => {
        if (b.formScore !== a.formScore) return b.formScore - a.formScore;
        if (b.confidence !== a.confidence) return b.confidence - a.confidence;
        return b.matches - a.matches;
    });

    const inFormPlayers = sortedPlayers
        .filter((player) => player.formStatus === 'In Form')
        .slice(0, Math.min(limit, 20));

    const outOfFormPlayers = [...sortedPlayers]
        .filter((player) => player.formStatus === 'Out of Form')
        .sort((a, b) => a.formScore - b.formScore)
        .slice(0, Math.min(limit, 20));

    const consistencyLeaders = [...sortedPlayers]
        .filter((player) => player.matches >= 5)
        .sort((a, b) => b.consistencyIndex - a.consistencyIndex || b.matches - a.matches)
        .slice(0, Math.min(limit, 20));

    const biggestImprovers = [...sortedPlayers]
        .filter((player) => player.formScore > 0)
        .sort((a, b) => b.formScore - a.formScore)
        .slice(0, Math.min(limit, 20));

    const summary = {
        playersTracked: players.length,
        inFormCount: players.filter((player) => player.formStatus === 'In Form').length,
        outOfFormCount: players.filter((player) => player.formStatus === 'Out of Form').length,
        neutralCount: players.filter((player) => player.formStatus === 'Neutral').length,
        dataLimitedCount: players.filter((player) => player.formStatus === 'Data Limited').length
    };

    return {
        players: sortedPlayers.slice(0, limit),
        highlights: {
            inFormPlayers,
            outOfFormPlayers,
            consistencyLeaders,
            biggestImprovers
        },
        summary,
        coverage: {
            matchesWithScorecards,
            inningsProcessed,
            battingAppearances,
            bowlingSpells,
            playersTracked: players.length
        }
    };
};

module.exports = { aggregatePlayerForm };
