require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { seedVenuesInDb } = require('../utils/venueSeeder');

const seedVenues = async () => {
    try {
        await connectDB();
        const replaceExisting = process.argv.includes('--replace');
        const result = await seedVenuesInDb({ replaceExisting });

        console.log('[VenueSeed] Completed venue seeding.');
        if (result.replaced) {
            console.log(`[VenueSeed] Replace mode enabled. Removed existing venues: ${result.removed}`);
        }
        console.log(`[VenueSeed] Inserted: ${result.inserted}, Updated: ${result.updated}, Matched: ${result.matched}`);
    } catch (error) {
        console.error('[VenueSeed] Failed:', error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

seedVenues();
