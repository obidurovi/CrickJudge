const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const round = (value, digits = 2) => {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
};

const normalizeText = (value) => String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

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

const safePlayerName = (row) => {
    const name = getName(row?.batsman || row?.player || row?.name || row?.bowler, '').trim();
    if (!name) return null;
    if (/^extras$/i.test(name) || /^total$/i.test(name)) return null;
    return name;
};

const resolveMatchVenue = (match, payload) => {
    const candidates = [
        match?.venue,
        match?.venueName,
        match?.venueInfo?.name,
        match?.venue_info?.name,
        payload?.venue,
        payload?.venueName,
        payload?.venueInfo?.name,
        payload?.venue_info?.name,
        payload?.stadium
    ];

    for (const candidate of candidates) {
        const name = getName(candidate, '').trim();
        if (name) return name;
    }

    return '';
};

const getLocationTokens = (location) => normalizeText(location)
    .split(' ')
    .filter((token) => token.length >= 4 && !['city', 'stadium', 'ground', 'india'].includes(token));

const isVenueMatch = (matchVenue, venue) => {
    const venueNorm = normalizeText(venue?.name);
    const matchNorm = normalizeText(matchVenue);

    if (!matchNorm || !venueNorm) return false;
    if (matchNorm.includes(venueNorm) || venueNorm.includes(matchNorm)) return true;

    const locationTokens = getLocationTokens(venue?.location);
    if (!locationTokens.length) return false;

    return locationTokens.some((token) => matchNorm.includes(token));
};

const splitNameTokens = (name) => normalizeText(name)
    .split(' ')
    .filter(Boolean);

const looksLikeSamePlayer = (targetName, candidateName) => {
    const targetNorm = normalizeText(targetName);
    const candidateNorm = normalizeText(candidateName);

    if (!targetNorm || !candidateNorm) return false;
    if (targetNorm === candidateNorm) return true;

    if (targetNorm.length >= 7 && (targetNorm.includes(candidateNorm) || candidateNorm.includes(targetNorm))) {
        return true;
    }

    const targetTokens = splitNameTokens(targetNorm);
    const candidateTokens = splitNameTokens(candidateNorm);
    if (!targetTokens.length || !candidateTokens.length) return false;

    const targetLast = targetTokens[targetTokens.length - 1];
    const candidateLast = candidateTokens[candidateTokens.length - 1];

    if (targetLast && targetLast === candidateLast) {
        const targetFirstInitial = targetTokens[0][0];
        const candidateFirstInitial = candidateTokens[0][0];
        return targetFirstInitial === candidateFirstInitial;
    }

    return false;
};

const createDirectRecord = () => ({
    matches: 0,
    battingInnings: 0,
    bowlingSpells: 0,
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    wickets: 0,
    runsConceded: 0,
    oversBalls: 0,
    avgRuns: 0,
    avgWickets: 0,
    strikeRate: 0,
    economy: 0,
    bestBatting: 0,
    bestBowling: '0/0',
    samples: []
});

