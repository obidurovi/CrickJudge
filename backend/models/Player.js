const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    country: { type: String, required: true },
    role: { type: String, required: true },
    battingStyle: String,
    bowlingStyle: String,
    image: String,
    stats: {
        matches: Number,
        runs: Number,
        wickets: Number,
        average: Number,
        economy: Number,
        strikeRate: Number
    },
    // New field to store league teams dynamically
    leagues: {
        type: Map,
        of: String, // Key: League Name (IPL), Value: Team Name (CSK)
        default: {}
    }
});

module.exports = mongoose.model('Player', playerSchema);
