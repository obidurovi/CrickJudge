const Player = require('../models/Player');
const cricketApi = require('../utils/cricketApi');
const { syncPlayerFromApi } = require('../utils/playerSync');
const { getTeamPlayers, crawlAllPlayers, syncTeamDetails, getSyncStatus, getAllTeams } = require('../utils/teamSync');

const CACHE_DURATION = 24 * 60 * 60 * 1000;

const listPlayers = async (req, res) => {
    try {
        const offset = parseInt(req.query.offset) || 0;
        const data = await cricketApi.listPlayers(offset);
        const apiPlayers = data.data || [];
        const totalRows = data.info?.totalRows || 0;

        const apiIds = apiPlayers.map(p => p.id);
        const cached = await Player.find({ apiId: { $in: apiIds } });
        const cacheMap = new Map(cached.map(p => [p.apiId, p]));

        const players = apiPlayers.map(p => {
            if (cacheMap.has(p.id)) {
                return cacheMap.get(p.id);
            }
            return {
                apiId: p.id,
                name: p.name,
                country: p.country || 'Unknown',
                source: 'api',
                _isBasic: true
            };
        });

        res.json({
            players,
            total: totalRows,
            offset,
            perPage: 25,
            hasMore: offset + 25 < totalRows
        });
    } catch (error) {
        if (error.message.includes('CRICKET_API_KEY')) {
            return res.status(503).json({ message: 'API key not configured', code: 'API_KEY_MISSING' });
        }
        if (error.message.includes('hits') || error.message.includes('limit') || error.message.includes('Blocking') || error.message.includes('Blocked')) {
            const offset = parseInt(req.query.offset) || 0;
            const limit = 25;
            const cachedPlayers = await Player.find({}).sort({ name: 1 }).skip(offset).limit(limit);
            const totalCached = await Player.countDocuments();
            if (cachedPlayers.length > 0) {
                return res.json({
                    players: cachedPlayers,
                    total: totalCached,
                    offset,
                    perPage: limit,
                    hasMore: offset + limit < totalCached,
                    _cached: true,
                    _notice: 'API rate limit reached. Showing cached players.'
                });
            }
            return res.status(429).json({ message: 'API rate limit exceeded. Try again tomorrow.', code: 'RATE_LIMITED' });
        }
        res.status(500).json({ message: error.message });
    }
};

const searchPlayers = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.status(400).json({ message: 'Search query must be at least 2 characters' });
        }

        const data = await cricketApi.listPlayers(0, q);
        const apiPlayers = data.data || [];

        const apiIds = apiPlayers.map(p => p.id);
        const cached = await Player.find({ apiId: { $in: apiIds } });
        const cacheMap = new Map(cached.map(p => [p.apiId, p]));

        const players = apiPlayers.map(p => {
            if (cacheMap.has(p.id)) {
                return cacheMap.get(p.id);
            }
            return {
                apiId: p.id,
                name: p.name,
                country: p.country || 'Unknown',
                source: 'api',
                _isBasic: true
            };
        });

        res.json({ players, total: apiPlayers.length });
    } catch (error) {
        if (error.message.includes('CRICKET_API_KEY')) {
            return res.status(503).json({ message: 'API key not configured', code: 'API_KEY_MISSING' });
        }
        if (error.message.includes('hits') || error.message.includes('limit') || error.message.includes('Blocking') || error.message.includes('Blocked')) {
            const { q } = req.query;
            const regex = new RegExp(q, 'i');
            const cachedPlayers = await Player.find({ name: regex }).limit(50);
            if (cachedPlayers.length > 0) {
                return res.json({ players: cachedPlayers, total: cachedPlayers.length, _cached: true, _notice: 'API rate limit reached. Showing cached results.' });
            }
            return res.status(429).json({ message: 'API rate limit exceeded. Try again tomorrow.', code: 'RATE_LIMITED' });
        }
        res.status(500).json({ message: error.message });
    }
};

const getPlayerDetail = async (req, res) => {
    try {
        const { apiId } = req.params;

        let player = await Player.findOne({ apiId });
        if (player && player.lastSynced && (Date.now() - player.lastSynced.getTime() < CACHE_DURATION)) {
            return res.json(player);
        }

        const synced = await syncPlayerFromApi(apiId);
        if (synced) {
            return res.json(synced);
        }

        if (player) return res.json(player);

        return res.status(404).json({ message: 'Player not found' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get all players for a team — fetches from live CricAPI, caches in MongoDB.
 */
const getPlayersByTeam = async (req, res) => {
    try {
        const { country } = req.params;

        const result = await getTeamPlayers(country);

        return res.json({
            players: result.players,
            total: result.total,
            offset: 0,
            hasMore: false,
            fromCache: result.fromCache || false,
            syncing: result.syncing || false,
            lastSynced: result.lastSynced || null,
            message: result.message || null,
            source: 'api'
        });
    } catch (error) {
        if (error.message && (error.message.includes('hits') || error.message.includes('limit') || error.message.includes('Block'))) {
            // Rate limited — try to serve from DB cache
            const regex = new RegExp(`^${req.params.country.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
            const cachedPlayers = await Player.find({ country: regex }).sort({ name: 1 });
            if (cachedPlayers.length > 0) {
                return res.json({
                    players: cachedPlayers,
                    total: cachedPlayers.length,
                    offset: 0,
                    hasMore: false,
                    fromCache: true,
                    source: 'cache',
                    _notice: 'API rate limit reached. Showing cached players.'
                });
            }
            return res.status(429).json({ message: 'API rate limit exceeded and no cached data available.', code: 'RATE_LIMITED' });
        }
        res.status(500).json({ message: error.message });
    }
};

/**
 * Trigger a global sync to crawl ALL players from the API (POST /api/players/sync-all)
 */
const syncAll = async (req, res) => {
    try {
        const maxPages = parseInt(req.query.pages) || 100;
        // Start crawl in background
        crawlAllPlayers({ maxPages }).catch(err => {
            console.error('[Sync] Background crawl error:', err.message);
        });

        const status = getSyncStatus();
        return res.json({
            message: `Global player sync started. Crawling up to ${maxPages} pages.`,
            status
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Fetch detailed info for a team's players (POST /api/players/sync-team/:country)
 */
const syncTeam = async (req, res) => {
    try {
        const { country } = req.params;
        const result = await syncTeamDetails(country, 30);

        return res.json({
            message: `Synced detailed info for ${result.synced} of ${result.total} players in ${country}`,
            ...result
        });
    } catch (error) {
        if (error.message && (error.message.includes('hits') || error.message.includes('limit') || error.message.includes('Block'))) {
            return res.status(429).json({ message: 'API rate limit exceeded.', code: 'RATE_LIMITED' });
        }
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get the current sync status (GET /api/players/sync-status)
 */
const getSyncStatusEndpoint = async (req, res) => {
    try {
        const status = getSyncStatus();
        res.json(status);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get the list of all international teams with player counts from the DB.
 * Merges alias counts (e.g. "United Arab Emirates" -> "UAE").
 */
const getTeamsList = async (req, res) => {
    try {
        const teams = await getAllTeams();
        res.json(teams);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getPlayerCountries = async (req, res) => {
    try {
        const countries = await Player.distinct('country');
        res.json(countries.filter(c => c && c !== 'Unknown').sort());
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { listPlayers, searchPlayers, getPlayerDetail, getPlayerCountries, getPlayersByTeam, getTeamsList, syncTeam, syncAll, getSyncStatusEndpoint };