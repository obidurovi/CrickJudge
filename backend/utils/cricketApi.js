const axios = require('axios');
const cache = require('../config/cache');

const API_BASE = 'https://api.cricapi.com/v1';

const request = async (endpoint, params = {}, cacheDuration = 60000) => {
    const apiKey = process.env.CRICKET_API_KEY;
    if (!apiKey) throw new Error('CRICKET_API_KEY is not configured');

    const key = `cric:api:${endpoint}:${JSON.stringify(params)}`;
    const cached = await cache.getJSON(key);
    if (cached) return cached;

    const { data } = await axios.get(`${API_BASE}${endpoint}`, {
        params: { apikey: apiKey, ...params },
        timeout: 15000
    });

    if (data.status !== 'success') {
        throw new Error(data.reason || 'API request failed');
    }

    // Store with TTL in seconds (cacheDuration comes in ms)
    await cache.setJSON(key, data, Math.ceil(cacheDuration / 1000));
    return data;
};

module.exports = {
    getCurrentMatches: () => request('/currentMatches', {}, 30000),
    getMatchInfo: (id) => request('/match_info', { id }, 30000),
    getMatchScorecard: (id) => request('/match_scorecard', { id }, 30000),
    listPlayers: (offset = 0, search = '') => {
        const params = { offset };
        if (search) params.search = search;
        return request('/players', params, 600000);
    },
    getPlayerInfo: (id) => request('/players_info', { id }, 300000)
};
