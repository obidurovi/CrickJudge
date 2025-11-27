const express = require('express');
const router = express.Router();
const { getPlayers, triggerScrape } = require('../controllers/playerController');

router.get('/', getPlayers);
router.post('/scrape', triggerScrape);

module.exports = router;
