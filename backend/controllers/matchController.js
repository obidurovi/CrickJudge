const cricketApi = require('../utils/cricketApi');

const getLiveMatches = async (req, res) => {
    try {
        const data = await cricketApi.getCurrentMatches();
        res.json(data);
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

const getMatchDetails = async (req, res) => {
    try {
        const data = await cricketApi.getMatchInfo(req.params.id);
        res.json(data);
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

const getScorecard = async (req, res) => {
    try {
        const data = await cricketApi.getMatchScorecard(req.params.id);
        res.json(data);
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

module.exports = { getLiveMatches, getMatchDetails, getScorecard };
