import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import useSSE from '../hooks/useSSE';

const API_BASE = 'http://localhost:5000/api';

const ANALYSIS_FORMATS = [
    { key: 'overall', label: 'Overall' },
    { key: 'test', label: 'Test' },
    { key: 'odi', label: 'ODI' },
    { key: 't20', label: 'T20' }
];

const MAX_COMPARE_PLAYERS = 6;

const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const asFixed = (value, digits = 1) => toNumber(value, 0).toFixed(digits);

const impactClass = (impact) => {
    if (impact > 2) return 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10';
    if (impact < -2) return 'text-rose-300 border-rose-500/30 bg-rose-500/10';
    return 'text-slate-300 border-slate-500/30 bg-slate-500/10';
};

const fitBandClass = (fitBand) => {
    if (fitBand === 'Elite Fit') return 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10';
    if (fitBand === 'Strong Fit') return 'text-blue-300 border-blue-500/30 bg-blue-500/10';
    if (fitBand === 'Balanced Fit') return 'text-amber-300 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-300 border-rose-500/30 bg-rose-500/10';
};

const metricTextClass = (value) => {
    const num = toNumber(value, 0);
    if (num >= 75) return 'text-emerald-300';
    if (num >= 55) return 'text-blue-300';
    if (num >= 40) return 'text-amber-300';
    return 'text-rose-300';
};

const metricBadgeClass = (value) => {
    const num = toNumber(value, 0);
    if (num >= 75) return 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10';
    if (num >= 55) return 'text-blue-300 border-blue-500/30 bg-blue-500/10';
    if (num >= 40) return 'text-amber-300 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-300 border-rose-500/30 bg-rose-500/10';
};

const metricBandLabel = (value) => {
    const num = toNumber(value, 0);
    if (num >= 75) return 'High';
    if (num >= 55) return 'Strong';
    if (num >= 40) return 'Balanced';
    return 'Low';
};

