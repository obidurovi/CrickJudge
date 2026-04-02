const cricketApi = require('../utils/cricketApi');
const cache = require('../config/cache');
const { calculateWinProbability } = require('../utils/winProbability');
const { getRuntimeMode } = require('../config/runtimeMode');
const { getSeriesMeta, aggregateLeaderboards } = require('../utils/seriesLeaderboard');
const { aggregatePlayerForm } = require('../utils/playerFormTracker');

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const normalizeSeriesQuery = (value) => String(value || '').toLowerCase().trim();

const readLiveMatchesForLeaderboards = async () => {
    const cacheKey = 'cric:matches:live';
    const staleKey = 'cric:matches:live:stale';

    const cached = await cache.getJSON(cacheKey);
    if (cached?.data) {
        return {
            matches: cached.data,
            notice: cached._notice || null
        };
    }

    try {
        const data = await cricketApi.getCurrentMatches();
        await cache.setJSON(cacheKey, data, 30);
        await cache.setJSON(staleKey, data, 6 * 60 * 60);
        return {
            matches: data?.data || [],
            notice: null
        };
    } catch (error) {
        if (error.message === 'API_TEMP_BLOCKED') {
            const stale = await cache.getJSON(staleKey);
            if (stale?.data) {
                return {
                    matches: stale.data,
                    notice: 'Using cached live matches while CricAPI cooldown is active.'
                };
            }
            return {
                matches: [],
                notice: 'CricAPI cooldown active. No cached live matches available yet.'
            };
        }
        throw error;
    }
};

const readScorecardForLeaderboard = async (matchId, allowNetwork) => {
    const cacheKey = `cric:matches:scorecard:${matchId}`;
    const staleKey = `cric:matches:scorecard:${matchId}:stale`;

    const cached = await cache.getJSON(cacheKey);
    if (cached) return cached;

    const stale = await cache.getJSON(staleKey);
    if (!allowNetwork) return stale;

    try {
        const data = await cricketApi.getMatchScorecard(matchId);
        await cache.setJSON(cacheKey, data, 30);
        await cache.setJSON(staleKey, data, 6 * 60 * 60);
        return data;
    } catch (error) {
        if (error.message === 'API_TEMP_BLOCKED') {
            return stale;
        }
        return stale;
    }
};

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

