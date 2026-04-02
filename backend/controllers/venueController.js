const Venue = require('../models/Venue');
const Player = require('../models/Player');
const mongoose = require('mongoose');
const cache = require('../config/cache');
const cricketApi = require('../utils/cricketApi');
const { seedVenuesInDb } = require('../utils/venueSeeder');
const { syncPlayerFromApi } = require('../utils/playerSync');
const { getRuntimeMode } = require('../config/runtimeMode');
const {
    normalizeFormatKey,
    extractPlayerVenueEvidence,
    buildVenuePlayerCrossAnalysis
} = require('../utils/venuePlayerCrossAnalysis');

const escapeRegex = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const readLiveMatchesForCrossAnalysis = async () => {
    const cacheKey = 'cric:matches:live';
    const staleKey = 'cric:matches:live:stale';

    const cached = await cache.getJSON(cacheKey);
    if (cached?.data) {
        return {
            matches: cached.data,
            notice: cached._notice || null
        };
    }

    try {
        const data = await cricketApi.getCurrentMatches();
        await cache.setJSON(cacheKey, data, 30);
        await cache.setJSON(staleKey, data, 6 * 60 * 60);
        return {
            matches: data?.data || [],
            notice: null
        };
    } catch (error) {
        if (error.message === 'API_TEMP_BLOCKED') {
            const stale = await cache.getJSON(staleKey);
            if (stale?.data) {
                return {
                    matches: stale.data,
                    notice: 'Using cached live matches while CricAPI cooldown is active.'
                };
            }

            return {
                matches: [],
                notice: 'CricAPI cooldown active. No cached live matches available yet.'
            };
        }
        throw error;
    }
};

const readScorecardForCrossAnalysis = async (matchId, allowNetwork) => {
    const cacheKey = `cric:matches:scorecard:${matchId}`;
    const staleKey = `cric:matches:scorecard:${matchId}:stale`;

    const cached = await cache.getJSON(cacheKey);
    if (cached) return cached;

    const stale = await cache.getJSON(staleKey);
    if (!allowNetwork) return stale;

    try {
        const data = await cricketApi.getMatchScorecard(matchId);
        await cache.setJSON(cacheKey, data, 30);
        await cache.setJSON(staleKey, data, 6 * 60 * 60);
        return data;
    } catch (error) {
        if (error.message === 'API_TEMP_BLOCKED') {
            return stale;
        }
        return stale;
    }
};

const findVenue = async ({ venueId, venueName }) => {
    if (venueId) {
        const byId = await Venue.findOne({ id: venueId });
        if (byId) return byId;

        if (mongoose.Types.ObjectId.isValid(venueId)) {
            const byObjectId = await Venue.findById(venueId);
            if (byObjectId) return byObjectId;
        }
    }

    if (venueName) {
        const byName = await Venue.findOne({
            name: { $regex: new RegExp(escapeRegex(venueName), 'i') }
        });
        if (byName) return byName;
    }

    return Venue.findOne({});
};

const findPlayer = async (playerId) => {
    if (!playerId) return null;

    const byApi = await Player.findOne({ apiId: playerId });
    if (byApi) return byApi;

    if (mongoose.Types.ObjectId.isValid(playerId)) {
        const byObjectId = await Player.findById(playerId);
        if (byObjectId) return byObjectId;
    }

    return null;
};

const getVenues = async (req, res) => {
    try {
        // Check Valkey cache (venues are static, long TTL)
        const cacheKey = 'cric:venues:all';
        const cached = await cache.getJSON(cacheKey);
        if (cached) return res.json(cached);

        const venues = await Venue.find({});
        // Cache for 1 hour (venues rarely change)
        await cache.setJSON(cacheKey, venues, 3600);
        res.json(venues);
    } catch (error) {
        console.error("Error fetching venues:", error);
        res.status(500).json({ message: error.message });
    }
};

const seedVenues = async (req, res) => {
    try {
        const adminSeedKey = process.env.ADMIN_SEED_KEY;
        if (!adminSeedKey) {
            return res.status(503).json({ message: 'ADMIN_SEED_KEY is not configured on the server' });
        }

        const providedKey = req.headers['x-admin-seed-key'];
        if (providedKey !== adminSeedKey) {
            return res.status(401).json({ message: 'Unauthorized: invalid admin seed key' });
        }

        const rawReplace = req.body?.replaceExisting ?? req.query?.replaceExisting;
        const replaceExisting = rawReplace === true || rawReplace === 'true' || rawReplace === '1';

        const result = await seedVenuesInDb({ replaceExisting });
        return res.json({
            message: 'Venue seeding completed',
            ...result
        });
    } catch (error) {
        console.error('Error seeding venues:', error);
        return res.status(500).json({ message: error.message });
    }
};

