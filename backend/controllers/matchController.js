const cricketApi = require('../utils/cricketApi');
const cache = require('../config/cache');
const { calculateWinProbability } = require('../utils/winProbability');

const getLiveMatches = async (req, res) => {
    try {
        // Check Valkey cache (30s TTL, same as API cache)
        const cacheKey = 'cric:matches:live';
        const staleKey = 'cric:matches:live:stale';
        const cached = await cache.getJSON(cacheKey);
        if (cached) return res.json(cached);

        const data = await cricketApi.getCurrentMatches();
        const matches = Array.isArray(data?.data) ? data.data : [];

        const enrichedMatches = await Promise.all(matches.map(async (match) => {
            if (!match?.matchStarted || match?.matchEnded) {
                return { ...match, winProbability: null };
            }

            try {
                const prediction = await calculateWinProbability(match);
                return { ...match, winProbability: prediction };
            } catch {
                return { ...match, winProbability: null };
            }
        }));

        const response = {
            ...data,
            data: enrichedMatches
        };

        await cache.setJSON(cacheKey, response, 30);
        await cache.setJSON(staleKey, response, 6 * 60 * 60);
        res.json(response);
    } catch (error) {
        if (error.message === 'API_TEMP_BLOCKED') {
            const stale = await cache.getJSON('cric:matches:live:stale');
            if (stale) {
                return res.json({ ...stale, _notice: 'Showing cached live matches while CricAPI cooldown is active.' });
            }
            return res.json({ status: 'success', data: [], _notice: 'CricAPI cooldown active. No cached live matches available yet.' });
        }
        res.status(500).json({ status: 'error', message: error.message });
    }
};

const getMatchDetails = async (req, res) => {
    try {
        const cacheKey = `cric:matches:detail:${req.params.id}`;
        const staleKey = `cric:matches:detail:${req.params.id}:stale`;
        const cached = await cache.getJSON(cacheKey);
        if (cached) return res.json(cached);

        const data = await cricketApi.getMatchInfo(req.params.id);
        await cache.setJSON(cacheKey, data, 30);
        await cache.setJSON(staleKey, data, 6 * 60 * 60);
        res.json(data);
    } catch (error) {
        if (error.message === 'API_TEMP_BLOCKED') {
            const stale = await cache.getJSON(`cric:matches:detail:${req.params.id}:stale`);
            if (stale) return res.json({ ...stale, _notice: 'Showing cached match details during CricAPI cooldown.' });
        }
        res.status(500).json({ status: 'error', message: error.message });
    }
};

const getScorecard = async (req, res) => {
    try {
        const cacheKey = `cric:matches:scorecard:${req.params.id}`;
        const staleKey = `cric:matches:scorecard:${req.params.id}:stale`;
        const cached = await cache.getJSON(cacheKey);
        if (cached) return res.json(cached);

        const data = await cricketApi.getMatchScorecard(req.params.id);
        await cache.setJSON(cacheKey, data, 30);
        await cache.setJSON(staleKey, data, 6 * 60 * 60);
        res.json(data);
    } catch (error) {
        if (error.message === 'API_TEMP_BLOCKED') {
            const stale = await cache.getJSON(`cric:matches:scorecard:${req.params.id}:stale`);
            if (stale) return res.json({ ...stale, _notice: 'Showing cached scorecard during CricAPI cooldown.' });
        }
        res.status(500).json({ status: 'error', message: error.message });
    }
};

const getMatchWinProbability = async (req, res) => {
    try {
        const cacheKey = `cric:matches:winprob:${req.params.id}`;
        const cached = await cache.getJSON(cacheKey);
        if (cached) return res.json(cached);

        const [matchData, scorecardData] = await Promise.all([
            cricketApi.getMatchInfo(req.params.id),
            cricketApi.getMatchScorecard(req.params.id)
        ]);

        const merged = {
            ...(matchData?.data || {}),
            ...(scorecardData?.data || {})
        };

        const probability = await calculateWinProbability(merged);
        const result = {
            status: 'success',
            matchId: req.params.id,
            probability
        };

        await cache.setJSON(cacheKey, result, 20);
        return res.json(result);
    } catch (error) {
        if (error.message === 'API_TEMP_BLOCKED') {
            const [staleDetail, staleScorecard] = await Promise.all([
                cache.getJSON(`cric:matches:detail:${req.params.id}:stale`),
                cache.getJSON(`cric:matches:scorecard:${req.params.id}:stale`)
            ]);

            if (staleDetail || staleScorecard) {
                const merged = {
                    ...((staleDetail && (staleDetail.data || staleDetail)) || {}),
                    ...((staleScorecard && (staleScorecard.data || staleScorecard)) || {})
                };
                const probability = await calculateWinProbability(merged);
                return res.json({
                    status: 'success',
                    matchId: req.params.id,
                    probability,
                    _notice: 'Prediction generated from cached match data during CricAPI cooldown.'
                });
            }
        }
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

module.exports = { getLiveMatches, getMatchDetails, getScorecard, getMatchWinProbability };
