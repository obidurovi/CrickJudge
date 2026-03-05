const express = require('express');
const router = express.Router();
const {
    listPlayers, searchPlayers, getPlayerDetail, getPlayerCountries,
    getPlayersByTeam, getTeamsList, syncTeam, syncAll, getSyncStatusEndpoint
} = require('../controllers/playerController');

router.get('/', listPlayers);
router.get('/search', searchPlayers);
router.get('/countries', getPlayerCountries);
router.get('/teams-list', getTeamsList);
router.get('/team/:country', getPlayersByTeam);
router.get('/sync-status', getSyncStatusEndpoint);
router.post('/sync-all', syncAll);
router.post('/sync-team/:country', syncTeam);
router.get('/detail/:apiId', getPlayerDetail);

module.exports = router;
