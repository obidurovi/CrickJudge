const Player = require('../models/Player');
const cricketApi = require('./cricketApi');
const { syncPlayerFromApi } = require('./playerSync');

// Sync state tracking
let globalSyncState = {
    isRunning: false,
    offset: 0,
    totalRows: 0,
    playersSaved: 0,
    lastSyncAt: null,
    errors: [],
    startedAt: null
};

// How long before we consider crawled data stale
const GLOBAL_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const DELAY_BETWEEN_PAGES = 1500; // 1.5s between API calls to avoid rate limits

const INTERNATIONAL_TEAMS = [
    'India', 'Australia', 'England', 'South Africa', 'New Zealand',
    'Pakistan', 'Sri Lanka', 'Bangladesh', 'West Indies', 'Zimbabwe',
    'Afghanistan', 'Ireland', 'Netherlands', 'Scotland', 'Nepal',
    'USA', 'UAE', 'Oman', 'Namibia', 'Canada',
    'Papua New Guinea', 'Uganda', 'Kenya', 'Hong Kong'
];

// Country name aliases — the API may use different names than our UI
const COUNTRY_ALIASES = {
    'USA': ['United States of America', 'United States', 'U.S.A.'],
    'UAE': ['United Arab Emirates', 'U.A.E.'],
    'Hong Kong': ['Hong Kong, China', 'Hong Kong China'],
};

// Build reverse lookup: api_name -> our_name
const ALIAS_TO_CANONICAL = {};
for (const [canonical, aliases] of Object.entries(COUNTRY_ALIASES)) {
    for (const alias of aliases) {
        ALIAS_TO_CANONICAL[alias.toLowerCase()] = canonical;
    }
}

/**
 * Build a regex that matches a country name and all its aliases
 */
const countryRegex = (country) => {
    const escaped = country.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const aliases = COUNTRY_ALIASES[country] || [];
    const allNames = [escaped, ...aliases.map(a => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))];
    return new RegExp(`^(${allNames.join('|')})$`, 'i');
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Crawl through the entire CricAPI player database, saving all players to MongoDB.
 * The API returns 25 players per page. We paginate through everything.
 * Can be run as a background job. Resumes from the last known offset.
 * @param {object} options - { maxPages, startOffset, onProgress }
 */
const crawlAllPlayers = async (options = {}) => {
    const { maxPages = 100, startOffset = null, onProgress = null } = options;

    if (globalSyncState.isRunning) {
        console.log('[TeamSync] Global sync already running. Skipping.');
        return globalSyncState;
    }

    globalSyncState.isRunning = true;
    globalSyncState.startedAt = Date.now();
    globalSyncState.errors = [];

    // Resume from last offset or start from scratch
    let offset = startOffset !== null ? startOffset : globalSyncState.offset;
    let pagesFetched = 0;

    try {
        console.log(`[TeamSync] Starting global player crawl from offset ${offset}...`);

        for (let page = 0; page < maxPages; page++) {
            try {
                const data = await cricketApi.listPlayers(offset);
                const players = data.data || [];
                const totalRows = data.info?.totalRows || 0;
                globalSyncState.totalRows = totalRows;

                if (players.length === 0) {
                    console.log(`[TeamSync] No more players at offset ${offset}. Crawl complete.`);
                    globalSyncState.offset = 0; // Reset for next full crawl
                    globalSyncState.lastSyncAt = Date.now();
                    break;
                }

                // Bulk save players to MongoDB
                const bulkOps = players.map(p => ({
                    updateOne: {
                        filter: { apiId: p.id },
                        update: {
                            $set: {
                                apiId: p.id,
                                name: p.name || 'Unknown',
                                country: p.country || 'Unknown',
                                image: p.playerImg || '',
                                source: 'api'
                            },
                            $setOnInsert: {
                                role: 'Unknown',
                                stats: {},
                                createdAt: new Date()
                            }
                        },
                        upsert: true
                    }
                }));

                if (bulkOps.length > 0) {
                    await Player.bulkWrite(bulkOps, { ordered: false });
                    globalSyncState.playersSaved += players.length;
                }

                offset += 25;
                globalSyncState.offset = offset;
                pagesFetched++;

                if (onProgress) {
                    onProgress({
                        offset,
                        totalRows,
                        pagesFetched,
                        playersSaved: globalSyncState.playersSaved
                    });
                }

                // Log progress every 10 pages
                if (pagesFetched % 10 === 0) {
                    console.log(`[TeamSync] Crawled ${pagesFetched} pages, offset ${offset}/${totalRows}, ${globalSyncState.playersSaved} players saved`);
                }

                if (offset >= totalRows) {
                    console.log(`[TeamSync] Reached end of player list. Total: ${totalRows}`);
                    globalSyncState.offset = 0;
                    globalSyncState.lastSyncAt = Date.now();
                    break;
                }

                // Delay between calls to avoid rate limits
                await sleep(DELAY_BETWEEN_PAGES);

            } catch (err) {
                const msg = err.message || '';
                if (msg.includes('hits') || msg.includes('limit') || msg.includes('Block')) {
                    console.log(`[TeamSync] Rate limit hit at offset ${offset}. Pausing crawl. Will resume later.`);
                    globalSyncState.errors.push({ offset, error: 'Rate limited', time: Date.now() });
                    break; // Stop but don't reset offset — we'll resume here next time
                }
                console.error(`[TeamSync] Error at offset ${offset}:`, msg);
                globalSyncState.errors.push({ offset, error: msg, time: Date.now() });
                offset += 25; // Skip this page and continue
                globalSyncState.offset = offset;
                await sleep(3000); // Extra delay after error
            }
        }

        console.log(`[TeamSync] Crawl batch done. ${pagesFetched} pages, ${globalSyncState.playersSaved} total players saved.`);
    } finally {
        globalSyncState.isRunning = false;
    }

    return globalSyncState;
};

