const Player = require('../models/Player');
const Venue = require('../models/Venue');

const OVER_LIMITS = {
    t10: 10,
    t20: 20,
    odi: 50
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const sigmoid = (x) => 1 / (1 + Math.exp(-x));

const parseOversToBalls = (oversValue) => {
    const raw = String(oversValue ?? '0');
    if (!raw.includes('.')) {
        const whole = Number(raw) || 0;
        return whole * 6;
    }
    const [wholePart, ballPart] = raw.split('.');
    const overs = Number(wholePart) || 0;
    const balls = clamp(Number(ballPart) || 0, 0, 5);
    return overs * 6 + balls;
};

const normalizeTeamKey = (name) => {
    const raw = String(name || '').toLowerCase().trim();
    if (!raw) return '';
    return raw
        .replace(/women|womens|a team|xi|under-?\d+/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

const getShortTeamName = (team, fallback) => {
    if (!team) return fallback || 'Team';
    if (typeof team === 'string') return team;
    return team.shortname || team.name || fallback || 'Team';
};

const extractTeamInnings = (match, teamName) => {
    const teamKey = normalizeTeamKey(teamName);
    const scoreList = Array.isArray(match?.score) ? match.score : [];
    return scoreList
        .filter((entry) => normalizeTeamKey(entry?.inning || '').includes(teamKey))
        .map((entry) => ({
            runs: Number(entry?.r) || 0,
            wickets: Number(entry?.w) || 0,
            balls: parseOversToBalls(entry?.o),
            oversText: String(entry?.o ?? '0')
        }));
};

const getTeamStrength = async (teamName) => {
    const key = normalizeTeamKey(teamName);
    if (!key) return { batting: 0.5, bowling: 0.5, overall: 0.5, sample: 0 };

    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const players = await Player.find({
        country: { $regex: escaped, $options: 'i' }
    })
        .sort({ 'stats.matches': -1, updatedAt: -1 })
        .limit(80)
        .lean();

    if (!players.length) {
        return { batting: 0.5, bowling: 0.5, overall: 0.5, sample: 0 };
    }

    const avg = players.reduce((acc, player) => {
        acc.runs += Number(player?.stats?.runs) || 0;
        acc.wickets += Number(player?.stats?.wickets) || 0;
        acc.strikeRate += Number(player?.stats?.strikeRate) || 0;
        acc.economy += Number(player?.stats?.economy) || 8;
        return acc;
    }, { runs: 0, wickets: 0, strikeRate: 0, economy: 0 });

    const count = players.length;
    const avgRuns = avg.runs / count;
    const avgWickets = avg.wickets / count;
    const avgStrikeRate = avg.strikeRate / count;
    const avgEconomy = avg.economy / count;

    const batting = clamp((avgRuns / 3000) * 0.5 + (avgStrikeRate / 140) * 0.5, 0.2, 0.95);
    const bowling = clamp((avgWickets / 80) * 0.6 + ((10 - avgEconomy) / 6) * 0.4, 0.2, 0.95);
    const overall = clamp((batting * 0.58) + (bowling * 0.42), 0.2, 0.95);

    return { batting, bowling, overall, sample: count };
};

const getVenueBias = async (venueName) => {
    if (!venueName) {
        return { chasingBias: 0, parFirstInnings: 160, pace: 50, spin: 50, found: false };
    }

    const base = String(venueName).split(',')[0].trim();
    const escaped = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const venue = await Venue.findOne({ name: { $regex: escaped, $options: 'i' } }).lean();

    if (!venue) {
        return { chasingBias: 0, parFirstInnings: 160, pace: 50, spin: 50, found: false };
    }

    const firstAvg = Number(venue?.avgScores?.first) || 160;
    const secondAvg = Number(venue?.avgScores?.second) || firstAvg;
    const chasingBias = clamp((secondAvg - firstAvg) / 80, -0.12, 0.12);

    return {
        chasingBias,
        parFirstInnings: firstAvg,
        pace: Number(venue?.paceSpin?.pace) || 50,
        spin: Number(venue?.paceSpin?.spin) || 50,
        found: true,
        venueName: venue.name
    };
};

const inferMatchState = (match) => {
    const teamA = match?.teamInfo?.[0]?.name || match?.teams?.[0] || 'Team A';
    const teamB = match?.teamInfo?.[1]?.name || match?.teams?.[1] || 'Team B';

    const inningsA = extractTeamInnings(match, teamA);
    const inningsB = extractTeamInnings(match, teamB);

    const firstInnings = inningsA.length ? { team: teamA, ...inningsA[0] } : (inningsB.length ? { team: teamB, ...inningsB[0] } : null);

    let secondInnings = null;
    if (inningsA.length > 1) secondInnings = { team: teamA, ...inningsA[inningsA.length - 1] };
    if (inningsB.length > 1) secondInnings = { team: teamB, ...inningsB[inningsB.length - 1] };

    if (!secondInnings && inningsA.length && inningsB.length) {
        const aBalls = inningsA[inningsA.length - 1].balls;
        const bBalls = inningsB[inningsB.length - 1].balls;
        secondInnings = aBalls >= bBalls
            ? { team: teamA, ...inningsA[inningsA.length - 1] }
            : { team: teamB, ...inningsB[inningsB.length - 1] };
    }

    return {
        teamA,
        teamB,
        firstInnings,
        secondInnings
    };
};

const limitedOversForType = (matchType) => {
    const key = String(matchType || '').toLowerCase();
    return OVER_LIMITS[key] || 20;
};

const buildFinishedProbability = (match, teamA, teamB) => {
    const status = String(match?.status || '').toLowerCase();
    const a = normalizeTeamKey(teamA);
    const b = normalizeTeamKey(teamB);

    if (status.includes(a)) return { teamAWinPct: 100, teamBWinPct: 0, reason: 'Result declared' };
    if (status.includes(b)) return { teamAWinPct: 0, teamBWinPct: 100, reason: 'Result declared' };
    return { teamAWinPct: 50, teamBWinPct: 50, reason: 'Match completed' };
};

const calculateLiveModel = ({ match, state, venueBias, strengthA, strengthB }) => {
    const totalOvers = limitedOversForType(match?.matchType);
    const totalBalls = totalOvers * 6;

    let teamAProb = 0.5;
    let context = 'Pre-innings';

    if (!state.firstInnings) {
        const strengthEdge = clamp((strengthA.overall - strengthB.overall) * 0.4, -0.18, 0.18);
        teamAProb = clamp(0.5 + strengthEdge, 0.08, 0.92);
        context = 'Pre-match strength model';
    } else if (!state.secondInnings) {
        const current = state.firstInnings;
        const ballsUsed = clamp(current.balls, 1, totalBalls);
        const runRate = (current.runs * 6) / ballsUsed;
        const projected = runRate * totalOvers;
        const par = venueBias.parFirstInnings || 160;
        const battingPressure = (projected - par) / Math.max(par, 1);

        const battingEdge = current.team === state.teamA ? battingPressure : -battingPressure;
        const strengthEdge = (strengthA.overall - strengthB.overall) * 0.35;

        teamAProb = clamp(0.5 + battingEdge * 0.28 + strengthEdge + venueBias.chasingBias * 0.05, 0.08, 0.92);
        context = 'First innings projection';
    } else {
        const target = (state.firstInnings?.runs || 0) + 1;
        const chase = state.secondInnings;
        const runsNeeded = Math.max(0, target - chase.runs);
        const ballsLeft = Math.max(1, totalBalls - chase.balls);
        const wicketsLeft = Math.max(0, 10 - (chase.wickets || 0));
        const reqRate = (runsNeeded * 6) / ballsLeft;
        const currRate = (chase.runs * 6) / Math.max(1, chase.balls);

        const pressure = reqRate - currRate;
        const wicketsFactor = (wicketsLeft - 5) / 5;
        const ballsFactor = ballsLeft / totalBalls;

        const chasingStrength = chase.team === state.teamA ? strengthA.overall : strengthB.overall;
        const defendingStrength = chase.team === state.teamA ? strengthB.overall : strengthA.overall;
        const strengthEdge = (chasingStrength - defendingStrength) * 0.35;

        const chaseWin = clamp(sigmoid((-pressure * 0.9) + (wicketsFactor * 0.9) + (ballsFactor * 0.6) + strengthEdge + venueBias.chasingBias * 1.5), 0.02, 0.98);
        teamAProb = chase.team === state.teamA ? chaseWin : (1 - chaseWin);
        context = 'Second innings chase model';
    }

    const teamBProb = 1 - teamAProb;
    const margin = Math.abs(teamAProb - teamBProb);
    const confidence = clamp(0.45 + margin * 0.7, 0.45, 0.98);

    return {
        teamAWinPct: Math.round(teamAProb * 1000) / 10,
        teamBWinPct: Math.round(teamBProb * 1000) / 10,
        confidence: Math.round(confidence * 1000) / 10,
        context
    };
};

const calculateWinProbability = async (match) => {
    if (!match) return null;

    const state = inferMatchState(match);
    const [venueBias, strengthA, strengthB] = await Promise.all([
        getVenueBias(match?.venue),
        getTeamStrength(state.teamA),
        getTeamStrength(state.teamB)
    ]);

    const core = match?.matchEnded
        ? buildFinishedProbability(match, state.teamA, state.teamB)
        : calculateLiveModel({
            match,
            state,
            venueBias,
            strengthA,
            strengthB
        });

    return {
        teamA: getShortTeamName(match?.teamInfo?.[0] || state.teamA, state.teamA),
        teamB: getShortTeamName(match?.teamInfo?.[1] || state.teamB, state.teamB),
        teamAWinPct: core.teamAWinPct,
        teamBWinPct: core.teamBWinPct,
        confidence: core.confidence || 90,
        context: core.context || core.reason || 'Model estimate',
        factors: {
            venue: {
                found: venueBias.found,
                name: venueBias.venueName || match?.venue || 'Unknown venue',
                parFirstInnings: venueBias.parFirstInnings,
                chasingBias: venueBias.chasingBias
            },
            teamStrength: {
                [state.teamA]: strengthA,
                [state.teamB]: strengthB
            }
        },
        generatedAt: new Date().toISOString()
    };
};

module.exports = { calculateWinProbability };
