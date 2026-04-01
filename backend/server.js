const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const playerRoutes = require('./routes/playerRoutes');
const venueRoutes = require('./routes/venueRoutes');
const matchRoutes = require('./routes/matchRoutes');
const sseRoutes = require('./routes/sseRoutes');
const { crawlAllPlayers } = require('./utils/teamSync');
const { startMatchBroadcastLoop, stopMatchBroadcastLoop } = require('./utils/matchBroadcast');
const { getRuntimeMode, setFreeTierMode } = require('./config/runtimeMode');

dotenv.config();
connectDB();

const app = express();
let runtimeMode = getRuntimeMode();

app.use(cors());
app.use(express.json());

app.use('/api/players', playerRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/sse', sseRoutes);

app.get('/', (req, res) => res.send('CrickJudge API is running'));

const runBackgroundSyncBatch = () => {
    console.log('[Server] Starting background player sync...');
    crawlAllPlayers({ maxPages: 100 }).then(state => {
        console.log(`[Server] Initial sync batch complete. ${state.playersSaved} players saved, offset: ${state.offset}/${state.totalRows}`);
    }).catch(err => {
        console.error('[Server] Background sync error:', err.message);
    });
};

const applyRuntimeMode = () => {
    if (runtimeMode.freeTierMode) {
        stopMatchBroadcastLoop();
        console.log('[Server] Free Tier Mode ON: live broadcast polling disabled');
        console.log('[Server] Free Tier Mode ON: background player sync disabled');
        return;
    }

    startMatchBroadcastLoop();
    runBackgroundSyncBatch();
};

app.get('/api/system/free-tier-mode', (req, res) => {
    res.json({
        freeTierMode: runtimeMode.freeTierMode,
        features: {
            matchBroadcastPolling: !runtimeMode.freeTierMode,
            backgroundPlayerSync: !runtimeMode.freeTierMode
        }
    });
});

app.post('/api/system/free-tier-mode', (req, res) => {
    const configuredAdminKey = process.env.ADMIN_SEED_KEY;
    if (!configuredAdminKey) {
        return res.status(503).json({ message: 'Server admin key is not configured' });
    }

    const providedKey = req.header('x-admin-seed-key');
    if (!providedKey || providedKey !== configuredAdminKey) {
        return res.status(401).json({ message: 'Unauthorized: invalid admin key' });
    }

    const enabled = req.body?.enabled;
    if (typeof enabled !== 'boolean') {
        return res.status(400).json({ message: 'enabled must be a boolean' });
    }

    runtimeMode = setFreeTierMode(enabled);
    applyRuntimeMode();

    return res.json({
        message: `Free Tier Mode ${runtimeMode.freeTierMode ? 'enabled' : 'disabled'}`,
        freeTierMode: runtimeMode.freeTierMode,
        features: {
            matchBroadcastPolling: !runtimeMode.freeTierMode,
            backgroundPlayerSync: !runtimeMode.freeTierMode
        }
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    applyRuntimeMode();
});
