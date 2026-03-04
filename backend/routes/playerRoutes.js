const express = require('express');
const router = express.Router();
const { getPlayers, refreshPlayers } = require('../controllers/playerController');

router.get('/', getPlayers);
router.post('/refresh', refreshPlayers);

module.exports = router;
