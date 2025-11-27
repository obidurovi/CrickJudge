const express = require('express');
const router = express.Router();
const { getVenues } = require('../controllers/venueController');

router.get('/', getVenues);

module.exports = router;