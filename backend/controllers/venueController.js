const Venue = require('../models/Venue');

// @desc    Get all venues
const getVenues = async (req, res) => {
    try {
        console.log("API Request: Fetching venues...");
        const venues = await Venue.find({});
        console.log(`Database: Found ${venues.length} venues`);
        res.json(venues);
    } catch (error) {
        console.error("Error fetching venues:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getVenues };