const extractPlayerVenueEvidence = ({ playerName, venue, matches, scorecardsByMatchId }) => {
    if (!playerName || !venue || !Array.isArray(matches) || !(scorecardsByMatchId instanceof Map)) {
        return createDirectRecord();
    }

    const result = createDirectRecord();
    const matchIds = new Set();
    const samplesByMatch = new Map();

    for (const match of matches) {
        const matchId = String(match?.id || match?._id || '');
        if (!matchId) continue;

        const payload = scorecardsByMatchId.get(matchId);
        const normalized = payload?.data || payload || null;
        const inningsList = Array.isArray(normalized?.scorecard) ? normalized.scorecard : [];
        if (!inningsList.length) continue;

        const venueText = resolveMatchVenue(match, normalized);
        if (!isVenueMatch(venueText, venue)) continue;

        let touchedInMatch = false;
        const sample = samplesByMatch.get(matchId) || {
            matchId,
            matchName: normalized?.name || match?.name || 'Match',
            venue: venueText || venue.name,
            dateTimeGMT: normalized?.dateTimeGMT || match?.dateTimeGMT || match?.date || null,
            runs: 0,
            balls: 0,
            wickets: 0,
            runsConceded: 0,
            oversBalls: 0
        };

        inningsList.forEach((inning) => {
            const battingRows = Array.isArray(inning?.batting) ? inning.batting : [];
            let battingMatchedInInning = false;

            battingRows.forEach((row) => {
                const rowPlayer = safePlayerName(row);
                if (!rowPlayer || !looksLikeSamePlayer(playerName, rowPlayer)) return;

                touchedInMatch = true;
                if (!battingMatchedInInning) {
                    result.battingInnings += 1;
                    battingMatchedInInning = true;
                }

                const runs = toNumber(row?.runs ?? row?.r, 0);
                const balls = toNumber(row?.balls ?? row?.b, 0);
                const fours = toNumber(row?.fours ?? row?.['4s'] ?? row?.['4'], 0);
                const sixes = toNumber(row?.sixes ?? row?.['6s'] ?? row?.['6'], 0);

                result.runs += runs;
                result.balls += balls;
                result.fours += fours;
                result.sixes += sixes;
                result.bestBatting = Math.max(result.bestBatting, runs);

                sample.runs += runs;
                sample.balls += balls;
            });

            const bowlingRows = Array.isArray(inning?.bowling) ? inning.bowling : [];
            let bowlingMatchedInInning = false;

            bowlingRows.forEach((row) => {
                const rowPlayer = safePlayerName(row);
                if (!rowPlayer || !looksLikeSamePlayer(playerName, rowPlayer)) return;

                touchedInMatch = true;
                if (!bowlingMatchedInInning) {
                    result.bowlingSpells += 1;
                    bowlingMatchedInInning = true;
                }

                const wickets = toNumber(row?.wickets ?? row?.w, 0);
                const runsConceded = toNumber(row?.runs ?? row?.r, 0);
                const oversBalls = parseOversToBalls(row?.overs ?? row?.o);

                result.wickets += wickets;
                result.runsConceded += runsConceded;
                result.oversBalls += oversBalls;

                if (wickets > 0) {
                    const candidateBest = `${wickets}/${runsConceded}`;
                    const [bestWickets, bestRuns] = String(result.bestBowling || '0/0').split('/').map((v) => toNumber(v, 0));
                    if (wickets > bestWickets || (wickets === bestWickets && runsConceded < bestRuns)) {
                        result.bestBowling = candidateBest;
                    }
                }

                sample.wickets += wickets;
                sample.runsConceded += runsConceded;
                sample.oversBalls += oversBalls;
            });
        });

        if (touchedInMatch) {
            matchIds.add(matchId);
            samplesByMatch.set(matchId, sample);
        }
    }

    result.matches = matchIds.size;
    result.avgRuns = result.matches > 0 ? round(result.runs / result.matches, 2) : 0;
    result.avgWickets = result.matches > 0 ? round(result.wickets / result.matches, 2) : 0;
    result.strikeRate = result.balls > 0 ? round((result.runs * 100) / result.balls, 2) : 0;
    result.economy = result.oversBalls > 0
        ? round(result.runsConceded / (result.oversBalls / 6), 2)
        : 0;

    result.samples = [...samplesByMatch.values()]
        .sort((a, b) => {
            const aDate = Date.parse(a?.dateTimeGMT || '') || 0;
            const bDate = Date.parse(b?.dateTimeGMT || '') || 0;
            return bDate - aDate;
        })
        .slice(0, 8)
        .map((sample) => ({
            ...sample,
            strikeRate: sample.balls > 0 ? round((sample.runs * 100) / sample.balls, 2) : 0,
            economy: sample.oversBalls > 0 ? round(sample.runsConceded / (sample.oversBalls / 6), 2) : 0,
            oversText: ballsToOversText(sample.oversBalls)
        }));

    return result;
};

const FORMAT_CONFIG = {
    overall: {
        key: 'overall',
        label: 'Overall',
        statKey: null,
        parScore: 170,
        srBaseline: 120,
        economyBaseline: 7.8,
        wicketsScale: 1.2
    },
    test: {
        key: 'test',
        label: 'Test',
        statKey: 'test',
        parScore: 320,
        srBaseline: 52,
        economyBaseline: 3.2,
        wicketsScale: 2.5
    },
    odi: {
        key: 'odi',
        label: 'ODI',
        statKey: 'odi',
        parScore: 275,
        srBaseline: 85,
        economyBaseline: 5.4,
        wicketsScale: 1.8
    },
    t20: {
        key: 't20',
        label: 'T20',
        statKey: 't20i',
        parScore: 170,
        srBaseline: 125,
        economyBaseline: 8,
        wicketsScale: 1.3
    }
};

