const cricketApi = require('./cricketApi');
const { broadcast } = require('./sseManager');

let broadcastInterval = null;
let lastMatchData = null;

const BROADCAST_INTERVAL = 30000; // 30 seconds

const fetchAndBroadcast = async () => {
    try {
        const data = await cricketApi.getCurrentMatches();
        const matches = data.data || [];

        // Only broadcast if data changed
        const signature = JSON.stringify(matches.map(m => `${m.id}:${m.status}:${JSON.stringify(m.score)}`));
        if (signature !== lastMatchData) {
            lastMatchData = signature;
            broadcast('matches:live', 'matches:update', {
                matches,
                info: data.info || null,
                updatedAt: Date.now()
            });
            console.log(`[MatchBroadcast] Broadcasted ${matches.length} matches`);
        }
    } catch (err) {
        console.error('[MatchBroadcast] Error fetching matches:', err.message);
    }
};

const startMatchBroadcastLoop = () => {
    if (broadcastInterval) return;
    console.log('[MatchBroadcast] Starting live match broadcast loop (every 30s)');
    // Initial fetch after a short delay to let the server fully start
    setTimeout(fetchAndBroadcast, 5000);
    broadcastInterval = setInterval(fetchAndBroadcast, BROADCAST_INTERVAL);
};

const stopMatchBroadcastLoop = () => {
    if (broadcastInterval) {
        clearInterval(broadcastInterval);
        broadcastInterval = null;
    }
};

module.exports = { startMatchBroadcastLoop, stopMatchBroadcastLoop };