const getVenuePlayerCrossAnalysis = async (req, res) => {
    try {
        const playerId = String(req.query.playerId || req.query.player || '').trim();
        const venueId = String(req.query.venueId || '').trim();
        const venueName = String(req.query.venueName || '').trim();
        const format = normalizeFormatKey(req.query.format || 'overall');

        if (!playerId) {
            return res.status(400).json({ message: 'playerId is required' });
        }

        const venue = await findVenue({ venueId, venueName });
        if (!venue) {
            return res.status(404).json({ message: 'No venue data available. Seed venues first.' });
        }

        let player = await findPlayer(playerId);
        if (!player && !mongoose.Types.ObjectId.isValid(playerId)) {
            try {
                player = await syncPlayerFromApi(playerId);
            } catch {
                player = null;
            }
        }

        if (!player) {
            return res.status(404).json({
                message: 'Player not found in cache and live player sync is unavailable right now.'
            });
        }

        const runtimeMode = getRuntimeMode();
        const playerKey = String(player.apiId || player._id || playerId);
        const venueKey = String(venue.id || venue._id || 'unknown');
        const cacheKey = `cric:venues:player-cross:${playerKey}:${venueKey}:${format}:${runtimeMode.freeTierMode ? 'free' : 'full'}`;
        const cached = await cache.getJSON(cacheKey);
        if (cached) {
            return res.json(cached);
        }

        const { matches, notice } = await readLiveMatchesForCrossAnalysis();
        const orderedMatches = [...(Array.isArray(matches) ? matches : [])]
            .filter((match) => match?.id)
            .sort((a, b) => {
                const aDate = Date.parse(a?.dateTimeGMT || a?.date || '') || 0;
                const bDate = Date.parse(b?.dateTimeGMT || b?.date || '') || 0;
                return bDate - aDate;
            });

        const scopedMatches = orderedMatches.slice(0, runtimeMode.freeTierMode ? 12 : 30);
        const maxNetworkFetches = runtimeMode.freeTierMode
            ? Math.min(3, scopedMatches.length)
            : Math.min(12, scopedMatches.length);

        const scorecards = await Promise.all(scopedMatches.map(async (match, index) => {
            const matchId = String(match.id);
            const allowNetwork = index < maxNetworkFetches;
            const payload = await readScorecardForCrossAnalysis(matchId, allowNetwork);
            return { matchId, payload };
        }));

        const scorecardsByMatchId = new Map(
            scorecards
                .filter((entry) => !!entry.payload)
                .map((entry) => [entry.matchId, entry.payload])
        );

        const directRecord = extractPlayerVenueEvidence({
            playerName: player.name,
            venue,
            matches: scopedMatches,
            scorecardsByMatchId
        });

        const analysis = buildVenuePlayerCrossAnalysis({
            player,
            venue,
            formatKey: format,
            directRecord
        });

        const response = {
            status: 'success',
            player: {
                id: String(player.apiId || player._id),
                apiId: player.apiId || null,
                name: player.name,
                country: player.country,
                role: player.role || 'Unknown',
                battingStyle: player.battingStyle || '',
                bowlingStyle: player.bowlingStyle || ''
            },
            venue: {
                id: venue.id,
                name: venue.name,
                location: venue.location,
                paceSpin: venue.paceSpin,
                avgScores: venue.avgScores,
                battingAdvantage: venue.battingAdvantage
            },
            format: analysis.format,
            analysis,
            evidenceCoverage: {
                matchesScanned: scopedMatches.length,
                scorecardsResolved: scorecardsByMatchId.size,
                directVenueMatches: directRecord.matches
            },
            freeTierMode: runtimeMode.freeTierMode,
            generatedAt: new Date().toISOString(),
            _notice: [
                notice,
                runtimeMode.freeTierMode
                    ? `Free Tier Mode ON: using cache + up to ${maxNetworkFetches} scorecard fetches per request.`
                    : null,
                scorecardsByMatchId.size === 0
                    ? 'No scorecards available right now; projections rely on player and venue baselines.'
                    : null
            ].filter(Boolean).join(' | ') || null
        };

        await cache.setJSON(cacheKey, response, 60);
        return res.json(response);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = { getVenues, seedVenues, getVenuePlayerCrossAnalysis };
