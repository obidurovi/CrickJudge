import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import PlayerCard from '../components/PlayerCard';
import useSSE from '../hooks/useSSE';
import {
    getPlayerWatchlistIds,
    getPlayerWatchlistId,
    isPlayerInWatchlist,
    togglePlayerWatchlistId,
    fetchRemoteWatchlistIds,
    saveRemoteWatchlistIds
} from '../utils/watchlist';

const WatchlistDashboard = () => {
    const [watchlistIds, setWatchlistIds] = useState(() => getPlayerWatchlistIds());
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTrackedPlayers = useCallback(async (ids) => {
        if (!ids.length) {
            setPlayers([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const { data } = await axios.get(`http://localhost:5000/api/players/watchlist?ids=${encodeURIComponent(ids.join(','))}`);
            setPlayers(Array.isArray(data?.players) ? data.players : []);
        } catch {
            setPlayers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTrackedPlayers(watchlistIds);
    }, [watchlistIds, fetchTrackedPlayers]);

    useEffect(() => {
        let active = true;
        (async () => {
            const remoteIds = await fetchRemoteWatchlistIds();
            if (active) {
                setWatchlistIds(remoteIds);
            }
        })();
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        const syncWatchlistAcrossTabs = () => setWatchlistIds(getPlayerWatchlistIds());
        window.addEventListener('storage', syncWatchlistAcrossTabs);
        return () => window.removeEventListener('storage', syncWatchlistAcrossTabs);
    }, []);

    const toggleWatchlist = (player) => {
        const watchlistId = getPlayerWatchlistId(player);
        if (!watchlistId) return;
        const updated = togglePlayerWatchlistId(watchlistId);
        setWatchlistIds(updated);
        saveRemoteWatchlistIds(updated);
    };

    const sseHandlers = useMemo(() => ({
        'sync:complete': () => {
            if (watchlistIds.length) {
                fetchTrackedPlayers(watchlistIds);
            }
        },
        'dashboard:crawlProgress': () => {
            if (watchlistIds.length) {
                fetchTrackedPlayers(watchlistIds);
            }
        }
    }), [watchlistIds, fetchTrackedPlayers]);

    const { connected } = useSSE('/dashboard', sseHandlers);

    const totals = useMemo(() => {
        return players.reduce((acc, player) => {
            acc.runs += Number(player?.stats?.runs) || 0;
            acc.wickets += Number(player?.stats?.wickets) || 0;
            acc.average += Number(player?.stats?.average) || 0;
            acc.strikeRate += Number(player?.stats?.strikeRate) || 0;
            return acc;
        }, { runs: 0, wickets: 0, average: 0, strikeRate: 0 });
    }, [players]);

    const avgBatting = players.length ? (totals.average / players.length).toFixed(1) : '0.0';
    const avgStrikeRate = players.length ? (totals.strikeRate / players.length).toFixed(1) : '0.0';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 font-sans text-slate-200 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Watchlist Dashboard</h1>
                        <p className="text-slate-400 mt-1">Your personalized player tracker with live updates.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 border rounded text-xs font-semibold uppercase tracking-wider ${connected ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-300'}`}>
                            {connected ? 'Live Connected' : 'Reconnecting'}
                        </span>
                        <Link to="/" className="px-3 py-2 rounded-lg border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 text-sm">Back to Dashboard</Link>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                        <p className="text-xs text-slate-400 uppercase tracking-wider">Tracked Players</p>
                        <p className="text-2xl font-bold text-white mt-1">{players.length}</p>
                    </div>
                    <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                        <p className="text-xs text-slate-400 uppercase tracking-wider">Combined Runs</p>
                        <p className="text-2xl font-bold text-white mt-1">{totals.runs.toLocaleString()}</p>
                    </div>
                    <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                        <p className="text-xs text-slate-400 uppercase tracking-wider">Combined Wickets</p>
                        <p className="text-2xl font-bold text-white mt-1">{totals.wickets.toLocaleString()}</p>
                    </div>
                    <div className="bg-black/20 border border-white/10 rounded-xl p-4">
                        <p className="text-xs text-slate-400 uppercase tracking-wider">Avg SR / Avg</p>
                        <p className="text-2xl font-bold text-white mt-1">{avgStrikeRate} / {avgBatting}</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                ) : players.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/15 bg-slate-900/40 px-4 py-12 text-center">
                        <p className="text-slate-300 font-medium text-lg">No tracked players yet</p>
                        <p className="text-slate-500 text-sm mt-2">Open the main dashboard and click the bookmark on player cards to build your watchlist.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {players.map((player, idx) => (
                            <div key={player.apiId || player._id || idx}>
                                <PlayerCard
                                    player={player}
                                    watchlistEnabled
                                    isWatchlisted={isPlayerInWatchlist(getPlayerWatchlistId(player), watchlistIds)}
                                    onToggleWatchlist={toggleWatchlist}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default WatchlistDashboard;
