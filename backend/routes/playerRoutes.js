const express = require('express');
const router = express.Router();
const { getPlayers, refreshPlayers } = require('../controllers/playerController');

// Get all players
router.get('/', getPlayers);

// Refresh players database (Optional manual trigger)
router.post('/refresh', refreshPlayers);

module.exports = router;
