const express = require('express');
const router = express.Router();
const { getVenues, seedVenues, getVenuePlayerCrossAnalysis } = require('../controllers/venueController');

router.get('/player-cross-analysis', getVenuePlayerCrossAnalysis);
router.get('/', getVenues);
router.post('/admin/seed', seedVenues);

module.exports = router;