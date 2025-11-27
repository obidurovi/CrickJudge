const Player = require('../models/Player');
const scrapePlayers = require('../utils/scraper');
const { selectBestTeam } = require('../utils/algorithm');

// @desc    Get all players
const getPlayers = async (req, res) => {
    try {
        const { search, role } = req.query;
        let query = {};
        if (search) query.name = { $regex: search, $options: 'i' };
        if (role) query.role = role;

        const players = await Player.find(query);
        res.json(players);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Trigger Scraper
const triggerScrape = async (req, res) => {
    try {
        await scrapePlayers();
        res.json({ message: 'Scraping completed and DB updated.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Generate Best XI Team
const generateTeam = async (req, res) => {
    try {
        const allPlayers = await Player.find({});
        if (allPlayers.length < 11) {
            return res.status(400).json({ message: 'Not enough players in DB to form a team. Please scrape data first.' });
        }
        
        const bestTeam = selectBestTeam(allPlayers);
        res.json(bestTeam);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Ensure all functions are exported here
module.exports = { getPlayers, triggerScrape, generateTeam };