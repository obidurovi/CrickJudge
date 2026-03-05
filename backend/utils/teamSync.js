const Player = require('../models/Player');
const cricketApi = require('./cricketApi');
const { syncPlayerFromApi, mapPlayerData } = require('./playerSync');

// How long before we re-sync a team's roster from the API
const TEAM_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// In-memory tracking of which teams are currently being synced (prevent duplicates)
const syncInProgress = new Map();

// Track when each team was last synced
const teamSyncTimestamps = new Map();

/**
 * Fetch all players for a country from the CricAPI, save basic info to MongoDB,
 * and optionally fetch detailed stats for each player.
 * 
 * @param {string} country - Country name
 * @param {object} options - { fetchDetails: boolean, maxDetailFetches: number }
 * @returns {{ players: Array, synced: number, total: number, fromCache: boolean }}
 */
const syncTeamFromApi = async (country, options = {}) => {
    const { fetchDetails = true, maxDetailFetches = 50 } = options;

    // Check if already syncing this team
    if (syncInProgress.has(country)) {
        return syncInProgress.get(country);
    }

    const syncPromise = (async () => {
        try {
            console.log(`[TeamSync] Starting sync for ${country}...`);

            // Step 1: Fetch all players from the API by country
            const apiPlayers = await cricketApi.fetchAllPlayersByCountry(country);
            console.log(`[TeamSync] Found ${apiPlayers.length} players for ${country} from API`);

            if (apiPlayers.length === 0) {
                return { players: [], synced: 0, total: 0, fromCache: false };
            }

            // Step 2: Save basic info for all players to MongoDB
            const savedPlayers = [];
            const apiIds = apiPlayers.map(p => p.id);
            const existingPlayers = await Player.find({ apiId: { $in: apiIds } });
            const existingMap = new Map(existingPlayers.map(p => [p.apiId, p]));

            for (const ap of apiPlayers) {
                const existing = existingMap.get(ap.id);

                if (existing && existing.lastSynced && (Date.now() - existing.lastSynced.getTime() < TEAM_CACHE_DURATION)) {
                    // Already synced recently, skip
                    savedPlayers.push(existing);
                    continue;
                }

                // Save basic info
                try {
                    const basicData = {
                        apiId: ap.id,
                        name: ap.name || 'Unknown',
                        country: ap.country || country,
                        image: ap.playerImg || (existing ? existing.image : ''),
                        source: 'api'
                    };

                    // Preserve existing detailed data if we have it
                    if (existing && existing.role && existing.role !== 'Unknown') {
                        basicData.role = existing.role;
                        basicData.battingStyle = existing.battingStyle;
                        basicData.bowlingStyle = existing.bowlingStyle;
                    }

                    const player = await Player.findOneAndUpdate(
                        { apiId: ap.id },
                        { $set: basicData },
                        { upsert: true, new: true, setDefaultsOnInsert: true }
                    );
                    savedPlayers.push(player);
                } catch (dbErr) {
                    console.error(`[TeamSync] Error saving ${ap.name}:`, dbErr.message);
                }
            }

            // Step 3: Fetch detailed stats for players that don't have them yet
            let detailsSynced = 0;
            if (fetchDetails) {
                const needDetails = savedPlayers.filter(p =>
                    !p.lastSynced || !p.role || p.role === 'Unknown' ||
                    (Date.now() - (p.lastSynced?.getTime() || 0) > TEAM_CACHE_DURATION)
                );

                const toSync = needDetails.slice(0, maxDetailFetches);
                console.log(`[TeamSync] Fetching details for ${toSync.length} of ${needDetails.length} players needing update`);

                for (const player of toSync) {
                    try {
                        const synced = await syncPlayerFromApi(player.apiId);
                        if (synced) {
                            // Replace in savedPlayers array
                            const idx = savedPlayers.findIndex(p => p.apiId === player.apiId);
                            if (idx !== -1) savedPlayers[idx] = synced;
                            detailsSynced++;
                        }
                    } catch (detailErr) {
                        // API rate limit hit — stop trying details
                        if (detailErr.message && (detailErr.message.includes('hits') || detailErr.message.includes('limit') || detailErr.message.includes('Block'))) {
                            console.log(`[TeamSync] API rate limit hit after ${detailsSynced} detail fetches. Stopping.`);
                            break;
                        }
                        console.error(`[TeamSync] Error fetching details for ${player.name}:`, detailErr.message);
                    }
                }
            }

            teamSyncTimestamps.set(country, Date.now());
            console.log(`[TeamSync] Completed ${country}: ${savedPlayers.length} total, ${detailsSynced} details synced`);

            return {
                players: savedPlayers,
                synced: detailsSynced,
                total: savedPlayers.length,
                fromCache: false
            };
        } catch (error) {
            console.error(`[TeamSync] Error syncing ${country}:`, error.message);
            throw error;
        } finally {
            syncInProgress.delete(country);
        }
    })();

    syncInProgress.set(country, syncPromise);
    return syncPromise;
};