/**
 * Get all players for a team from MongoDB.
 */
const getTeamPlayers = async (country) => {
    const regex = countryRegex(country);
    const players = await Player.find({ country: regex }).sort({ name: 1 });

    if (players.length > 0) {
        return {
            players,
            total: players.length,
            fromCache: true,
            lastSynced: globalSyncState.lastSyncAt ? new Date(globalSyncState.lastSyncAt) : null
        };
    }

    // No players in DB for this country — check if sync is running
    return {
        players: [],
        total: 0,
        fromCache: false,
        syncing: globalSyncState.isRunning,
        message: globalSyncState.isRunning
            ? `Player database is being built from the live API (${Math.round((globalSyncState.offset / Math.max(globalSyncState.totalRows, 1)) * 100)}% complete). Please check back in a moment.`
            : 'No players found for this team yet. Start a global sync to fetch all players.'
    };
};

/**
 * Fetch detailed info for a specific team's players (roles, stats, batting/bowling style).
 * This calls /players_info for each player that lacks details.
 */
const syncTeamDetails = async (country, maxPlayers = 30) => {
    const regex = countryRegex(country);
    const players = await Player.find({
        country: regex,
        source: 'api',
        $or: [
            { lastSynced: null },
            { role: 'Unknown' },
            { lastSynced: { $lt: new Date(Date.now() - GLOBAL_CACHE_DURATION) } }
        ]
    }).limit(maxPlayers);

    let synced = 0;
    for (const player of players) {
        try {
            await syncPlayerFromApi(player.apiId);
            synced++;
        } catch (err) {
            if (err.message && (err.message.includes('hits') || err.message.includes('limit') || err.message.includes('Block'))) {
                console.log(`[TeamSync] Rate limit hit after syncing ${synced} player details. Stopping.`);
                break;
            }
        }
    }
    return { synced, total: players.length };
};

/**
 * Get sync progress status
 */
const getSyncStatus = () => ({
    ...globalSyncState,
    progress: globalSyncState.totalRows > 0
        ? Math.round((globalSyncState.offset / globalSyncState.totalRows) * 100)
        : 0
});

module.exports = {
    crawlAllPlayers,
    getTeamPlayers,
    syncTeamDetails,
    getSyncStatus,
    INTERNATIONAL_TEAMS,
    COUNTRY_ALIASES,
    ALIAS_TO_CANONICAL,
    countryRegex
};
