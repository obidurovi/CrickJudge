const cricketApi = require('../utils/cricketApi');
const cache = require('../config/cache');

const getLiveMatches = async (req, res) => {
    try {
        // Check Valkey cache (30s TTL, same as API cache)
        const cacheKey = 'cric:matches:live';
        const cached = await cache.getJSON(cacheKey);
        if (cached) return res.json(cached);

        const data = await cricketApi.getCurrentMatches();
        await cache.setJSON(cacheKey, data, 30);
        res.json(data);
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

const getMatchDetails = async (req, res) => {
    try {
        const cacheKey = `cric:matches:detail:${req.params.id}`;
        const cached = await cache.getJSON(cacheKey);
        if (cached) return res.json(cached);

        const data = await cricketApi.getMatchInfo(req.params.id);
        await cache.setJSON(cacheKey, data, 30);
        res.json(data);
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

const getScorecard = async (req, res) => {
    try {
        const cacheKey = `cric:matches:scorecard:${req.params.id}`;
        const cached = await cache.getJSON(cacheKey);
        if (cached) return res.json(cached);

        const data = await cricketApi.getMatchScorecard(req.params.id);
        await cache.setJSON(cacheKey, data, 30);
        res.json(data);
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

module.exports = { getLiveMatches, getMatchDetails, getScorecard };