const normalizeFormatKey = (value) => {
    const text = normalizeText(value);
    if (['test', 'tests', 'red ball'].includes(text)) return 'test';
    if (['odi', 'one day', 'one day international'].includes(text)) return 'odi';
    if (['t20', 't20i', 'twenty20', 'twenty 20'].includes(text)) return 't20';
    return 'overall';
};

const inferRoleHint = (player, statBlock) => {
    const role = normalizeText(player?.role);
    if (role.includes('wicket')) return 'Wicketkeeper';
    if (role.includes('all')) return 'All-Rounder';
    if (role.includes('bowl')) return 'Bowler';
    if (role.includes('bat')) return 'Batter';

    const matches = Math.max(1, toNumber(statBlock?.matches, 0));
    const runsPerMatch = toNumber(statBlock?.runs, 0) / matches;
    const wicketsPerMatch = toNumber(statBlock?.wickets, 0) / matches;

    if (runsPerMatch >= 20 && wicketsPerMatch <= 0.4) return 'Batter';
    if (wicketsPerMatch >= 1.0 && runsPerMatch <= 18) return 'Bowler';
    return 'All-Rounder';
};

const inferBowlingType = (player) => {
    const bowlingStyle = normalizeText(player?.bowlingStyle);
    if (!bowlingStyle) return 'none';

    const isSpin = /(spin|orthodox|legbreak|offbreak|chinaman|slow)/.test(bowlingStyle);
    const isPace = /(fast|medium|pace|seam)/.test(bowlingStyle);

    if (isSpin && isPace) return 'mixed';
    if (isSpin) return 'spin';
    if (isPace) return 'pace';
    return 'none';
};

const readFormatStats = (player, formatKey) => {
    if (formatKey === 'overall') {
        const stats = player?.stats || {};
        return {
            matches: toNumber(stats.matches, 0),
            runs: toNumber(stats.runs, 0),
            wickets: toNumber(stats.wickets, 0),
            average: toNumber(stats.average, 0),
            strikeRate: toNumber(stats.strikeRate, 0),
            economy: toNumber(stats.economy, 0),
            bowlingAvg: 0,
            fifties: 0,
            hundreds: 0
        };
    }

    const config = FORMAT_CONFIG[formatKey] || FORMAT_CONFIG.overall;
    const detailed = player?.detailedStats?.[config.statKey] || {};

    return {
        matches: toNumber(detailed.matches, 0),
        runs: toNumber(detailed.runs, 0),
        wickets: toNumber(detailed.wickets, 0),
        average: toNumber(detailed.average, 0),
        strikeRate: toNumber(detailed.strikeRate, 0),
        economy: toNumber(detailed.economy, 0),
        bowlingAvg: toNumber(detailed.bowlingAvg, 0),
        fifties: toNumber(detailed.fifties, 0),
        hundreds: toNumber(detailed.hundreds, 0)
    };
};

const getFitBand = (score) => {
    if (score >= 78) return 'Elite Fit';
    if (score >= 62) return 'Strong Fit';
    if (score >= 48) return 'Balanced Fit';
    return 'Risky Fit';
};

const getRoleWeights = (roleHint) => {
    if (roleHint === 'Bowler') return { batting: 0.3, bowling: 0.7 };
    if (roleHint === 'Batter' || roleHint === 'Wicketkeeper') return { batting: 0.72, bowling: 0.28 };
    return { batting: 0.5, bowling: 0.5 };
};

const getRecommendedRole = ({ roleHint, battingSuitability, bowlingSuitability, fitBand }) => {
    if (fitBand === 'Risky Fit') {
        return 'Situational pick; consider matchup-specific deployment.';
    }

    if (roleHint === 'Bowler') {
        if (bowlingSuitability >= 74) return 'Primary strike bowler across middle and death overs.';
        return 'Support bowler with controlled spells in favorable phases.';
    }

    if (roleHint === 'Batter' || roleHint === 'Wicketkeeper') {
        if (battingSuitability >= 74) return 'Top-order run engine and high-upside fantasy captain.';
        return 'Stable top/middle-order batting option.';
    }

    if (battingSuitability >= bowlingSuitability) {
        return 'All-round anchor with batting-led upside and utility overs.';
    }

    return 'All-round balance pick with bowling-led matchup edge.';
};

