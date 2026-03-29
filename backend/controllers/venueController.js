const Venue = require('../models/Venue');
const cache = require('../config/cache');
const { seedVenuesInDb } = require('../utils/venueSeeder');

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

const seedVenues = async (req, res) => {
    try {
        const adminSeedKey = process.env.ADMIN_SEED_KEY;
        if (adminSeedKey) {
            const providedKey = req.headers['x-admin-seed-key'];
            if (providedKey !== adminSeedKey) {
                return res.status(401).json({ message: 'Unauthorized: invalid admin seed key' });
            }
        }

        const rawReplace = req.body?.replaceExisting ?? req.query?.replaceExisting;
        const replaceExisting = rawReplace === true || rawReplace === 'true' || rawReplace === '1';

        const result = await seedVenuesInDb({ replaceExisting });
        return res.json({
            message: 'Venue seeding completed',
            ...result
        });
    } catch (error) {
        console.error('Error seeding venues:', error);
        return res.status(500).json({ message: error.message });
    }
};

module.exports = { getVenues, seedVenues };