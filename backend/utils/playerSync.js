const Player = require('../models/Player');
const cricketApi = require('./cricketApi');

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

        return player;
    } catch (error) {
        console.error(`Error syncing player ${playerApiId}:`, error.message);
        return null;
    }
};

const searchAndSyncPlayers = async (searchTerm) => {
    try {
        const data = await cricketApi.searchPlayers(searchTerm);
        const apiPlayers = data.data || [];

        const results = [];
        for (const ap of apiPlayers.slice(0, 10)) {
            let existing = await Player.findOne({ apiId: ap.id });

            if (!existing || !existing.lastSynced || (Date.now() - existing.lastSynced.getTime() > 24 * 60 * 60 * 1000)) {
                const synced = await syncPlayerFromApi(ap.id);
                if (synced) {
                    results.push(synced);
                    continue;
                }
            }

            if (existing) {
                results.push(existing);
            } else {
                const basic = mapPlayerData(ap);
                const player = await Player.findOneAndUpdate(
                    { apiId: ap.id },
                    basic,
                    { upsert: true, new: true, setDefaultsOnInsert: true }
                );
                results.push(player);
            }
        }

        return results;
    } catch (error) {
        console.error('Error in searchAndSyncPlayers:', error.message);
        throw error;
    }
};

const POPULAR_SEARCHES = [
    'Virat Kohli', 'Rohit Sharma', 'Jasprit Bumrah', 'Babar Azam',
    'Joe Root', 'Kane Williamson', 'Steve Smith', 'Pat Cummins',
    'Ben Stokes', 'Kagiso Rabada', 'Rashid Khan', 'Shakib Al Hasan',
    'Quinton de Kock', 'Rishabh Pant', 'KL Rahul', 'Ravindra Jadeja',
    'Mitchell Starc', 'Trent Boult', 'Shaheen Afridi', 'Mohammad Rizwan',
    'David Warner', 'Travis Head', 'Suryakumar Yadav', 'Shubman Gill',
    'Hardik Pandya', 'Mohammed Siraj', 'Kuldeep Yadav', 'Axar Patel',
    'Josh Hazlewood', 'Nathan Lyon', 'Marco Jansen', 'Rassie van der Dussen',
    'Devon Conway', 'Daryl Mitchell', 'Tim Southee', 'Marnus Labuschagne',
    'Shreyas Iyer', 'Ishan Kishan', 'Yashasvi Jaiswal', 'Rachin Ravindra',
    'Glenn Maxwell', 'Mitchell Marsh', 'Adam Zampa', 'Cameron Green',
    'Fakhar Zaman', 'Haris Rauf', 'Imam ul Haq', 'Naseem Shah',
    'Towhid Hridoy', 'Mustafizur Rahman', 'Wanindu Hasaranga', 'Pathum Nissanka',
    'Aiden Markram', 'Heinrich Klaasen', 'Anrich Nortje', 'Lungi Ngidi',
    'Harry Brook', 'Mark Wood', 'Jonny Bairstow', 'Jos Buttler'
];

const bulkSyncPlayers = async (onProgress = null) => {
    await Player.deleteMany({ source: { $ne: 'api' } });
    
    let synced = 0;
    let failed = 0;
    const total = POPULAR_SEARCHES.length;

    for (const name of POPULAR_SEARCHES) {
        try {
            const data = await cricketApi.searchPlayers(name);
            const apiPlayers = data.data || [];

            if (apiPlayers.length > 0) {
                const bestMatch = apiPlayers.find(p => 
                    p.name.toLowerCase() === name.toLowerCase()
                ) || apiPlayers[0];

                const existing = await Player.findOne({ apiId: bestMatch.id });
                if (!existing || !existing.lastSynced || (Date.now() - existing.lastSynced.getTime() > 24 * 60 * 60 * 1000)) {
                    const result = await syncPlayerFromApi(bestMatch.id);
                    if (result) {
                        synced++;
                    } else {
                        failed++;
                    }
                } else {
                    synced++;
                }
            } else {
                failed++;
            }
        } catch (err) {
            console.error(`Bulk sync failed for "${name}":`, err.message);
            failed++;
        }

        if (onProgress) onProgress({ synced, failed, total, current: name });
    }

    return { synced, failed, total };
};

module.exports = { syncPlayerFromApi, searchAndSyncPlayers, mapPlayerData, bulkSyncPlayers };
