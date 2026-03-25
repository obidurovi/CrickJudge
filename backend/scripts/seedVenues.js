require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Venue = require('../models/Venue');
const cache = require('../config/cache');

const venueSeedData = [
    {
        id: 'wankhede-mumbai',
        name: 'Wankhede Stadium',
        location: 'Mumbai, India',
        capacity: '33000',
        image: 'https://images.unsplash.com/photo-1584861702225-1648d2fd7d2a?auto=format&fit=crop&w=1200&q=80',
        paceSpin: { pace: 58, spin: 42 },
        avgScores: { first: 174, second: 162 },
        battingAdvantage: 'Moderate',
        description: 'Short straight boundaries and evening dew often turn Wankhede into a high-scoring chasing venue.'
    },
    {
        id: 'eden-gardens-kolkata',
        name: 'Eden Gardens',
        location: 'Kolkata, India',
        capacity: '68000',
        image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
        paceSpin: { pace: 46, spin: 54 },
        avgScores: { first: 168, second: 154 },
        battingAdvantage: 'Moderate',
        description: 'Traditionally supportive for slower bowlers as the game progresses, especially under dry conditions.'
    },
    {
        id: 'narendra-modi-ahmedabad',
        name: 'Narendra Modi Stadium',
        location: 'Ahmedabad, India',
        capacity: '132000',
        image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
        paceSpin: { pace: 51, spin: 49 },
        avgScores: { first: 171, second: 159 },
        battingAdvantage: 'Moderate',
        description: 'A large ground with variable surfaces where match-ups and pace-off options become decisive.'
    },
    {
        id: 'chinnaswamy-bengaluru',
        name: 'M. Chinnaswamy Stadium',
        location: 'Bengaluru, India',
        capacity: '40000',
        image: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=80',
        paceSpin: { pace: 60, spin: 40 },
        avgScores: { first: 182, second: 170 },
        battingAdvantage: 'High',
        description: 'Small square boundaries and altitude aid stroke play, making this one of the most batting-friendly venues.'
    },
    {
        id: 'lords-london',
        name: 'Lord\'s Cricket Ground',
        location: 'London, England',
        capacity: '31000',
        image: 'https://images.unsplash.com/photo-1521417531039-5f2f2f2f2f2f?auto=format&fit=crop&w=1200&q=80',
        paceSpin: { pace: 64, spin: 36 },
        avgScores: { first: 159, second: 145 },
        battingAdvantage: 'Low',
        description: 'The slope and seam movement reward disciplined pace bowling, especially in overcast conditions.'
    },
    {
        id: 'mcg-melbourne',
        name: 'Melbourne Cricket Ground',
        location: 'Melbourne, Australia',
        capacity: '100024',
        image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
        paceSpin: { pace: 62, spin: 38 },
        avgScores: { first: 165, second: 152 },
        battingAdvantage: 'Low',
        description: 'Large outfield dimensions and extra bounce bring cutters and hard lengths into play throughout the innings.'
    },
    {
        id: 'gaddafi-lahore',
        name: 'Gaddafi Stadium',
        location: 'Lahore, Pakistan',
        capacity: '27000',
        image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80',
        paceSpin: { pace: 55, spin: 45 },
        avgScores: { first: 176, second: 165 },
        battingAdvantage: 'High',
        description: 'Generally true bounce with quick outfield favors aggressive batting and late-over acceleration.'
    },
    {
        id: 'newlands-cape-town',
        name: 'Newlands',
        location: 'Cape Town, South Africa',
        capacity: '25000',
        image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80',
        paceSpin: { pace: 66, spin: 34 },
        avgScores: { first: 161, second: 148 },
        battingAdvantage: 'Low',
        description: 'Early seam and wind assistance often make the first powerplay critical for both innings.'
    }
];

const seedVenues = async () => {
    try {
        await connectDB();

        const operations = venueSeedData.map((venue) => ({
            updateOne: {
                filter: { id: venue.id },
                update: { $set: venue },
                upsert: true
            }
        }));

        const result = await Venue.bulkWrite(operations);
        await cache.del('cric:venues:all');

        console.log('[VenueSeed] Completed venue seeding.');
        console.log(`[VenueSeed] Inserted: ${result.upsertedCount}, Updated: ${result.modifiedCount}, Matched: ${result.matchedCount}`);
    } catch (error) {
        console.error('[VenueSeed] Failed:', error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
};

seedVenues();
