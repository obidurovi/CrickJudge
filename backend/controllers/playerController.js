const Player = require('../models/Player');
const scrapePlayers = require('../utils/playerScraper'); // Updated import path

// @desc    Get all players
const getPlayers = async (req, res) => {
    try {
        const players = await Player.find({});
        res.json(players);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Scrape players manually (if needed via controller)
const refreshPlayers = async (req, res) => {
    try {
        await scrapePlayers();
        res.json({ message: "Players scraped successfully!" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getPlayers, refreshPlayers };