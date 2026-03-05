const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    apiId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    country: { type: String, default: 'Unknown' },
    role: { type: String, default: 'Unknown' },
    battingStyle: { type: String, default: '' },
    bowlingStyle: { type: String, default: '' },
    image: { type: String, default: '' },
    dateOfBirth: String,
    placeOfBirth: String,
    stats: {
        matches: { type: Number, default: 0 },
        runs: { type: Number, default: 0 },
        wickets: { type: Number, default: 0 },
        average: { type: Number, default: 0 },
        economy: { type: Number, default: 0 },
        strikeRate: { type: Number, default: 0 }
    },
    detailedStats: {
        test: {
            matches: Number, innings: Number, runs: Number,
            average: Number, strikeRate: Number, hundreds: Number,
            fifties: Number, wickets: Number, bowlingAvg: Number,
            economy: Number, bestBatting: String, bestBowling: String
        },
        odi: {
            matches: Number, innings: Number, runs: Number,
            average: Number, strikeRate: Number, hundreds: Number,
            fifties: Number, wickets: Number, bowlingAvg: Number,
            economy: Number, bestBatting: String, bestBowling: String
        },
        t20i: {
            matches: Number, innings: Number, runs: Number,
            average: Number, strikeRate: Number, hundreds: Number,
            fifties: Number, wickets: Number, bowlingAvg: Number,
            economy: Number, bestBatting: String, bestBowling: String
        },
        ipl: {
            matches: Number, innings: Number, runs: Number,
            average: Number, strikeRate: Number, hundreds: Number,
            fifties: Number, wickets: Number, bowlingAvg: Number,
            economy: Number, bestBatting: String, bestBowling: String
        }
    },
    source: { type: String, enum: ['api'], default: 'api' },
    lastSynced: { type: Date, default: null }
}, { timestamps: true });

playerSchema.index({ name: 'text', country: 'text' });

module.exports = mongoose.model('Player', playerSchema);