/**
 * Get players for a team — serves from DB cache if fresh, otherwise syncs from API.
 */
const getTeamPlayers = async (country) => {
    // Check if we have fresh cached data
    const regex = new RegExp(`^${country.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
    const cachedPlayers = await Player.find({ country: regex, source: 'api' }).sort({ name: 1 });
    const lastSync = teamSyncTimestamps.get(country);

    // If we have cached data and it's fresh enough, return it
    if (cachedPlayers.length > 0 && lastSync && (Date.now() - lastSync < TEAM_CACHE_DURATION)) {
        return {
            players: cachedPlayers,
            total: cachedPlayers.length,
            fromCache: true,
            lastSynced: new Date(lastSync)
        };
    }

    // If we have cached data but it might be stale, return cached AND trigger background sync
    if (cachedPlayers.length > 0) {
        // Trigger background sync (don't await)
        syncTeamFromApi(country, { fetchDetails: true, maxDetailFetches: 30 }).catch(err => {
            console.error(`[TeamSync] Background sync failed for ${country}:`, err.message);
        });

        return {
            players: cachedPlayers,
            total: cachedPlayers.length,
            fromCache: true,
            syncing: true,
            lastSynced: lastSync ? new Date(lastSync) : null
        };
    }

    // No cache — must sync now
    try {
        const result = await syncTeamFromApi(country, { fetchDetails: true, maxDetailFetches: 30 });
        return {
            players: result.players,
            total: result.total,
            fromCache: false,
            lastSynced: new Date()
        };
    } catch (error) {
        // Final fallback: return whatever is in DB even if stale
        const anyPlayers = await Player.find({ country: regex }).sort({ name: 1 });
        if (anyPlayers.length > 0) {
            return {
                players: anyPlayers,
                total: anyPlayers.length,
                fromCache: true,
                stale: true,
                error: error.message
            };
        }
        throw error;
    }
};

/**
 * Sync all international teams (can be called on server start or via API)
 */
const INTERNATIONAL_TEAMS = [
    'India', 'Australia', 'England', 'South Africa', 'New Zealand',
    'Pakistan', 'Sri Lanka', 'Bangladesh', 'West Indies', 'Zimbabwe',
    'Afghanistan', 'Ireland', 'Netherlands', 'Scotland', 'Nepal',
    'USA', 'UAE', 'Oman', 'Namibia', 'Canada',
    'Papua New Guinea', 'Uganda', 'Kenya', 'Hong Kong'
];

const syncAllTeams = async (onProgress = null) => {
    const results = {};
    let completed = 0;

    for (const team of INTERNATIONAL_TEAMS) {
        try {
            // Only fetch basic info for bulk sync to conserve API hits
            const result = await syncTeamFromApi(team, { fetchDetails: false });
            results[team] = { success: true, count: result.total };
        } catch (err) {
            results[team] = { success: false, error: err.message };
            // If rate limited, stop
            if (err.message && (err.message.includes('hits') || err.message.includes('limit') || err.message.includes('Block'))) {
                console.log(`[TeamSync] Rate limit hit during bulk sync at ${team}. Stopping.`);
                break;
            }
        }
        completed++;
        if (onProgress) onProgress({ team, completed, total: INTERNATIONAL_TEAMS.length, results });
    }

    return results;
};

module.exports = {
    syncTeamFromApi,
    getTeamPlayers,
    syncAllTeams,
    INTERNATIONAL_TEAMS
};
