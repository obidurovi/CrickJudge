const mongoose = require('mongoose');

const playerWatchlistSchema = new mongoose.Schema({
    clientId: { type: String, required: true, unique: true, index: true },
    playerIds: { type: [String], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('PlayerWatchlist', playerWatchlistSchema);