const getSeriesLeaderboards = async (req, res) => {
    try {
        const limit = clamp(parseInt(req.query.limit, 10) || 10, 5, 25);
        const requestedSeries = normalizeSeriesQuery(req.query.series || req.query.seriesKey || req.query.seriesId);
        const runtimeMode = getRuntimeMode();

        const { matches, notice } = await readLiveMatchesForLeaderboards();

        if (!Array.isArray(matches) || matches.length === 0) {
            return res.json({
                status: 'success',
                series: null,
                availableSeries: [],
                matchesAnalyzed: 0,
                leaderboards: {
                    topRunScorers: [],
                    topWicketTakers: [],
                    bestEconomy: [],
                    bestStrikeRates: []
                },
                coverage: {
                    matchesWithScorecards: 0,
                    inningsProcessed: 0,
                    battingRows: 0,
                    bowlingRows: 0
                },
                freeTierMode: runtimeMode.freeTierMode,
                _notice: notice || 'No live matches available right now.'
            });
        }

        const buckets = new Map();
        matches.forEach((match) => {
            const meta = getSeriesMeta(match);
            const existing = buckets.get(meta.seriesKey) || {
                meta,
                matches: [],
                liveCount: 0
            };

            existing.matches.push(match);
            if (match?.matchStarted && !match?.matchEnded) {
                existing.liveCount += 1;
            }
            buckets.set(meta.seriesKey, existing);
        });

        const availableSeries = [...buckets.values()]
            .map((bucket) => ({
                seriesKey: bucket.meta.seriesKey,
                seriesId: bucket.meta.seriesId,
                seriesName: bucket.meta.seriesName,
                matchCount: bucket.matches.length,
                liveCount: bucket.liveCount
            }))
            .sort((a, b) => b.liveCount - a.liveCount || b.matchCount - a.matchCount || a.seriesName.localeCompare(b.seriesName));

        let selected = null;
        if (requestedSeries) {
            selected = availableSeries.find((series) =>
                normalizeSeriesQuery(series.seriesKey) === requestedSeries
                || normalizeSeriesQuery(series.seriesId) === requestedSeries
                || normalizeSeriesQuery(series.seriesName) === requestedSeries
            ) || null;
        }

        if (!selected) {
            selected = availableSeries[0];
        }

        const selectedMatches = (buckets.get(selected.seriesKey)?.matches || []).filter((match) => match?.id);
        const cacheKey = `cric:matches:leaderboards:${selected.seriesKey}:${limit}:${runtimeMode.freeTierMode ? 'free' : 'full'}`;
        const cached = await cache.getJSON(cacheKey);
        if (cached) {
            return res.json(cached);
        }

        const maxNetworkFetches = runtimeMode.freeTierMode
            ? Math.min(2, selectedMatches.length)
            : selectedMatches.length;

        const scorecards = await Promise.all(selectedMatches.map(async (match, index) => {
            const matchId = String(match.id);
            const allowNetwork = index < maxNetworkFetches;
            const payload = await readScorecardForLeaderboard(matchId, allowNetwork);
            return { matchId, payload };
        }));

        const scorecardsByMatchId = new Map(
            scorecards
                .filter((entry) => !!entry.payload)
                .map((entry) => [entry.matchId, entry.payload])
        );

        const aggregated = aggregateLeaderboards({
            matches: selectedMatches,
            scorecardsByMatchId,
            limit
        });

        const partialCoverage = aggregated.coverage.matchesWithScorecards < selectedMatches.length;
        const response = {
            status: 'success',
            series: selected,
            availableSeries,
            matchesAnalyzed: selectedMatches.length,
            leaderboards: aggregated.leaderboards,
            coverage: aggregated.coverage,
            freeTierMode: runtimeMode.freeTierMode,
            generatedAt: new Date().toISOString(),
            _notice: [
                notice,
                partialCoverage
                    ? (runtimeMode.freeTierMode
                        ? `Free Tier Mode ON: using cache + up to ${maxNetworkFetches} scorecard fetches per request.`
                        : 'Some matches are missing detailed scorecards right now.')
                    : null
            ].filter(Boolean).join(' | ') || null
        };

        await cache.setJSON(cacheKey, response, 30);
        return res.json(response);
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

const getPlayerFormTracker = async (req, res) => {
    try {
        const limit = clamp(parseInt(req.query.limit, 10) || 80, 20, 150);
        const requestedSeries = normalizeSeriesQuery(req.query.series || req.query.seriesKey || req.query.seriesId);
        const runtimeMode = getRuntimeMode();

        const { matches, notice } = await readLiveMatchesForLeaderboards();

        if (!Array.isArray(matches) || matches.length === 0) {
            return res.json({
                status: 'success',
                series: null,
                availableSeries: [],
                matchesAnalyzed: 0,
                players: [],
                highlights: {
                    inFormPlayers: [],
                    outOfFormPlayers: [],
                    consistencyLeaders: [],
                    biggestImprovers: []
                },
                summary: {
                    playersTracked: 0,
                    inFormCount: 0,
                    outOfFormCount: 0,
                    neutralCount: 0,
                    dataLimitedCount: 0
                },
                coverage: {
                    matchesWithScorecards: 0,
                    inningsProcessed: 0,
                    battingAppearances: 0,
                    bowlingSpells: 0,
                    playersTracked: 0
                },
                freeTierMode: runtimeMode.freeTierMode,
                _notice: notice || 'No live matches available right now.'
            });
        }

        const buckets = new Map();
        matches.forEach((match) => {
            const meta = getSeriesMeta(match);
            const existing = buckets.get(meta.seriesKey) || {
                meta,
                matches: [],
                liveCount: 0
            };

            existing.matches.push(match);
            if (match?.matchStarted && !match?.matchEnded) {
                existing.liveCount += 1;
            }
            buckets.set(meta.seriesKey, existing);
        });

        const availableSeries = [...buckets.values()]
            .map((bucket) => ({
                seriesKey: bucket.meta.seriesKey,
                seriesId: bucket.meta.seriesId,
                seriesName: bucket.meta.seriesName,
                matchCount: bucket.matches.length,
                liveCount: bucket.liveCount
            }))
            .sort((a, b) => b.liveCount - a.liveCount || b.matchCount - a.matchCount || a.seriesName.localeCompare(b.seriesName));

        let selected = null;
        if (requestedSeries) {
            selected = availableSeries.find((series) =>
                normalizeSeriesQuery(series.seriesKey) === requestedSeries
                || normalizeSeriesQuery(series.seriesId) === requestedSeries
                || normalizeSeriesQuery(series.seriesName) === requestedSeries
            ) || null;
        }

        if (!selected) {
            selected = availableSeries[0];
        }

        const selectedMatches = (buckets.get(selected.seriesKey)?.matches || [])
            .filter((match) => match?.id)
            .sort((a, b) => {
                const aDate = Date.parse(a?.dateTimeGMT || a?.date || '') || 0;
                const bDate = Date.parse(b?.dateTimeGMT || b?.date || '') || 0;
                return aDate - bDate;
            });

        const cacheKey = `cric:matches:formtracker:${selected.seriesKey}:${limit}:${runtimeMode.freeTierMode ? 'free' : 'full'}`;
        const cached = await cache.getJSON(cacheKey);
        if (cached) {
            return res.json(cached);
        }

        const maxNetworkFetches = runtimeMode.freeTierMode
            ? Math.min(2, selectedMatches.length)
            : selectedMatches.length;

        const scorecards = await Promise.all(selectedMatches.map(async (match, index) => {
            const matchId = String(match.id);
            const allowNetwork = index < maxNetworkFetches;
            const payload = await readScorecardForLeaderboard(matchId, allowNetwork);
            return { matchId, payload };
        }));

        const scorecardsByMatchId = new Map(
            scorecards
                .filter((entry) => !!entry.payload)
                .map((entry) => [entry.matchId, entry.payload])
        );

        const aggregated = aggregatePlayerForm({
            matches: selectedMatches,
            scorecardsByMatchId,
            limit
        });

        const partialCoverage = aggregated.coverage.matchesWithScorecards < selectedMatches.length;
        const response = {
            status: 'success',
            series: selected,
            availableSeries,
            matchesAnalyzed: selectedMatches.length,
            players: aggregated.players,
            highlights: aggregated.highlights,
            summary: aggregated.summary,
            coverage: aggregated.coverage,
            freeTierMode: runtimeMode.freeTierMode,
            generatedAt: new Date().toISOString(),
            _notice: [
                notice,
                partialCoverage
                    ? (runtimeMode.freeTierMode
                        ? `Free Tier Mode ON: using cache + up to ${maxNetworkFetches} scorecard fetches per request.`
                        : 'Some matches are missing detailed scorecards right now.')
                    : null
            ].filter(Boolean).join(' | ') || null
        };

        await cache.setJSON(cacheKey, response, 30);
        return res.json(response);
    } catch (error) {
        return res.status(500).json({ status: 'error', message: error.message });
    }
};

module.exports = { getLiveMatches, getMatchDetails, getScorecard, getMatchWinProbability, getSeriesLeaderboards, getPlayerFormTracker };
