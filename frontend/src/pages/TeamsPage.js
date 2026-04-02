import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import useSSE from '../hooks/useSSE';

const API = 'http://localhost:5000/api/players';

const TEAMS = [
    'India', 'Australia', 'England', 'South Africa', 'New Zealand',
    'Pakistan', 'Sri Lanka', 'Bangladesh', 'West Indies', 'Afghanistan',
    'Zimbabwe', 'Ireland', 'Netherlands', 'Scotland', 'Nepal'
];

const TeamsPage = () => {
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [gender, setGender] = useState('male');
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const [total, setTotal] = useState(0);
    const [syncing, setSyncing] = useState(false);
    const debounceRef = useRef(null);

    const fetchTeamPlayers = useCallback(async (showLoading = true) => {
        if (!selectedTeam) return;
        if (showLoading) setLoading(true);
        setError(null);
        try {
            const { data } = await axios.get(`${API}/team/${encodeURIComponent(selectedTeam)}?gender=${gender}`);
            setPlayers(data.players || []);
            setTotal(data.total || 0);
            setMessage(data.message || null);
            setSyncing(data.syncing || false);
        } catch (err) {
            setError('Failed to load team players');
        } finally {
            setLoading(false);
        }
    }, [selectedTeam, gender]);

    useEffect(() => {
        if (!selectedTeam) return;
        fetchTeamPlayers();
    }, [fetchTeamPlayers, selectedTeam, gender]);

    // SSE path: /team/:country?gender=male|female
    const ssePath = selectedTeam
        ? `/team/${encodeURIComponent(selectedTeam.toLowerCase())}?gender=${gender}`
        : null;

    const debouncedFetch = useCallback(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchTeamPlayers(false);
        }, 500);
    }, [fetchTeamPlayers]);

    // Clean up debounce timer on unmount or team/gender change
    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [selectedTeam, gender]);

    // SSE handlers — re-fetch the full filtered player list when players are synced or sync completes
    const sseHandlers = useMemo(() => ({
        'team:playerSynced': (data) => {
            setSyncing(true);
            setMessage(`Fetching latest player details... (${data.synced}/${data.total} players updated)`);
            // Debounced re-fetch to avoid concurrent API calls from rapid SSE events
            debouncedFetch();
        },
        'team:syncComplete': (data) => {
            setSyncing(false);
            setMessage(null);
            // Only refetch if players were actually synced to avoid triggering another sync loop
            if (data && data.synced > 0) {
                fetchTeamPlayers(false);
            }
        },
        'sync:progress': () => {
            // Global crawl progress — could update a status bar
        }
    }), [fetchTeamPlayers, debouncedFetch]);

    const { connected: sseConnected } = useSSE(ssePath, sseHandlers, !!selectedTeam);

    return (
        <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4 py-8 text-slate-200 sm:px-6 lg:px-8">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-20 left-8 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl"></div>
                <div className="absolute top-20 right-0 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl"></div>
            </div>

            <div className="relative mx-auto max-w-7xl">
                <section className="surface-glass rounded-3xl p-6 md:p-7 mb-8">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/80">Squad Intelligence</p>
                            <h1 className="mt-2 text-3xl font-extrabold text-white md:text-4xl">Team Player Explorer</h1>
                            <p className="mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
                                Compare men and women squads for each cricket nation with live sync updates and direct drill-down into player profiles.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <Link
                                to="/"
                                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"
                            >
                                Back to Dashboard
                            </Link>
                            <div className="rounded-xl border border-white/15 bg-black/20 px-3 py-2">
                                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Feed</p>
                                <p className={`text-sm font-semibold ${sseConnected ? 'text-emerald-300' : 'text-amber-300'}`}>
                                    {sseConnected ? 'Live Connected' : 'Waiting'}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="surface-glass rounded-3xl p-5 mb-8">
                    <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
                        <h2 className="text-lg font-bold text-white">Choose Team</h2>
                        <span className="rounded-full border border-white/15 bg-black/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-300">
                            {TEAMS.length} countries
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {TEAMS.map(team => (
                            <button
                                key={team}
                                onClick={() => setSelectedTeam(team)}
                                className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                                    selectedTeam === team
                                        ? 'border-cyan-300/40 bg-gradient-to-r from-blue-600/90 to-cyan-500/85 text-white shadow-lg shadow-blue-900/35'
                                        : 'border-white/10 bg-slate-900/45 text-slate-300 hover:border-white/20 hover:bg-slate-800/60 hover:text-white'
                                }`}
                            >
                                {team}
                            </button>
                        ))}
                    </div>
                </section>

                {selectedTeam ? (
                    <section className="surface-glass rounded-3xl p-5 md:p-6">
                        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-white">{selectedTeam}</h2>
                                <p className="text-sm text-slate-400">Showing {gender === 'male' ? 'Men' : 'Women'} squad players</p>
                            </div>
                            <div className="inline-flex rounded-xl border border-slate-600/80 overflow-hidden">
                                <button
                                    onClick={() => setGender('male')}
                                    className={`px-4 py-2 text-sm font-semibold transition-all ${
                                        gender === 'male'
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-900/70 text-slate-400 hover:text-white'
                                    }`}
                                >
                                    Men
                                </button>
                                <button
                                    onClick={() => setGender('female')}
                                    className={`px-4 py-2 text-sm font-semibold transition-all ${
                                        gender === 'female'
                                            ? 'bg-cyan-600 text-white'
                                            : 'bg-slate-900/70 text-slate-400 hover:text-white'
                                    }`}
                                >
                                    Women
                                </button>
                            </div>
                        </div>

                        {message && !loading && (
                            <div className="mb-4 flex items-center gap-3 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">
                                {syncing && (
                                    <svg className="h-4 w-4 flex-shrink-0 animate-spin" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                )}
                                <span>{message}</span>
                            </div>
                        )}

                        {loading && (
                            <div className="mb-5 rounded-2xl border border-white/10 bg-slate-900/50 p-6 text-center">
                                <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-blue-400 border-t-transparent"></div>
                                <p className="text-sm text-slate-300">Loading players...</p>
                            </div>
                        )}

                        {error && (
                            <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                                <p className="text-sm text-red-300">{error}</p>
                            </div>
                        )}

                        {!loading && !error && players.length > 0 && (
                            <p className="mb-4 text-sm text-slate-400">{total} player{total !== 1 ? 's' : ''}</p>
                        )}

                        {!loading && !error && players.length === 0 && !message && (
                            <div className="mb-4 rounded-2xl border border-dashed border-white/15 bg-slate-900/45 px-4 py-8 text-center">
                                <p className="text-sm text-slate-300">No players found for {selectedTeam}.</p>
                            </div>
                        )}

                        {!loading && players.length > 0 && (
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {players.map(player => (
                                    <Link
                                        key={player.apiId || player._id}
                                        to={`/player/${player.apiId}`}
                                        className="group surface-glass rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:border-cyan-300/35"
                                    >
                                        <div className="flex items-center gap-4">
                                            {player.image ? (
                                                <img
                                                    src={player.image}
                                                    alt={player.name}
                                                    className="h-12 w-12 flex-shrink-0 rounded-full border border-white/10 bg-slate-700 object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-slate-700 text-lg font-bold text-slate-300">
                                                    {player.name?.charAt(0)}
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="truncate font-semibold text-white">{player.name}</p>
                                                {player.role && player.role !== 'Unknown' && (
                                                    <p className="text-xs text-slate-400">{player.role}</p>
                                                )}
                                            </div>
                                        </div>

                                        {player.stats && player.stats.matches > 0 && (
                                            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-300">
                                                <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1">{player.stats.matches} matches</span>
                                                <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1">{player.stats.runs} runs</span>
                                                {player.stats.wickets > 0 && (
                                                    <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1">{player.stats.wickets} wkts</span>
                                                )}
                                            </div>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>
                ) : (
                    <section className="surface-glass rounded-3xl border border-dashed border-white/15 p-10 text-center">
                        <p className="text-lg font-semibold text-slate-200">Select a team to view players</p>
                        <p className="mt-2 text-sm text-slate-500">Your squad panel will load here with live updates and role stats.</p>
                    </section>
                )}
            </div>
        </div>
    );
};

export default TeamsPage;