const buildVenueFallbackImage = (venueName = 'Cricket Stadium') => {
        const safeName = String(venueName || 'Cricket Stadium')
                .replace(/[&<>]/g, '')
                .slice(0, 36);

        const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="820" viewBox="0 0 1400 820">
    <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0f172a" />
            <stop offset="100%" stop-color="#1d4ed8" />
        </linearGradient>
    </defs>
    <rect width="1400" height="820" fill="url(#g)" />
    <circle cx="220" cy="130" r="180" fill="#38bdf8" fill-opacity="0.18" />
    <circle cx="1180" cy="720" r="210" fill="#22d3ee" fill-opacity="0.12" />
    <text x="700" y="380" fill="#e2e8f0" font-size="58" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-weight="700">${safeName}</text>
    <text x="700" y="440" fill="#94a3b8" font-size="28" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif">Stadium Image Unavailable</text>
</svg>`;

        return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const playerIdentifier = (player) => String(player?.apiId || player?._id || player?.id || '').trim();

const VenueIntelligence = () => {
    const [venues, setVenues] = useState([]);
    const [selectedVenue, setSelectedVenue] = useState(null);
    const [venueQuery, setVenueQuery] = useState('');
    const [venueImageBroken, setVenueImageBroken] = useState(false);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);
    const [adminSeedKey, setAdminSeedKey] = useState('');
    const [replaceExisting, setReplaceExisting] = useState(false);
    const [seedStatus, setSeedStatus] = useState(null);
    const [playerQuery, setPlayerQuery] = useState('');
    const [playerOptions, setPlayerOptions] = useState([]);
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    const [searchingPlayers, setSearchingPlayers] = useState(false);
    const [analysisFormat, setAnalysisFormat] = useState('overall');
    const [analysisLoading, setAnalysisLoading] = useState(false);
    const [analysisError, setAnalysisError] = useState('');
    const [crossAnalysis, setCrossAnalysis] = useState(null);
    const [copyStatus, setCopyStatus] = useState('');
    const [comparePlayers, setComparePlayers] = useState([]);
    const [compareResults, setCompareResults] = useState([]);
    const [compareLoading, setCompareLoading] = useState(false);
    const [compareError, setCompareError] = useState('');
    const [compareStatus, setCompareStatus] = useState('');
    const [compareSortBy, setCompareSortBy] = useState('fit');

    const fetchVenues = useCallback(async () => {
        try {
            const { data } = await axios.get(`${API_BASE}/venues`);
            setVenues(data);
            setSelectedVenue(prev => {
                if (data.length === 0) return null;
                if (!prev) return data[0];
                return data.find(v => v.id === prev.id) || data[0];
            });
        } catch (error) {
            console.error("Error fetching venues", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVenues();
    }, [fetchVenues]);

    useEffect(() => {
        const query = playerQuery.trim();
        if (query.length < 2) {
            setPlayerOptions([]);
            setSearchingPlayers(false);
            return;
        }

        let active = true;
        const timer = setTimeout(async () => {
            setSearchingPlayers(true);
            try {
                const { data } = await axios.get(`${API_BASE}/players/search`, { params: { q: query } });
                if (!active) return;
                const list = Array.isArray(data?.players) ? data.players.slice(0, 8) : [];
                setPlayerOptions(list);
            } catch {
                if (!active) return;
                setPlayerOptions([]);
            } finally {
                if (active) setSearchingPlayers(false);
            }
        }, 280);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [playerQuery]);

    useEffect(() => {
        setCompareResults([]);
        setCompareError('');
        setCompareStatus('');
    }, [analysisFormat, selectedVenue?.id]);

    useEffect(() => {
        setVenueImageBroken(false);
    }, [selectedVenue?.id]);

    const selectPlayer = (player) => {
        setSelectedPlayer(player);
        setPlayerQuery(player?.name || '');
        setPlayerOptions([]);
        setAnalysisError('');
    };

    const addSelectedToCompare = () => {
        if (!selectedPlayer) {
            setCompareError('Select a player first, then add to compare.');
            return;
        }

        const id = playerIdentifier(selectedPlayer);
        if (!id) {
            setCompareError('This player does not have a usable identifier yet.');
            return;
        }

        setCompareError('');
        setCompareStatus('');

        setComparePlayers((prev) => {
            if (prev.some((player) => player.id === id)) {
                setCompareStatus('Player already exists in compare shortlist.');
                return prev;
            }

            if (prev.length >= MAX_COMPARE_PLAYERS) {
                setCompareStatus(`Maximum ${MAX_COMPARE_PLAYERS} players allowed in compare mode.`);
                return prev;
            }

            const next = [
                ...prev,
                {
                    id,
                    apiId: selectedPlayer?.apiId || null,
                    name: selectedPlayer?.name || 'Unknown',
                    country: selectedPlayer?.country || 'Unknown',
                    role: selectedPlayer?.role || 'Unknown'
                }
            ];
            return next;
        });
    };

    const removeComparePlayer = (id) => {
        setComparePlayers((prev) => prev.filter((player) => player.id !== id));
    };

    const clearCompare = () => {
        setComparePlayers([]);
        setCompareResults([]);
        setCompareError('');
        setCompareStatus('');
    };

    const runCrossAnalysis = useCallback(async () => {
        const playerId = selectedPlayer?.apiId || selectedPlayer?._id;
        if (!playerId || !selectedVenue?.id) {
            setAnalysisError('Choose a player and venue before running analysis.');
            return;
        }

        try {
            setAnalysisLoading(true);
            setAnalysisError('');

            const { data } = await axios.get(`${API_BASE}/venues/player-cross-analysis`, {
                params: {
                    playerId,
                    venueId: selectedVenue.id,
                    format: analysisFormat
                }
            });

            setCrossAnalysis(data);
        } catch (error) {
            const message = error?.response?.data?.message || 'Unable to run venue-player cross analysis';
            setAnalysisError(message);
            setCrossAnalysis(null);
        } finally {
            setAnalysisLoading(false);
        }
    }, [analysisFormat, selectedPlayer, selectedVenue]);

    const runCompareAnalysis = useCallback(async () => {
        if (!selectedVenue?.id) {
            setCompareError('Select a venue before running compare analysis.');
            return;
        }

        if (!comparePlayers.length) {
            setCompareError('Add at least one player to the compare shortlist.');
            return;
        }

        try {
            setCompareLoading(true);
            setCompareError('');
            setCompareStatus('');

            const requests = comparePlayers.map(async (player) => {
                try {
                    const { data } = await axios.get(`${API_BASE}/venues/player-cross-analysis`, {
                        params: {
                            playerId: player.apiId || player.id,
                            venueId: selectedVenue.id,
                            format: analysisFormat
                        }
                    });
                    return { ok: true, data };
                } catch (error) {
                    return {
                        ok: false,
                        player,
                        message: error?.response?.data?.message || 'Failed to evaluate player'
                    };
                }
            });

            const settled = await Promise.all(requests);
            const successful = settled.filter((entry) => entry.ok).map((entry) => entry.data);
            const failed = settled.filter((entry) => !entry.ok);

            if (!successful.length) {
                setCompareError(failed[0]?.message || 'Compare analysis failed for all players.');
                setCompareResults([]);
                return;
            }

            if (failed.length > 0) {
                setCompareStatus(`${failed.length} player(s) could not be analyzed right now.`);
            }

            setCompareResults(successful);
        } finally {
            setCompareLoading(false);
        }
    }, [analysisFormat, comparePlayers, selectedVenue]);

    const copyCrossSummary = async () => {
        if (!crossAnalysis?.analysis) return;

        const analysis = crossAnalysis.analysis;
        const playerName = crossAnalysis?.player?.name || selectedPlayer?.name || 'Player';
        const venueName = crossAnalysis?.venue?.name || selectedVenue?.name || 'Venue';

        const summary = [
            `${playerName} at ${venueName} (${analysis.format?.label || analysisFormat.toUpperCase()})`,
            `Fit Score: ${asFixed(analysis.overallFitScore)} (${analysis.fitBand})`,
            `Confidence: ${asFixed(analysis.confidence)}%`,
            `Projected: ${asFixed(analysis?.expected?.battingRuns)} runs, ${asFixed(analysis?.expected?.wickets, 2)} wickets, Econ ${asFixed(analysis?.expected?.economy, 2)}`,
            `Role: ${analysis.recommendedRole}`,
            `Narrative: ${analysis.narrative}`
        ].join('\n');

        try {
            await navigator.clipboard.writeText(summary);
            setCopyStatus('Summary copied to clipboard.');
        } catch {
            setCopyStatus('Clipboard permission unavailable.');
        }
    };

    const exportCrossJson = () => {
        if (!crossAnalysis) return;

        const blob = new Blob([JSON.stringify(crossAnalysis, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'venue-player-cross-analysis.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const copyCompareSummary = async () => {
        if (!compareRows.length || !selectedVenue) return;

        const lines = [
            `Venue Compare Summary: ${selectedVenue.name} (${analysisFormat.toUpperCase()})`,
            ...compareRows.map((row, index) => `${index + 1}. ${row.player} | Fit ${asFixed(row.fit)} | Fantasy ${asFixed(row.fantasy)} | Runs ${asFixed(row.projectedRuns)} | Wkts ${asFixed(row.projectedWickets, 2)} | Econ ${asFixed(row.projectedEconomy, 2)}`)
        ];

        try {
            await navigator.clipboard.writeText(lines.join('\n'));
            setCopyStatus('Compare summary copied to clipboard.');
        } catch {
            setCopyStatus('Clipboard permission unavailable.');
        }
    };

    const exportCompareCsv = () => {
        if (!compareRows.length) return;

        const rows = [
            ['Rank', 'Player', 'Country', 'Role', 'FitBand', 'FitScore', 'Confidence', 'ProjectedRuns', 'ProjectedWickets', 'ProjectedEconomy', 'FantasyPoints']
        ];

        compareRows.forEach((row, index) => {
            rows.push([
                index + 1,
                row.player,
                row.country,
                row.role,
                row.fitBand,
                row.fit,
                row.confidence,
                row.projectedRuns,
                row.projectedWickets,
                row.projectedEconomy,
                row.fantasy
            ]);
        });

        const csv = rows
            .map((row) => row.map((value) => {
                const text = String(value ?? '');
                if (text.includes(',') || text.includes('"') || text.includes('\n')) {
                    return `"${text.replace(/"/g, '""')}"`;
                }
                return text;
            }).join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'venue-player-compare.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleSeedVenues = async () => {
        try {
            setSeeding(true);
            setSeedStatus(null);

            const headers = {};
            if (adminSeedKey.trim()) {
                headers['x-admin-seed-key'] = adminSeedKey.trim();
            }

            const { data } = await axios.post(
                `${API_BASE}/venues/admin/seed`,
                { replaceExisting },
                { headers }
            );
            await fetchVenues();
            setSeedStatus({
                type: 'success',
                message: data.replaced
                    ? `Seed complete (replace mode): removed ${data.removed}, inserted ${data.inserted}.`
                    : `Seed complete: ${data.totalSeedRows} rows (${data.inserted} inserted, ${data.updated} updated).`
            });
        } catch (error) {
            const message = error?.response?.data?.message || 'Failed to seed venues';
            setSeedStatus({ type: 'error', message });
        } finally {
            setSeeding(false);
        }
    };

    // SSE: connect to sync channel for live status indicator
    const sseHandlers = useMemo(() => ({}), []);
    const { connected: sseConnected } = useSSE('/sync', sseHandlers);

    const analysis = crossAnalysis?.analysis || null;

    const filteredVenues = useMemo(() => {
        const query = venueQuery.trim().toLowerCase();
        if (!query) return venues;

        return venues.filter((venue) => {
            const haystack = [
                venue?.name,
                venue?.location,
                venue?.city,
                venue?.country
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return haystack.includes(query);
        });
    }, [venueQuery, venues]);

    const compareRows = useMemo(() => {
        const rows = compareResults.map((entry) => {
            const itemAnalysis = entry?.analysis || {};
            const expected = itemAnalysis?.expected || {};

            return {
                id: String(entry?.player?.id || entry?.player?.apiId || entry?.player?.name || 'unknown-player'),
                player: entry?.player?.name || 'Unknown',
                country: entry?.player?.country || 'Unknown',
                role: itemAnalysis?.roleHint || entry?.player?.role || 'Unknown',
                fitBand: itemAnalysis?.fitBand || 'Balanced Fit',
                fit: toNumber(itemAnalysis?.overallFitScore, 0),
                confidence: toNumber(itemAnalysis?.confidence, 0),
                projectedRuns: toNumber(expected?.battingRuns, 0),
                projectedWickets: toNumber(expected?.wickets, 0),
                projectedEconomy: toNumber(expected?.economy, 0),
                fantasy: toNumber(expected?.fantasyPoints, 0),
                recommendation: itemAnalysis?.recommendedRole || ''
            };
        });

        const sorted = [...rows];
        if (compareSortBy === 'fantasy') {
            sorted.sort((a, b) => b.fantasy - a.fantasy || b.fit - a.fit);
        } else if (compareSortBy === 'runs') {
            sorted.sort((a, b) => b.projectedRuns - a.projectedRuns || b.fit - a.fit);
        } else if (compareSortBy === 'wickets') {
            sorted.sort((a, b) => b.projectedWickets - a.projectedWickets || b.fit - a.fit);
        } else if (compareSortBy === 'economy') {
            sorted.sort((a, b) => a.projectedEconomy - b.projectedEconomy || b.fit - a.fit);
        } else {
            sorted.sort((a, b) => b.fit - a.fit || b.fantasy - a.fantasy);
        }

        return sorted;
    }, [compareResults, compareSortBy]);

    const compareLeaders = useMemo(() => {
        if (!compareRows.length) {
            return {
                bestFit: null,
                bestFantasy: null,
                bestBowling: null,
                bestBatting: null
            };
        }

        const bestFit = [...compareRows].sort((a, b) => b.fit - a.fit)[0];
        const bestFantasy = [...compareRows].sort((a, b) => b.fantasy - a.fantasy)[0];
        const bestBatting = [...compareRows].sort((a, b) => b.projectedRuns - a.projectedRuns)[0];
        const bestBowling = [...compareRows]
            .filter((row) => row.projectedWickets > 0 || row.projectedEconomy > 0)
            .sort((a, b) => (b.projectedWickets - a.projectedWickets) || (a.projectedEconomy - b.projectedEconomy))[0] || null;

        return {
            bestFit,
            bestFantasy,
            bestBowling,
            bestBatting
        };
    }, [compareRows]);

    const indexRows = useMemo(() => {
        if (!analysis?.indices) return [];

        return [
            { key: 'battingSuitability', label: 'Batting Suitability', value: analysis.indices.battingSuitability },
            { key: 'bowlingSuitability', label: 'Bowling Suitability', value: analysis.indices.bowlingSuitability },
            { key: 'paceAlignment', label: 'Pace Alignment', value: analysis.indices.paceAlignment },
            { key: 'spinAlignment', label: 'Spin Alignment', value: analysis.indices.spinAlignment },
            { key: 'scoringEnvironment', label: 'Scoring Environment', value: analysis.indices.scoringEnvironment },
            { key: 'chaseIndex', label: 'Chase Index', value: analysis.indices.chaseIndex },
            { key: 'powerplayImpact', label: 'Powerplay Impact', value: analysis.indices.powerplayImpact },
            { key: 'deathOversImpact', label: 'Death Overs Impact', value: analysis.indices.deathOversImpact }
        ];
    }, [analysis]);

    const factorRows = Array.isArray(analysis?.factors) ? analysis.factors : [];
    const directSamples = Array.isArray(analysis?.directVenueRecord?.samples)
        ? analysis.directVenueRecord.samples
        : [];
    const venueHeroImage = (!venueImageBroken && selectedVenue?.image)
        ? selectedVenue.image
        : buildVenueFallbackImage(selectedVenue?.name || 'Cricket Stadium');
    const paceShare = Math.max(0, Math.min(100, toNumber(selectedVenue?.paceSpin?.pace, 0)));
    const spinShare = Math.max(0, Math.min(100, toNumber(selectedVenue?.paceSpin?.spin, 0)));
    const avgFirstInnings = toNumber(selectedVenue?.avgScores?.first, 0);
    const avgSecondInnings = toNumber(selectedVenue?.avgScores?.second, 0);
    const inningsGap = avgFirstInnings - avgSecondInnings;
    const inningsGapTone = inningsGap > 0 ? 'text-emerald-300' : inningsGap < 0 ? 'text-amber-300' : 'text-slate-300';
    const inningsGapLabel = inningsGap > 0
        ? `${asFixed(Math.abs(inningsGap), 0)} run first-innings edge`
        : inningsGap < 0
            ? `${asFixed(Math.abs(inningsGap), 0)} run chase edge`
            : 'No scoring split edge';

    if (loading) return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center text-white">Loading Venues...</div>;
    if (!selectedVenue) return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center text-white">No Venues Found. Run backend seeding with: npm run seed:venues</div>;

    return (
        <div className='relative min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 font-sans text-slate-200 flex flex-col'>
             <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-16 left-8 w-72 h-72 bg-blue-500/12 rounded-full blur-3xl"></div>
                <div className="absolute top-24 right-6 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl"></div>
            </div>
             {/* Navbar */}
             <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-white/10 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center gap-3">
                            <Link to="/" className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-white tracking-tight">Venue Intelligence</h1>
                                <p className="text-xs text-cyan-300 font-medium tracking-wide flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${sseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-yellow-400'}`}></span>
                                    STADIUM ANALYTICS
                                </p>
                            </div>
                        </div>
                        <Link to="/" className="text-slate-400 hover:text-white transition-colors">Back to Dashboard</Link>
                    </div>
                </div>
            </nav>

            <div className="relative flex-1 max-w-7xl mx-auto w-full p-6 md:p-8">
                
                {/* Header Section */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">Venue Command Center</h2>
                    <p className="text-slate-400">Strategic pitch reports and stadium analytics.</p>
                    <div className="mt-4 surface-glass rounded-2xl p-4">
                        <p className="text-xs uppercase tracking-wider font-bold text-slate-300 mb-3">Admin Tools</p>
                        <div className="flex flex-col md:flex-row gap-3">
                            <input
                                type="password"
                                value={adminSeedKey}
                                onChange={(e) => setAdminSeedKey(e.target.value)}
                                placeholder="Optional admin seed key"
                                className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
                            />
                            <button
                                onClick={handleSeedVenues}
                                disabled={seeding}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-400 text-white transition-colors"
                            >
                                {seeding ? 'Seeding...' : 'Seed Venue Data'}
                            </button>
                        </div>
                        <label className="mt-3 inline-flex items-center gap-2 text-sm text-slate-300 select-none">
                            <input
                                type="checkbox"
                                checked={replaceExisting}
                                onChange={(e) => setReplaceExisting(e.target.checked)}
                                className="h-4 w-4 rounded border-white/20 bg-slate-800 text-blue-500 focus:ring-blue-500/60"
                            />
                            Replace existing venues (clears old records first)
                        </label>
                        {seedStatus && (
                            <p className={`mt-3 text-sm ${seedStatus.type === 'success' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {seedStatus.message}
                            </p>
                        )}
                    </div>
                </div>

                {/* Venue Selector */}
                <div className="surface-glass rounded-2xl p-5 mb-6">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Venue Selector</p>
                            <h3 className="text-lg font-bold text-white">Quick Pick Stadium</h3>
                            <p className="text-xs text-slate-400 mt-1">Use search and a compact dropdown to switch venues fast.</p>
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-1.5 text-xs text-slate-300">
                            <span className="text-slate-500">Selected</span>
                            <span className="font-semibold text-white">{selectedVenue?.name || 'None'}</span>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 xl:grid-cols-5 gap-4">
                        <div className="xl:col-span-3 bg-slate-900/45 border border-white/10 rounded-2xl p-4 space-y-3">
                            <div className="relative">
                                <input
                                    value={venueQuery}
                                    onChange={(event) => setVenueQuery(event.target.value)}
                                    placeholder="Filter by venue or city"
                                    className="w-full rounded-xl border border-white/10 bg-slate-900/70 py-2.5 pl-10 pr-20 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                />
                                <svg className="pointer-events-none absolute left-3 top-2.5 h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                </svg>
                                {venueQuery && (
                                    <button
                                        onClick={() => setVenueQuery('')}
                                        className="absolute right-2 top-2 rounded-md border border-white/15 bg-slate-800/80 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:text-white"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>

                            <div>
                                <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-1.5">All International Venues</p>
                                <div className="app-scroll max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-slate-900/60 p-1.5">
                                    {filteredVenues.length === 0 ? (
                                        <div className="px-3 py-6 text-center text-sm text-slate-500">No venues found</div>
                                    ) : (
                                        filteredVenues.map((venue, index) => {
                                            const active = String(selectedVenue?.id || '') === String(venue.id);
                                            return (
                                                <button
                                                    key={venue.id}
                                                    onClick={() => setSelectedVenue(venue)}
                                                    className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                                                        active
                                                            ? 'bg-gradient-to-r from-blue-600/40 to-cyan-500/30 border border-cyan-400/30'
                                                            : 'border border-transparent hover:bg-slate-800/70'
                                                    }`}
                                                >
                                                    <p className="text-sm font-semibold text-white">
                                                        {index + 1}. {venue.name}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-0.5">{venue.location || 'Unknown location'}</p>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            <p className="text-xs text-slate-500">
                                Showing {filteredVenues.length} of {venues.length} venues.
                            </p>
                        </div>

                        <div className="xl:col-span-2 bg-black/20 border border-white/10 rounded-2xl p-4">
                            <p className="text-[11px] uppercase tracking-wider text-slate-500">Selected Venue Snapshot</p>
                            <p className="mt-1 text-base font-bold text-white">{selectedVenue?.name || 'No venue selected'}</p>
                            <p className="text-xs text-slate-400 mt-1">{selectedVenue?.location || 'Unknown location'}</p>

                            <div className="mt-3 flex flex-wrap gap-2">
                                <span className="rounded-full border border-white/10 bg-slate-800/80 px-2 py-1 text-[10px] font-semibold text-slate-300">
                                    Capacity {selectedVenue?.capacity || 'N/A'}
                                </span>
                                <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[10px] font-semibold text-rose-200">
                                    Pace {asFixed(selectedVenue?.paceSpin?.pace, 0)}%
                                </span>
                                <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-[10px] font-semibold text-blue-200">
                                    Spin {asFixed(selectedVenue?.paceSpin?.spin, 0)}%
                                </span>
                            </div>

                            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
                                {selectedVenue?.description || 'Venue description unavailable.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Grid Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Card 1: Stadium Info */}
                    <div className="surface-glass rounded-3xl p-1 overflow-hidden group">
                        <div className="relative h-48 rounded-t-3xl overflow-hidden">
                            <img
                                src={venueHeroImage}
                                alt={selectedVenue.name}
                                onError={() => setVenueImageBroken(true)}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                            <div className="absolute bottom-4 left-4">
                                <h3 className="text-xl font-bold text-white">{selectedVenue.name}</h3>
                                <p className="text-sm text-slate-300 flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                    {selectedVenue.location}
                                </p>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4 bg-slate-800/50 p-3 rounded-xl">
                                <span className="text-xs text-slate-400 uppercase font-bold">Capacity</span>
                                <span className="text-lg font-mono font-bold text-white">{selectedVenue.capacity}</span>
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                {selectedVenue.description}
                            </p>
                        </div>
                    </div>

                    {/* Card 2: Bowling Split */}
                    <div className="surface-glass rounded-3xl p-6 flex flex-col">
                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-5 w-full text-left flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            Bowling Split
                        </h3>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4">
                                <p className="text-[10px] uppercase tracking-wider text-slate-500">Pace Share</p>
                                <p className="mt-1 text-3xl font-bold text-rose-300">{asFixed(paceShare, 0)}%</p>
                                <p className="text-xs text-slate-400 mt-1">Wickets by seam/pace</p>
                            </div>
                            <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4">
                                <p className="text-[10px] uppercase tracking-wider text-slate-500">Spin Share</p>
                                <p className="mt-1 text-3xl font-bold text-blue-300">{asFixed(spinShare, 0)}%</p>
                                <p className="text-xs text-slate-400 mt-1">Wickets by spin</p>
                            </div>
                        </div>

                        <div className="mt-4 bg-black/20 border border-white/10 rounded-2xl p-4">
                            <p className="text-[10px] uppercase tracking-wider text-slate-500">Pitch Lean</p>
                            <p className="mt-1 text-sm font-semibold text-white">
                                {paceShare === spinShare
                                    ? 'Balanced wicket profile across pace and spin.'
                                    : paceShare > spinShare
                                        ? 'Pace bowlers currently hold the stronger edge.'
                                        : 'Spin bowlers currently hold the stronger edge.'}
                            </p>
                            <p className="text-xs text-slate-400 mt-2">Use this split with player role and venue form before finalizing picks.</p>
                        </div>
                    </div>

                    {/* Card 3: Average Scores */}
                    <div className="surface-glass rounded-3xl p-6 flex flex-col">
                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-6 flex items-center gap-2">
                            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
                            Average Scores
                        </h3>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4">
                                <p className="text-[10px] uppercase tracking-wider text-slate-500">First Innings</p>
                                <p className="mt-1 text-3xl font-bold text-blue-300">{asFixed(avgFirstInnings, 0)}</p>
                                <p className="text-xs text-slate-400 mt-1">Average total</p>
                            </div>
                            <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4">
                                <p className="text-[10px] uppercase tracking-wider text-slate-500">Second Innings</p>
                                <p className="mt-1 text-3xl font-bold text-violet-300">{asFixed(avgSecondInnings, 0)}</p>
                                <p className="text-xs text-slate-400 mt-1">Average chase score</p>
                            </div>
                        </div>

                        <div className="mt-4 bg-black/20 border border-white/10 rounded-2xl p-4">
                            <p className="text-[10px] uppercase tracking-wider text-slate-500">Scoring Gap</p>
                            <p className={`mt-1 text-sm font-semibold ${inningsGapTone}`}>{inningsGapLabel}</p>
                            <p className="text-xs text-slate-400 mt-2">Compare this with toss and chasing trends while planning combinations.</p>
                        </div>

                        <div className="mt-4 flex justify-between items-center">
                            <span className="text-sm text-slate-400">Batting First Advantage</span>
                            <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                                selectedVenue.battingAdvantage === 'High' ? 'bg-green-500/20 text-green-400' : 
                                selectedVenue.battingAdvantage === 'Moderate' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                                {selectedVenue.battingAdvantage}
                            </span>
                        </div>
                    </div>

                </div>

                <div className="mt-10 surface-glass rounded-3xl p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <h3 className="text-2xl font-bold text-white">Player x Venue Lab</h3>
                            <p className="text-sm text-slate-400 mt-1">How does a specific player project at this ground? Blend venue profile, player stats, and scorecard evidence.</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                onClick={copyCrossSummary}
                                disabled={!analysis}
                                className="px-3 py-2 text-xs font-semibold rounded-lg border border-blue-500/30 bg-blue-500/10 text-blue-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-500/20"
                            >
                                Copy Summary
                            </button>
                            <button
                                onClick={exportCrossJson}
                                disabled={!crossAnalysis}
                                className="px-3 py-2 text-xs font-semibold rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-500/20"
                            >
                                Export JSON
                            </button>
                        </div>
                    </div>

                    {copyStatus && (
                        <p className="mt-3 text-xs text-blue-300">{copyStatus}</p>
                    )}

                    <div className="mt-5 grid grid-cols-1 lg:grid-cols-6 gap-3 items-end">
                        <div className="lg:col-span-3 relative">
                            <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Player Search</p>
                            <input
                                value={playerQuery}
                                onChange={(event) => {
                                    setPlayerQuery(event.target.value);
                                    setSelectedPlayer(null);
                                }}
                                placeholder="Search player name"
                                className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-white/10 text-sm text-white placeholder-slate-500"
                            />
                            {searchingPlayers && (
                                <p className="absolute right-3 top-9 text-[10px] text-slate-500">Searching...</p>
                            )}
                            {playerOptions.length > 0 && (
                                <div className="absolute z-20 mt-1 w-full rounded-lg border border-white/10 bg-slate-900 shadow-xl overflow-hidden">
                                    {playerOptions.map((player) => (
                                        <button
                                            key={player.apiId || player._id || player.name}
                                            onClick={() => selectPlayer(player)}
                                            className="w-full text-left px-3 py-2 border-b border-white/5 last:border-b-0 hover:bg-white/5"
                                        >
                                            <p className="text-sm text-white font-semibold">{player.name}</p>
                                            <p className="text-[11px] text-slate-400">{player.country || 'Unknown'} · {player.role || 'Unknown Role'}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="lg:col-span-2">
                            <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Format Lens</p>
                            <div className="grid grid-cols-2 gap-2">
                                {ANALYSIS_FORMATS.map((format) => (
                                    <button
                                        key={format.key}
                                        onClick={() => setAnalysisFormat(format.key)}
                                        className={`px-2 py-2 text-xs rounded-lg border ${analysisFormat === format.key ? 'bg-blue-500/20 border-blue-500/40 text-blue-200' : 'bg-slate-800/70 border-white/10 text-slate-400 hover:text-white'}`}
                                    >
                                        {format.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="space-y-2">
                                <button
                                    onClick={runCrossAnalysis}
                                    disabled={analysisLoading || !selectedPlayer}
                                    className="w-full px-3 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-400"
                                >
                                    {analysisLoading ? 'Analyzing...' : 'Run Analysis'}
                                </button>
                                <button
                                    onClick={addSelectedToCompare}
                                    disabled={!selectedPlayer || comparePlayers.length >= MAX_COMPARE_PLAYERS}
                                    className="w-full px-3 py-2 rounded-lg text-xs font-semibold border border-violet-500/30 bg-violet-500/10 text-violet-200 disabled:bg-slate-700 disabled:text-slate-400 disabled:border-slate-600 hover:bg-violet-500/20"
                                >
                                    Add To Compare
                                </button>
                            </div>
                        </div>
                    </div>

                    {selectedPlayer && (
                        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-black/20 text-xs text-slate-300">
                            <span className="font-semibold text-white">Selected:</span>
                            <span>{selectedPlayer.name}</span>
                            <span className="text-slate-500">{selectedPlayer.country || 'Unknown'}</span>
                        </div>
                    )}

                    <div className="mt-5 bg-black/20 border border-white/10 rounded-2xl p-4">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-3">
                            <div>
                                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Multi-Player Compare</h4>
                                <p className="text-xs text-slate-400 mt-1">Build a shortlist and rank players at this venue in the selected format lens.</p>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                <select
                                    value={compareSortBy}
                                    onChange={(event) => setCompareSortBy(event.target.value)}
                                    className="px-3 py-2 rounded-lg bg-slate-800/80 border border-white/10 text-xs text-white"
                                >
                                    <option value="fit">Sort: Fit Score</option>
                                    <option value="fantasy">Sort: Fantasy Pts</option>
                                    <option value="runs">Sort: Runs</option>
                                    <option value="wickets">Sort: Wickets</option>
                                    <option value="economy">Sort: Economy</option>
                                </select>
                                <button
                                    onClick={runCompareAnalysis}
                                    disabled={compareLoading || comparePlayers.length === 0}
                                    className="px-3 py-2 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:text-slate-400"
                                >
                                    {compareLoading ? 'Comparing...' : 'Run Compare'}
                                </button>
                                <button
                                    onClick={copyCompareSummary}
                                    disabled={compareRows.length === 0}
                                    className="px-3 py-2 rounded-lg text-xs font-semibold border border-blue-500/30 bg-blue-500/10 text-blue-200 disabled:opacity-50"
                                >
                                    Copy Compare
                                </button>
                                <button
                                    onClick={exportCompareCsv}
                                    disabled={compareRows.length === 0}
                                    className="px-3 py-2 rounded-lg text-xs font-semibold border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 disabled:opacity-50"
                                >
                                    Export CSV
                                </button>
                                <button
                                    onClick={clearCompare}
                                    disabled={comparePlayers.length === 0 && compareRows.length === 0}
                                    className="px-3 py-2 rounded-lg text-xs font-semibold border border-slate-500/30 bg-slate-500/10 text-slate-300 disabled:opacity-50"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                            {comparePlayers.length === 0 ? (
                                <span className="text-xs text-slate-500">No players added yet.</span>
                            ) : comparePlayers.map((player) => (
                                <span key={player.id} className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-white/10 bg-slate-800/70 text-xs text-slate-200">
                                    <span className="font-semibold">{player.name}</span>
                                    <span className="text-slate-400">{player.country}</span>
                                    <button
                                        onClick={() => removeComparePlayer(player.id)}
                                        className="text-rose-300 hover:text-rose-200"
                                        aria-label={`Remove ${player.name}`}
                                    >
                                        x
                                    </button>
                                </span>
                            ))}
                        </div>

                        {compareStatus && (
                            <p className="text-xs text-amber-300 mb-2">{compareStatus}</p>
                        )}

                        {compareError && (
                            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-300 mb-3">
                                {compareError}
                            </div>
                        )}

                        {compareLoading && (
                            <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
                                <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                                Running venue compare model for shortlist...
                            </div>
                        )}

                        {!compareLoading && compareRows.length > 0 && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                                    <div className="bg-slate-900/70 border border-white/10 rounded-xl p-3">
                                        <p className="text-[10px] uppercase text-slate-500">Best Fit</p>
                                        <p className="text-sm font-semibold text-emerald-300 mt-1">{compareLeaders.bestFit?.player || 'N/A'}</p>
                                        <p className="text-xs text-slate-400">Score {asFixed(compareLeaders.bestFit?.fit)}</p>
                                    </div>
                                    <div className="bg-slate-900/70 border border-white/10 rounded-xl p-3">
                                        <p className="text-[10px] uppercase text-slate-500">Fantasy Leader</p>
                                        <p className="text-sm font-semibold text-violet-300 mt-1">{compareLeaders.bestFantasy?.player || 'N/A'}</p>
                                        <p className="text-xs text-slate-400">{asFixed(compareLeaders.bestFantasy?.fantasy)} pts</p>
                                    </div>
                                    <div className="bg-slate-900/70 border border-white/10 rounded-xl p-3">
                                        <p className="text-[10px] uppercase text-slate-500">Batting Upside</p>
                                        <p className="text-sm font-semibold text-blue-300 mt-1">{compareLeaders.bestBatting?.player || 'N/A'}</p>
                                        <p className="text-xs text-slate-400">{asFixed(compareLeaders.bestBatting?.projectedRuns)} runs</p>
                                    </div>
                                    <div className="bg-slate-900/70 border border-white/10 rounded-xl p-3">
                                        <p className="text-[10px] uppercase text-slate-500">Bowling Edge</p>
                                        <p className="text-sm font-semibold text-amber-300 mt-1">{compareLeaders.bestBowling?.player || 'N/A'}</p>
                                        <p className="text-xs text-slate-400">{asFixed(compareLeaders.bestBowling?.projectedWickets, 2)} wkts, econ {asFixed(compareLeaders.bestBowling?.projectedEconomy, 2)}</p>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-slate-400 border-b border-white/10">
                                                <th className="text-left py-2 pr-2 w-10">#</th>
                                                <th className="text-left py-2 px-2">Player</th>
                                                <th className="text-right py-2 px-2">Fit</th>
                                                <th className="text-right py-2 px-2">Conf</th>
                                                <th className="text-right py-2 px-2">Runs</th>
                                                <th className="text-right py-2 px-2">Wkts</th>
                                                <th className="text-right py-2 px-2">Econ</th>
                                                <th className="text-right py-2 px-2">Fantasy</th>
                                                <th className="text-left py-2 px-2">Fit Band</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {compareRows.map((row, index) => (
                                                <tr key={row.id} className="border-b border-white/5 last:border-b-0">
                                                    <td className="py-2 pr-2 text-slate-500">{index + 1}</td>
                                                    <td className="py-2 px-2">
                                                        <p className="text-slate-200 font-semibold">{row.player}</p>
                                                        <p className="text-[11px] text-slate-500">{row.country} · {row.role}</p>
                                                    </td>
                                                    <td className="py-2 px-2 text-right font-mono text-blue-200">{asFixed(row.fit)}</td>
                                                    <td className="py-2 px-2 text-right font-mono text-slate-200">{asFixed(row.confidence)}%</td>
                                                    <td className="py-2 px-2 text-right font-mono text-indigo-200">{asFixed(row.projectedRuns)}</td>
                                                    <td className="py-2 px-2 text-right font-mono text-emerald-200">{asFixed(row.projectedWickets, 2)}</td>
                                                    <td className="py-2 px-2 text-right font-mono text-amber-200">{asFixed(row.projectedEconomy, 2)}</td>
                                                    <td className="py-2 px-2 text-right font-mono text-violet-200">{asFixed(row.fantasy)}</td>
                                                    <td className="py-2 px-2">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-semibold ${fitBandClass(row.fitBand)}`}>
                                                            {row.fitBand}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>

                    {analysisError && (
                        <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                            {analysisError}
                        </div>
                    )}

                    {crossAnalysis?._notice && (
                        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                            {crossAnalysis._notice}
                        </div>
                    )}

                    {analysisLoading && (
                        <div className="mt-6 flex items-center gap-3 text-sm text-slate-400">
                            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            Building venue-player projection model...
                        </div>
                    )}

                    {!analysisLoading && analysis && (
                        <>
                            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
                                <div className="bg-black/20 border border-white/10 rounded-2xl p-4">
                                    <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Overall Fit Score</p>
                                    <div className="flex items-center gap-3">
                                        <p className="text-3xl font-bold text-white">{asFixed(analysis.overallFitScore)}</p>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-semibold ${fitBandClass(analysis.fitBand)}`}>
                                            {analysis.fitBand}
                                        </span>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-semibold ${metricBadgeClass(analysis.overallFitScore)}`}>
                                            {metricBandLabel(analysis.overallFitScore)} Fit
                                        </span>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-500/30 bg-slate-500/10 text-slate-300 uppercase tracking-wider font-semibold">
                                            {analysis?.format?.label || analysisFormat.toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-black/20 border border-white/10 rounded-2xl p-4">
                                    <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Confidence</p>
                                    <p className="text-3xl font-bold text-white">{asFixed(analysis.confidence)}%</p>
                                    <p className="text-xs text-slate-400 mt-2">Direct venue matches: {analysis?.directVenueRecord?.matches || 0}</p>
                                    <p className="text-xs text-slate-400">Evidence matches scanned: {crossAnalysis?.evidenceCoverage?.matchesScanned || 0}</p>
                                </div>

                                <div className="bg-black/20 border border-white/10 rounded-2xl p-4">
                                    <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Recommended Usage</p>
                                    <p className="text-sm font-semibold text-white leading-relaxed">{analysis.recommendedRole}</p>
                                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">{analysis.narrative}</p>
                                </div>
                            </div>

                            <div className="mt-6 bg-black/20 border border-white/10 rounded-2xl p-4">
                                <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Projected Match Output</h4>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    <div className="bg-slate-900/70 border border-white/10 rounded-xl p-3">
                                        <p className="text-[10px] uppercase text-slate-500">Runs</p>
                                        <p className="text-xl font-bold text-blue-300">{asFixed(analysis?.expected?.battingRuns)}</p>
                                    </div>
                                    <div className="bg-slate-900/70 border border-white/10 rounded-xl p-3">
                                        <p className="text-[10px] uppercase text-slate-500">Strike Rate</p>
                                        <p className="text-xl font-bold text-indigo-300">{asFixed(analysis?.expected?.strikeRate)}</p>
                                    </div>
                                    <div className="bg-slate-900/70 border border-white/10 rounded-xl p-3">
                                        <p className="text-[10px] uppercase text-slate-500">Wickets</p>
                                        <p className="text-xl font-bold text-emerald-300">{asFixed(analysis?.expected?.wickets, 2)}</p>
                                    </div>
                                    <div className="bg-slate-900/70 border border-white/10 rounded-xl p-3">
                                        <p className="text-[10px] uppercase text-slate-500">Economy</p>
                                        <p className="text-xl font-bold text-amber-300">{asFixed(analysis?.expected?.economy, 2)}</p>
                                    </div>
                                    <div className="bg-slate-900/70 border border-white/10 rounded-xl p-3">
                                        <p className="text-[10px] uppercase text-slate-500">Fantasy Pts</p>
                                        <p className="text-xl font-bold text-violet-300">{asFixed(analysis?.expected?.fantasyPoints)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 bg-black/20 border border-white/10 rounded-2xl p-4">
                                <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Compatibility Indices</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {indexRows.map((row) => (
                                        <div key={row.key} className="bg-slate-900/70 border border-white/10 rounded-xl p-3">
                                            <p className="text-xs text-slate-300">{row.label}</p>
                                            <div className="mt-2 flex items-center justify-between">
                                                <span className={`text-lg font-bold ${metricTextClass(row.value)}`}>{asFixed(row.value)}%</span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider font-semibold ${metricBadgeClass(row.value)}`}>
                                                    {metricBandLabel(row.value)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-4">
                                <div className="bg-black/20 border border-white/10 rounded-2xl p-4">
                                    <h4 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Explainability Factors</h4>
                                    <div className="space-y-2">
                                        {factorRows.map((factor, index) => (
                                            <div key={`${factor.label}-${index}`} className="bg-slate-900/70 border border-white/10 rounded-xl p-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-sm font-semibold text-white">{factor.label}</p>
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${impactClass(toNumber(factor.impact, 0))}`}>
                                                        {toNumber(factor.impact, 0) >= 0 ? '+' : ''}{asFixed(factor.impact)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-blue-300 mt-1">{factor.value}</p>
                                                <p className="text-xs text-slate-400 mt-1">{factor.explanation}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-black/20 border border-white/10 rounded-2xl p-4">
                                    <h4 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Insights and Risks</h4>

                                    <div className="mb-3">
                                        <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Quick Insights</p>
                                        <ul className="space-y-1">
                                            {(analysis.insights || []).map((insight, index) => (
                                                <li key={`${insight}-${index}`} className="text-sm text-slate-300">- {insight}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-slate-500 mb-2">Risk Flags</p>
                                        {Array.isArray(analysis.riskFlags) && analysis.riskFlags.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {analysis.riskFlags.map((risk, index) => (
                                                    <span key={`${risk}-${index}`} className="text-xs px-2 py-1 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-300">
                                                        {risk}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-emerald-300">No major risk flags detected for the selected lens.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 bg-black/20 border border-white/10 rounded-2xl p-4">
                                <h4 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Direct Venue Record</h4>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span className="text-xs px-2 py-1 rounded-full border border-white/10 bg-slate-800 text-slate-300">Matches: {analysis?.directVenueRecord?.matches || 0}</span>
                                    <span className="text-xs px-2 py-1 rounded-full border border-white/10 bg-slate-800 text-slate-300">Runs: {analysis?.directVenueRecord?.runs || 0}</span>
                                    <span className="text-xs px-2 py-1 rounded-full border border-white/10 bg-slate-800 text-slate-300">Wickets: {analysis?.directVenueRecord?.wickets || 0}</span>
                                    <span className="text-xs px-2 py-1 rounded-full border border-white/10 bg-slate-800 text-slate-300">SR: {asFixed(analysis?.directVenueRecord?.strikeRate, 2)}</span>
                                    <span className="text-xs px-2 py-1 rounded-full border border-white/10 bg-slate-800 text-slate-300">Econ: {asFixed(analysis?.directVenueRecord?.economy, 2)}</span>
                                    <span className="text-xs px-2 py-1 rounded-full border border-white/10 bg-slate-800 text-slate-300">Best Bat: {analysis?.directVenueRecord?.bestBatting || 0}</span>
                                    <span className="text-xs px-2 py-1 rounded-full border border-white/10 bg-slate-800 text-slate-300">Best Bowl: {analysis?.directVenueRecord?.bestBowling || '0/0'}</span>
                                </div>

                                {directSamples.length === 0 ? (
                                    <p className="text-sm text-slate-500">No direct venue samples found in current scorecard coverage.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-slate-400 border-b border-white/10">
                                                    <th className="text-left py-2 pr-2">Match</th>
                                                    <th className="text-right py-2 px-2">Runs</th>
                                                    <th className="text-right py-2 px-2">Balls</th>
                                                    <th className="text-right py-2 px-2">SR</th>
                                                    <th className="text-right py-2 px-2">Wkts</th>
                                                    <th className="text-right py-2 px-2">Econ</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {directSamples.map((sample) => (
                                                    <tr key={sample.matchId} className="border-b border-white/5 last:border-b-0">
                                                        <td className="py-2 pr-2 text-slate-300">{sample.matchName}</td>
                                                        <td className="py-2 px-2 text-right font-mono text-blue-200">{sample.runs}</td>
                                                        <td className="py-2 px-2 text-right font-mono text-slate-300">{sample.balls}</td>
                                                        <td className="py-2 px-2 text-right font-mono text-indigo-200">{asFixed(sample.strikeRate, 2)}</td>
                                                        <td className="py-2 px-2 text-right font-mono text-emerald-200">{sample.wickets}</td>
                                                        <td className="py-2 px-2 text-right font-mono text-amber-200">{asFixed(sample.economy, 2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VenueIntelligence;