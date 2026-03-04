const Venue = require('../models/Venue');

const getVenues = async (req, res) => {
    try {
        const venues = await Venue.find({});
        res.json(venues);
    } catch (error) {
        console.error("Error fetching venues:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getVenues };