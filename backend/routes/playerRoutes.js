const express = require('express');
const router = express.Router();
const { getPlayers, triggerScrape, generateTeam } = require('../controllers/playerController');

router.get('/', getPlayers);
router.post('/scrape', triggerScrape);
router.get('/generate-team', generateTeam);

module.exports = router;
