const express = require('express');
const router = express.Router();
const { addClient, getStats } = require('../utils/sseManager');
const { getSyncStatus } = require('../utils/teamSync');
const cacheModule = require('../config/cache');

/**
 * GET /api/sse/matches
 * SSE stream for live match updates.
 */
router.get('/matches', (req, res) => {
    addClient(res, ['matches:live']);
});

/**
 * GET /api/sse/team/:country?gender=male
 * SSE stream for a specific team's player list updates.
 */
router.get('/team/:country', (req, res) => {
    const country = req.params.country.toLowerCase();
    const gender = req.query.gender || 'male';
    addClient(res, [`team:${country}:${gender}`, 'sync:status']);
});

/**
 * GET /api/sse/player/:apiId
 * SSE stream for individual player detail updates.
 */
router.get('/player/:apiId', (req, res) => {
    addClient(res, [`player:${req.params.apiId}`]);
});

/**
 * GET /api/sse/sync
 * SSE stream for global sync progress.
 */
router.get('/sync', (req, res) => {
    addClient(res, ['sync:status']);

    // Send current status immediately
    const status = getSyncStatus();
    res.write(`event: sync:status\ndata: ${JSON.stringify(status)}\n\n`);
});

/**
 * GET /api/sse/dashboard
 * SSE stream for dashboard (players list + sync status).
 */
router.get('/dashboard', (req, res) => {
    addClient(res, ['dashboard:players', 'sync:status']);
});

/**
 * GET /api/sse/stats — debug endpoint
 */
router.get('/stats', (req, res) => {
    res.json(getStats());
});

/**
 * GET /api/sse/cache-stats — cache health endpoint
 */
router.get('/cache-stats', async (req, res) => {
    const stats = await cacheModule.getStats();
    res.json(stats);
});

module.exports = router;
