const Venue = require('../models/Venue');
const cache = require('../config/cache');

const getVenues = async (req, res) => {
    try {
        // Check Valkey cache (venues are static, long TTL)
        const cacheKey = 'cric:venues:all';
        const cached = await cache.getJSON(cacheKey);
        if (cached) return res.json(cached);

        const venues = await Venue.find({});
        // Cache for 1 hour (venues rarely change)
        await cache.setJSON(cacheKey, venues, 3600);
        res.json(venues);
    } catch (error) {
        console.error("Error fetching venues:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getVenues };