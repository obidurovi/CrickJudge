const express = require('express');
const router = express.Router();
const { getLiveMatches, getMatchDetails, getScorecard, getMatchWinProbability } = require('../controllers/matchController');

router.get('/live', getLiveMatches);
router.get('/:id/win-probability', getMatchWinProbability);
router.get('/:id', getMatchDetails);
router.get('/:id/scorecard', getScorecard);

module.exports = router;
