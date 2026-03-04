const axios = require('axios');

const API_BASE = 'https://api.cricapi.com/v1';
const cache = new Map();

const getCached = (key, duration) => {
    const entry = cache.get(key);
    if (entry && Date.now() - entry.ts < duration) return entry.data;
    cache.delete(key);
    return null;
};

const setCache = (key, data) => cache.set(key, { data, ts: Date.now() });

const request = async (endpoint, params = {}, cacheDuration = 60000) => {
    const apiKey = process.env.CRICKET_API_KEY;
    if (!apiKey) throw new Error('CRICKET_API_KEY is not configured');

    const key = `${endpoint}:${JSON.stringify(params)}`;
    const cached = getCached(key, cacheDuration);
    if (cached) return cached;

    const { data } = await axios.get(`${API_BASE}${endpoint}`, {
        params: { apikey: apiKey, ...params },
        timeout: 10000
    });

    if (data.status !== 'success') {
        throw new Error(data.reason || 'API request failed');
    }

    setCache(key, data);
    return data;
};

module.exports = {
    getCurrentMatches: () => request('/currentMatches', {}, 30000),
    getMatchInfo: (id) => request('/match_info', { id }, 30000),
    getMatchScorecard: (id) => request('/match_scorecard', { id }, 30000),
    searchPlayers: (search) => request('/players', { search }, 300000),
    getPlayerStats: (id) => request('/playerStats', { id }, 300000),
    getSeries: () => request('/series', {}, 300000),
    getSeriesInfo: (id) => request('/series_info', { id }, 300000),
    clearCache: () => cache.clear()
};
