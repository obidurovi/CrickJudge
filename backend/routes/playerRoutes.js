const express = require('express');
const router = express.Router();
const {
    listPlayers, searchPlayers, getPlayerDetail, getPlayerCountries, getPlayersByTeam
} = require('../controllers/playerController');

router.get('/', listPlayers);
router.get('/search', searchPlayers);
router.get('/countries', getPlayerCountries);
router.get('/team/:country', getPlayersByTeam);
router.get('/detail/:apiId', getPlayerDetail);

module.exports = router;
