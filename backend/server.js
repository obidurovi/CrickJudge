const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const playerRoutes = require('./routes/playerRoutes');
const venueRoutes = require('./routes/venueRoutes');
const matchRoutes = require('./routes/matchRoutes');
const sseRoutes = require('./routes/sseRoutes');
const { crawlAllPlayers } = require('./utils/teamSync');
const { startMatchBroadcastLoop } = require('./utils/matchBroadcast');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/players', playerRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/sse', sseRoutes);

app.get('/', (req, res) => res.send('CrickJudge API is running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    // Start live match SSE broadcast loop (every 30s)
    startMatchBroadcastLoop();
    // Auto-start background player crawl (100 pages = 2500 players per batch)
    console.log('[Server] Starting background player sync...');
    crawlAllPlayers({ maxPages: 100 }).then(state => {
        console.log(`[Server] Initial sync batch complete. ${state.playersSaved} players saved, offset: ${state.offset}/${state.totalRows}`);
    }).catch(err => {
        console.error('[Server] Background sync error:', err.message);
    });
});
