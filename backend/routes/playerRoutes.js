const express = require('express');
const router = express.Router();
const {
    listPlayers, searchPlayers, getPlayerDetail, getPlayerCountries
} = require('../controllers/playerController');

router.get('/', listPlayers);
router.get('/search', searchPlayers);
router.get('/countries', getPlayerCountries);
router.get('/detail/:apiId', getPlayerDetail);

module.exports = router;
