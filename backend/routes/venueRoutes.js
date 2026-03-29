const express = require('express');
const router = express.Router();
const { getVenues, seedVenues } = require('../controllers/venueController');

router.get('/', getVenues);
router.post('/admin/seed', seedVenues);

module.exports = router;