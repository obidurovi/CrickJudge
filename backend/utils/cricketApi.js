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
        timeout: 15000
    });

    if (data.status !== 'success') {
        throw new Error(data.reason || 'API request failed');
    }

    setCache(key, data);
    return data;
};

/**
 * Fetch ALL players for a country by paginating through the /players endpoint.
 * The API returns 25 players per page. We search by country name and
 * filter results to match the exact country.
 * @param {string} country - Country name (e.g., "India")
 * @param {number} maxPages - Max pages to fetch (safety limit)
 * @returns {Array} All players matching the country
 */
const fetchAllPlayersByCountry = async (country, maxPages = 20) => {
    const allPlayers = [];
    const seenIds = new Set();
    let offset = 0;

    for (let page = 0; page < maxPages; page++) {
        try {
            const data = await request('/players', { offset, search: country }, 600000);
            const players = data.data || [];
            const totalRows = data.info?.totalRows || 0;

            if (players.length === 0) break;

            for (const p of players) {
                // Filter to exact country match (case-insensitive)
                if (p.country && p.country.toLowerCase() === country.toLowerCase() && !seenIds.has(p.id)) {
                    seenIds.add(p.id);
                    allPlayers.push(p);
                }
            }

            offset += 25;
            if (offset >= totalRows) break;
        } catch (err) {
            console.error(`fetchAllPlayersByCountry page ${page} error:`, err.message);
            break;
        }
    }

    return allPlayers;
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
    getPlayerInfo: (id) => request('/players_info', { id }, 300000),
    getSeries: () => request('/series', {}, 300000),
    getSeriesInfo: (id) => request('/series_info', { id }, 300000),
    fetchAllPlayersByCountry,
    clearCache: () => cache.clear()
};
