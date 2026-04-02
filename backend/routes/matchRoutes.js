const express = require('express');
const router = express.Router();
const { getLiveMatches, getMatchDetails, getScorecard, getMatchWinProbability, getSeriesLeaderboards } = require('../controllers/matchController');

router.get('/live', getLiveMatches);
router.get('/leaderboards', getSeriesLeaderboards);
router.get('/:id/win-probability', getMatchWinProbability);
router.get('/:id', getMatchDetails);
router.get('/:id/scorecard', getScorecard);

module.exports = router;
