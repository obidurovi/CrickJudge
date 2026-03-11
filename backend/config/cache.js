const Redis = require('ioredis');

let client = null;
let isConnected = false;

// In-memory fallback when Valkey/Redis is unavailable
const memoryCache = new Map();

const getClient = () => {
    if (client) return client;

    const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    client = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        retryStrategy(times) {
            if (times > 3) return null; // Stop retrying after 3 attempts
            return Math.min(times * 500, 3000);
        },
        lazyConnect: true,
        enableOfflineQueue: false
    });

    client.on('connect', () => {
        isConnected = true;
        console.log('[Cache] Connected to Valkey/Redis');
    });

    client.on('error', (err) => {
        if (isConnected) {
            console.error('[Cache] Valkey/Redis error:', err.message);
        }
        isConnected = false;
    });

    client.on('close', () => {
        isConnected = false;
    });

    // Attempt connection
    client.connect().catch(() => {
        console.warn('[Cache] Valkey/Redis not available — using in-memory fallback');
    });

    return client;
};

/**
 * Get a cached value by key.
 * Falls back to in-memory Map if Valkey is unavailable.
 */
const get = async (key) => {
    try {
        if (isConnected) {
            return await getClient().get(key);
        }
    } catch { /* fallback */ }

    // In-memory fallback
    const entry = memoryCache.get(key);
    if (entry && Date.now() < entry.expiry) return entry.value;
    memoryCache.delete(key);
    return null;
};

/**
 * Set a cached value with TTL (in seconds).
 */
const set = async (key, value, ttlSeconds = 60) => {
    try {
        if (isConnected) {
            await getClient().set(key, value, 'EX', ttlSeconds);
            return;
        }
    } catch { /* fallback */ }

    // In-memory fallback
    memoryCache.set(key, { value, expiry: Date.now() + ttlSeconds * 1000 });
};

/**
 * Get and parse a JSON-cached value.
 */
const getJSON = async (key) => {
    const raw = await get(key);
    if (raw === null || raw === undefined) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

/**
 * Cache a JSON-serializable value with TTL.
 */
const setJSON = async (key, data, ttlSeconds = 60) => {
    await set(key, JSON.stringify(data), ttlSeconds);
};

/**
 * Delete a specific cache key.
 */
const del = async (key) => {
    try {
        if (isConnected) {
            await getClient().del(key);
        }
    } catch { /* ignore */ }
    memoryCache.delete(key);
};

/**
 * Delete all keys matching a pattern (e.g., 'cric:players:*').
 * Uses SCAN to avoid blocking.
 */
const delPattern = async (pattern) => {
    try {
        if (isConnected) {
            const stream = getClient().scanStream({ match: pattern, count: 100 });
            const pipeline = getClient().pipeline();
            let count = 0;

            await new Promise((resolve, reject) => {
                stream.on('data', (keys) => {
                    for (const key of keys) {
                        pipeline.del(key);
                        count++;
                    }
                });
                stream.on('end', resolve);
                stream.on('error', reject);
            });

            if (count > 0) await pipeline.exec();
            return count;
        }
    } catch { /* ignore */ }

    // In-memory fallback: match by prefix
    const prefix = pattern.replace(/\*/g, '');
    let count = 0;
    for (const key of memoryCache.keys()) {
        if (key.startsWith(prefix)) {
            memoryCache.delete(key);
            count++;
        }
    }
    return count;
};

/**
 * Get cache stats for debugging.
 */
const getStats = async () => {
    const stats = {
        backend: isConnected ? 'valkey' : 'memory',
        connected: isConnected
    };

    if (isConnected) {
        try {
            const info = await getClient().info('keyspace');
            stats.keyspace = info;
        } catch { /* ignore */ }
    } else {
        stats.memoryKeys = memoryCache.size;
    }

    return stats;
};

module.exports = { get, set, getJSON, setJSON, del, delPattern, getStats, getClient };
