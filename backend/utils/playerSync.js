const Player = require('../models/Player');
const cricketApi = require('./cricketApi');
const { broadcast } = require('./sseManager');
const cache = require('../config/cache');

const parseNumber = (val) => {
    if (val === undefined || val === null || val === '' || val === '-') return 0;
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
};

const buildFormatStats = (statsArray, matchType) => {
    if (!statsArray || !Array.isArray(statsArray)) return {};

    const getStat = (fn, stat) => {
        const entry = statsArray.find(s => s.fn === fn && s.matchtype === matchType && s.stat === stat);
        return entry ? entry.value : null;
    };

    return {
        matches: parseNumber(getStat('batting', 'm') || getStat('bowling', 'm')),
        innings: parseNumber(getStat('batting', 'inn')),
        runs: parseNumber(getStat('batting', 'runs')),
        average: parseNumber(getStat('batting', 'avg')),
        strikeRate: parseNumber(getStat('batting', 'sr')),
        hundreds: parseNumber(getStat('batting', '100s')),
        fifties: parseNumber(getStat('batting', '50s')),
        bestBatting: getStat('batting', 'hs') || '',
        wickets: parseNumber(getStat('bowling', 'wkts')),
        bowlingAvg: parseNumber(getStat('bowling', 'avg')),
        economy: parseNumber(getStat('bowling', 'econ')),
        bestBowling: getStat('bowling', 'bbm') || getStat('bowling', 'bbi') || ''
    };
};

const mapPlayerData = (apiPlayer, detailedData = null) => {
    const mapped = {
        apiId: apiPlayer.id,
        name: apiPlayer.name || 'Unknown',
        country: apiPlayer.country || 'Unknown',
        gender: (apiPlayer.gender || 'unknown').toLowerCase(),
        image: apiPlayer.playerImg || '',
        dateOfBirth: apiPlayer.dateOfBirth || '',
        placeOfBirth: apiPlayer.placeOfBirth || '',
        source: 'api',
        lastSynced: new Date()
    };

    if (detailedData) {
        mapped.role = detailedData.role || 'Unknown';
        mapped.battingStyle = detailedData.battingStyle || '';
        mapped.bowlingStyle = detailedData.bowlingStyle || '';
        // Re-check gender from detailed data (more reliable than list endpoint)
        if (detailedData.gender) {
            mapped.gender = detailedData.gender.toLowerCase();
        }

        if (detailedData.stats && Array.isArray(detailedData.stats) && detailedData.stats.length > 0) {
            mapped.detailedStats = {
                test: buildFormatStats(detailedData.stats, 'test'),
                odi: buildFormatStats(detailedData.stats, 'odi'),
                t20i: buildFormatStats(detailedData.stats, 't20i'),
                ipl: buildFormatStats(detailedData.stats, 'ipl')
            };

            let totalMatches = 0, totalRuns = 0, totalWickets = 0;
            let bestAvg = 0, bestSR = 0, bestEcon = 0;
            let hasEcon = false;

            ['test', 'odi', 't20i', 'ipl'].forEach(f => {
                const fs = mapped.detailedStats[f];
                if (fs && fs.matches > 0) {
                    totalMatches += fs.matches;
                    totalRuns += fs.runs;
                    totalWickets += fs.wickets;
                    if (fs.average > bestAvg) bestAvg = fs.average;
                    if (fs.strikeRate > bestSR) bestSR = fs.strikeRate;
                    if (fs.economy > 0) { bestEcon = bestEcon > 0 ? Math.min(bestEcon, fs.economy) : fs.economy; hasEcon = true; }
                }
            });

            mapped.stats = {
                matches: totalMatches,
                runs: totalRuns,
                wickets: totalWickets,
                average: bestAvg,
                strikeRate: bestSR,
                economy: hasEcon ? bestEcon : 0
            };
        }
    }

    return mapped;
};

const syncPlayerFromApi = async (playerApiId) => {
    try {
        const data = await cricketApi.getPlayerInfo(playerApiId);
        const detailed = data.data;
        if (!detailed) return null;

        const mapped = mapPlayerData(detailed, detailed);

        const player = await Player.findOneAndUpdate(
            { apiId: playerApiId },
            mapped,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Invalidate cached player detail in Valkey
        await cache.del(`cric:players:detail:${playerApiId}`);

        // Broadcast individual player update
        broadcast(`player:${playerApiId}`, 'player:update', player);

        return player;
    } catch (error) {
        // Re-throw rate limit errors so callers can stop
        if (error.message && (error.message.includes('hits') || error.message.includes('limit') || error.message.includes('Block'))) {
            throw error;
        }
        console.error(`Error syncing player ${playerApiId}:`, error.message);
        return null;
    }
};

module.exports = { syncPlayerFromApi };
