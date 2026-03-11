/**
 * SSE (Server-Sent Events) Manager
 * Central hub for managing SSE connections and broadcasting events to clients.
 * 
 * Channels:
 *  - matches:live       → Live match scores & updates
 *  - team:<country>     → Team player list updates (as detail sync enriches players)
 *  - sync:status        → Global player crawl progress
 *  - player:<apiId>     → Individual player detail updates
 */

const clients = new Map(); // channelKey → Set<response>

/**
 * Add a client to one or more channels.
 * Sets up SSE headers and heartbeat, returns cleanup function.
 */
const addClient = (res, channels) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no'
    });
    res.flushHeaders();

    // Send initial connection event
    res.write(`event: connected\ndata: ${JSON.stringify({ channels, time: Date.now() })}\n\n`);

    // Register in each channel
    for (const ch of channels) {
        if (!clients.has(ch)) clients.set(ch, new Set());
        clients.get(ch).add(res);
    }

    // Heartbeat every 20s to keep connection alive
    const heartbeat = setInterval(() => {
        try { res.write(': heartbeat\n\n'); } catch { /* client gone */ }
    }, 20000);

    // Cleanup on disconnect
    const cleanup = () => {
        clearInterval(heartbeat);
        for (const ch of channels) {
            const set = clients.get(ch);
            if (set) {
                set.delete(res);
                if (set.size === 0) clients.delete(ch);
            }
        }
    };

    res.on('close', cleanup);
    return cleanup;
};

/**
 * Broadcast an event to all clients subscribed to a channel.
 */
const broadcast = (channel, event, data) => {
    const set = clients.get(channel);
    if (!set || set.size === 0) return;

    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of set) {
        try {
            res.write(payload);
        } catch {
            set.delete(res);
        }
    }
};

/**
 * Get the count of connected clients per channel (for debugging).
 */
const getStats = () => {
    const stats = {};
    for (const [ch, set] of clients) {
        stats[ch] = set.size;
    }
    return stats;
};

module.exports = { addClient, broadcast, getStats };
