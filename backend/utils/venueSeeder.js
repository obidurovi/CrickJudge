const Venue = require('../models/Venue');
const cache = require('../config/cache');
const venueSeedData = require('./venueSeedData');

const seedVenuesInDb = async () => {
    const operations = venueSeedData.map((venue) => ({
        updateOne: {
            filter: { id: venue.id },
            update: { $set: venue },
            upsert: true
        }
    }));

    const result = await Venue.bulkWrite(operations);
    await cache.del('cric:venues:all');

    return {
        inserted: result.upsertedCount,
        updated: result.modifiedCount,
        matched: result.matchedCount,
        totalSeedRows: venueSeedData.length
    };
};

module.exports = { seedVenuesInDb };