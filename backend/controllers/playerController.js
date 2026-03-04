const Player = require('../models/Player');
const cricketApi = require('../utils/cricketApi');
const { syncPlayerFromApi } = require('../utils/playerSync');

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

const getPlayerCountries = async (req, res) => {
    try {
        const countries = await Player.distinct('country');
        res.json(countries.filter(c => c && c !== 'Unknown').sort());
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { listPlayers, searchPlayers, getPlayerDetail, getPlayerCountries };