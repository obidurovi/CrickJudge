const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    location: { type: String, required: true },
    capacity: { type: String, required: true },
    image: { type: String, required: true },
    paceSpin: {
        pace: { type: Number, required: true },
        spin: { type: Number, required: true }
    },
    avgScores: {
        first: { type: Number, required: true },
        second: { type: Number, required: true }
    },
    battingAdvantage: { type: String, required: true },
    description: { type: String, required: true }
});

module.exports = mongoose.model('Venue', venueSchema);