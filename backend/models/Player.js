const mongoose = require('mongoose');

const playerSchema = mongoose.Schema({
    name: { type: String, required: true },
    country: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['Batsman', 'Bowler', 'Allrounder', 'Wicketkeeper'], 
        required: true 
    },
    battingStyle: { type: String, default: 'Right-hand bat' },
    bowlingStyle: { type: String, default: 'None' },
    image: { type: String, default: '' },
    stats: {
        matches: { type: Number, default: 0 },
        runs: { type: Number, default: 0 },
        wickets: { type: Number, default: 0 },
        average: { type: Number, default: 0.0 },
        strikeRate: { type: Number, default: 0.0 },
        economy: { type: Number, default: 0.0 }
    }
}, { timestamps: true });

module.exports = mongoose.model('Player', playerSchema);
