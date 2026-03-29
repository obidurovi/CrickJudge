const Venue = require('../models/Venue');
const cache = require('../config/cache');
const venueSeedData = require('./venueSeedData');

const seedVenuesInDb = async ({ replaceExisting = false } = {}) => {
    let removed = 0;
    if (replaceExisting) {
        const deleteResult = await Venue.deleteMany({});
        removed = deleteResult.deletedCount || 0;
    }

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
        replaced: replaceExisting,
        removed,
        inserted: result.upsertedCount,
        updated: result.modifiedCount,
        matched: result.matchedCount,
        totalSeedRows: venueSeedData.length
    };
};

module.exports = { seedVenuesInDb };