const buildVenuePlayerCrossAnalysis = ({ player, venue, formatKey = 'overall', directRecord = createDirectRecord() }) => {
    const normalizedFormat = normalizeFormatKey(formatKey);
    const config = FORMAT_CONFIG[normalizedFormat] || FORMAT_CONFIG.overall;
    const formatStats = readFormatStats(player, normalizedFormat);

    const matches = Math.max(0, toNumber(formatStats.matches, 0));
    const runs = Math.max(0, toNumber(formatStats.runs, 0));
    const wickets = Math.max(0, toNumber(formatStats.wickets, 0));
    const average = Math.max(0, toNumber(formatStats.average, 0));
    const strikeRate = Math.max(0, toNumber(formatStats.strikeRate, 0));
    const economy = Math.max(0, toNumber(formatStats.economy, 0));
    const bowlingAvg = Math.max(0, toNumber(formatStats.bowlingAvg, 0));
    const fifties = Math.max(0, toNumber(formatStats.fifties, 0));
    const hundreds = Math.max(0, toNumber(formatStats.hundreds, 0));

    const roleHint = inferRoleHint(player, formatStats);
    const roleWeights = getRoleWeights(roleHint);
    const bowlingType = inferBowlingType(player);

    const pacePct = clamp(toNumber(venue?.paceSpin?.pace, 50), 0, 100);
    const spinPct = clamp(toNumber(venue?.paceSpin?.spin, 50), 0, 100);
    const avgFirst = Math.max(0, toNumber(venue?.avgScores?.first, config.parScore));
    const avgSecond = Math.max(0, toNumber(venue?.avgScores?.second, config.parScore * 0.95));

    const battingAdvantageText = normalizeText(venue?.battingAdvantage);
    const battingAdvantageBonus = battingAdvantageText.includes('high')
        ? 10
        : (battingAdvantageText.includes('moderate') ? 5 : -2);

    const scoringGap = ((avgFirst + avgSecond) / 2) - config.parScore;
    const scoringEnvironment = clamp(50 + (scoringGap * 0.45) + battingAdvantageBonus, 10, 95);
    const venueBowlingRelief = clamp(100 - scoringEnvironment + 8, 5, 90);

    const matchesForRate = Math.max(matches, 1);
    const runsPerMatch = runs / matchesForRate;
    const wicketsPerMatch = wickets / matchesForRate;

    const battingAverage = average > 0 ? average : runsPerMatch;
    const baseStrikeRate = strikeRate > 0 ? strikeRate : config.srBaseline;
    const baseEconomy = economy > 0 ? economy : config.economyBaseline;

    const avgWeight = normalizedFormat === 't20' ? 0.75 : 1.1;
    const srWeight = normalizedFormat === 'test' ? 0.1 : 0.34;

    const battingSkill = clamp(
        32
        + (battingAverage * avgWeight)
        + ((baseStrikeRate - config.srBaseline) * srWeight)
        + (runsPerMatch * 0.55)
        + (fifties * 0.3)
        + (hundreds * 0.8),
        0,
        100
    );

    const economyComponent = Math.max(0, (config.economyBaseline - baseEconomy) * 8);
    const bowlingAvgComponent = bowlingAvg > 0 ? Math.max(0, (35 - bowlingAvg) * 1.2) : 0;
    const bowlingSkill = clamp(
        30
        + (wicketsPerMatch * 30)
        + economyComponent
        + bowlingAvgComponent,
        0,
        100
    );

    const styleAlignment = bowlingType === 'pace'
        ? pacePct
        : (bowlingType === 'spin' ? spinPct : 50);

    const directRunImpact = directRecord.matches > 0
        ? ((toNumber(directRecord.avgRuns, battingAverage) - battingAverage) * 0.6)
        : 0;
    const directEconomyImpact = directRecord.matches > 0 && toNumber(directRecord.economy, 0) > 0
        ? ((baseEconomy - directRecord.economy) * 4.5)
        : 0;
    const directWicketImpact = directRecord.matches > 0
        ? ((toNumber(directRecord.avgWickets, wicketsPerMatch) - wicketsPerMatch) * 14)
        : 0;

    const battingSuitability = clamp(
        (battingSkill * 0.64) + (scoringEnvironment * 0.26) + directRunImpact,
        0,
        100
    );

    const bowlingSuitability = clamp(
        (bowlingSkill * 0.6)
        + (venueBowlingRelief * 0.2)
        + (styleAlignment * 0.2)
        + directEconomyImpact
        + directWicketImpact,
        0,
        100
    );

    const paceAlignment = clamp(
        bowlingType === 'pace'
            ? pacePct
            : (bowlingType === 'spin' ? (100 - pacePct) : 50),
        0,
        100
    );
    const spinAlignment = clamp(
        bowlingType === 'spin'
            ? spinPct
            : (bowlingType === 'pace' ? (100 - spinPct) : 50),
        0,
        100
    );

    const chaseIndex = clamp(
        50
        + (((avgSecond - avgFirst) / Math.max(config.parScore, 1)) * 140)
        + ((battingSuitability - 50) * 0.2),
        8,
        95
    );

    const powerplayImpact = clamp(
        (battingSuitability * 0.42)
        + (bowlingSuitability * 0.25)
        + (pacePct * 0.33),
        0,
        100
    );

    const deathOversImpact = clamp(
        (battingSuitability * 0.3)
        + (bowlingSuitability * 0.45)
        + (spinPct * 0.25),
        0,
        100
    );

    const overallFitScore = round(clamp(
        (battingSuitability * roleWeights.batting)
        + (bowlingSuitability * roleWeights.bowling)
        + (directRecord.matches > 0 ? 3 : 0),
        0,
        100
    ), 1);

    const evidenceSample = Math.max(
        matches,
        toNumber(player?.stats?.matches, 0),
        directRecord.matches * 3
    );

    const confidence = round(clamp(
        30
        + (Math.log2(evidenceSample + 1) * 11)
        + (directRecord.matches > 0 ? 10 : 0)
        + (normalizedFormat !== 'overall' && matches > 0 ? 6 : 0),
        28,
        95
    ), 1);

    const fitBand = getFitBand(overallFitScore);

    const baselineRuns = battingAverage > 0 ? battingAverage : Math.max(8, runsPerMatch);
    const baselineWickets = wicketsPerMatch > 0 ? wicketsPerMatch : config.wicketsScale * 0.65;

    let projectedRuns = round(clamp(
        baselineRuns * (0.75 + (battingSuitability / 180)),
        2,
        normalizedFormat === 'test' ? 220 : 120
    ), 1);

    let projectedWickets = round(clamp(
        baselineWickets * (0.7 + (bowlingSuitability / 180)),
        0,
        normalizedFormat === 'test' ? 10 : 6
    ), 2);

    let projectedEconomy = round(clamp(
        baseEconomy
        * (1 - ((bowlingSuitability - 50) / 260))
        * (1 + ((scoringEnvironment - 50) / 280)),
        1.2,
        14
    ), 2);

    if (directRecord.matches >= 2) {
        projectedRuns = round((projectedRuns * 0.7) + (directRecord.avgRuns * 0.3), 1);
        projectedWickets = round((projectedWickets * 0.7) + (directRecord.avgWickets * 0.3), 2);
        if (directRecord.economy > 0) {
            projectedEconomy = round((projectedEconomy * 0.7) + (directRecord.economy * 0.3), 2);
        }
    }

    const projectedStrikeRate = round(clamp(
        baseStrikeRate * (0.88 + (battingSuitability / 240)),
        config.srBaseline * 0.6,
        normalizedFormat === 'test' ? 120 : 240
    ), 1);

    const expectedFantasyPoints = round(clamp(
        projectedRuns
        + (projectedWickets * 25)
        + (Math.max(0, projectedStrikeRate - config.srBaseline) / 8)
        + (Math.max(0, config.economyBaseline - projectedEconomy) * 5)
        + 4,
        5,
        220
    ), 1);

    const factors = [
        {
            label: 'Format Pedigree',
            impact: round((matches >= 20 ? 8 : (matches >= 8 ? 4 : -4)) + ((confidence - 60) * 0.08), 1),
            value: `${matches} matches`,
            explanation: 'Tracks how much format-specific sample supports this projection.'
        },
        {
            label: 'Venue Scoring Profile',
            impact: round(((scoringEnvironment - 50) * (roleWeights.batting - roleWeights.bowling)) / 5, 1),
            value: `1st inns ${avgFirst} / 2nd inns ${avgSecond}`,
            explanation: 'Higher-scoring surfaces aid batters while suppressing bowling impact.'
        },
        {
            label: 'Pace vs Spin Alignment',
            impact: round(((Math.max(paceAlignment, spinAlignment) - 50) / 4), 1),
            value: `${pacePct}% pace · ${spinPct}% spin`,
            explanation: 'Compares venue dismissal mix with player bowling profile.'
        },
        {
            label: 'Direct Venue Evidence',
            impact: round(directRecord.matches > 0
                ? ((directRecord.avgRuns > baselineRuns ? 4 : 0) + (directRecord.economy > 0 && directRecord.economy < baseEconomy ? 4 : 0))
                : -3, 1),
            value: `${directRecord.matches} venue matches`,
            explanation: directRecord.matches > 0
                ? 'Past match evidence at this venue is included in projection blending.'
                : 'No direct venue sample found in recent scorecard coverage.'
        },
        {
            label: 'Data Volatility',
            impact: round((confidence - 50) / 6, 1),
            value: `${confidence}% confidence`,
            explanation: 'Lower confidence implies wider range in likely outcomes.'
        }
    ];

    const riskFlags = [];
    if (confidence < 45) {
        riskFlags.push('Low confidence due to small or noisy sample size.');
    }
    if (matches < 6 && normalizedFormat !== 'overall') {
        riskFlags.push(`Limited ${config.label} history can skew projections.`);
    }
    if (directRecord.matches === 0) {
        riskFlags.push('No direct venue scorecard sample in current coverage window.');
    }
    if (overallFitScore < 48) {
        riskFlags.push('Venue conditions currently project as below-neutral for this player.');
    }

    const insights = [
        `${player.name} rates as a ${fitBand.toLowerCase()} at ${venue.name}.`,
        battingSuitability >= bowlingSuitability
            ? 'Batting profile carries the stronger upside at this venue.'
            : 'Bowling profile carries the stronger upside at this venue.',
        chaseIndex >= 55
            ? 'Second-innings conditions appear favorable for run chases.'
            : 'Defending totals may carry a tactical edge at this venue.',
        powerplayImpact >= deathOversImpact
            ? 'Powerplay phases offer higher projected impact than death overs.'
            : 'Death overs project as the higher impact window.'
    ];

    const recommendedRole = getRecommendedRole({
        roleHint,
        battingSuitability,
        bowlingSuitability,
        fitBand
    });

    const narrative = `${player.name} shows a ${fitBand.toLowerCase()} profile at ${venue.name} for ${config.label}. `
        + `Projected output is ${projectedRuns} runs, ${projectedWickets} wickets, and economy near ${projectedEconomy}.`;

    return {
        format: {
            key: config.key,
            label: config.label
        },
        roleHint,
        bowlingType,
        overallFitScore,
        fitBand,
        confidence,
        recommendedRole,
        narrative,
        expected: {
            battingRuns: projectedRuns,
            strikeRate: projectedStrikeRate,
            wickets: projectedWickets,
            economy: projectedEconomy,
            fantasyPoints: expectedFantasyPoints
        },
        indices: {
            battingSuitability: round(battingSuitability, 1),
            bowlingSuitability: round(bowlingSuitability, 1),
            paceAlignment: round(paceAlignment, 1),
            spinAlignment: round(spinAlignment, 1),
            scoringEnvironment: round(scoringEnvironment, 1),
            chaseIndex: round(chaseIndex, 1),
            powerplayImpact: round(powerplayImpact, 1),
            deathOversImpact: round(deathOversImpact, 1)
        },
        factors,
        insights,
        riskFlags,
        directVenueRecord: {
            ...directRecord,
            oversText: ballsToOversText(directRecord.oversBalls)
        },
        model: {
            version: 'venue-player-cross-v1',
            generatedAt: new Date().toISOString()
        }
    };
};

module.exports = {
    normalizeFormatKey,
    extractPlayerVenueEvidence,
    buildVenuePlayerCrossAnalysis
};
