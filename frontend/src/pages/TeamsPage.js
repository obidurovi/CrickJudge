import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import PlayerCard from '../components/PlayerCard';

const API = 'http://localhost:5000/api/players';

const TEAMS = [
    // ICC Full Members (12)
    { name: 'India', code: 'IND', flag: '\u{1F1EE}\u{1F1F3}', icc: 'Full Member', gradient: 'from-blue-600 to-orange-500', bg: 'bg-blue-900/40', border: 'border-blue-500/30' },
    { name: 'Australia', code: 'AUS', flag: '\u{1F1E6}\u{1F1FA}', icc: 'Full Member', gradient: 'from-yellow-500 to-green-600', bg: 'bg-yellow-900/30', border: 'border-yellow-500/30' },
    { name: 'England', code: 'ENG', flag: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}', icc: 'Full Member', gradient: 'from-blue-700 to-red-600', bg: 'bg-blue-900/40', border: 'border-blue-500/30' },
    { name: 'South Africa', code: 'SA', flag: '\u{1F1FF}\u{1F1E6}', icc: 'Full Member', gradient: 'from-green-600 to-yellow-500', bg: 'bg-green-900/30', border: 'border-green-500/30' },
    { name: 'New Zealand', code: 'NZ', flag: '\u{1F1F3}\u{1F1FF}', icc: 'Full Member', gradient: 'from-slate-700 to-slate-900', bg: 'bg-slate-800/50', border: 'border-slate-500/30' },
    { name: 'Pakistan', code: 'PAK', flag: '\u{1F1F5}\u{1F1F0}', icc: 'Full Member', gradient: 'from-green-700 to-green-900', bg: 'bg-green-900/40', border: 'border-green-500/30' },
    { name: 'Sri Lanka', code: 'SL', flag: '\u{1F1F1}\u{1F1F0}', icc: 'Full Member', gradient: 'from-blue-800 to-yellow-600', bg: 'bg-blue-900/30', border: 'border-blue-500/30' },
    { name: 'Bangladesh', code: 'BAN', flag: '\u{1F1E7}\u{1F1E9}', icc: 'Full Member', gradient: 'from-green-600 to-red-600', bg: 'bg-green-900/30', border: 'border-green-500/30' },
    { name: 'West Indies', code: 'WI', flag: '\u{1F3CF}', icc: 'Full Member', gradient: 'from-red-700 to-red-900', bg: 'bg-red-900/30', border: 'border-red-500/30' },
    { name: 'Zimbabwe', code: 'ZIM', flag: '\u{1F1FF}\u{1F1FC}', icc: 'Full Member', gradient: 'from-green-600 to-yellow-600', bg: 'bg-green-900/30', border: 'border-green-500/30' },
    { name: 'Afghanistan', code: 'AFG', flag: '\u{1F1E6}\u{1F1EB}', icc: 'Full Member', gradient: 'from-red-700 to-green-700', bg: 'bg-red-900/30', border: 'border-red-500/30' },
    { name: 'Ireland', code: 'IRE', flag: '\u{1F1EE}\u{1F1EA}', icc: 'Full Member', gradient: 'from-green-500 to-orange-500', bg: 'bg-green-900/30', border: 'border-green-500/30' },

    // ICC Associate Members
    { name: 'Netherlands', code: 'NED', flag: '\u{1F1F3}\u{1F1F1}', icc: 'Associate', gradient: 'from-orange-600 to-blue-600', bg: 'bg-orange-900/20', border: 'border-orange-500/20' },
    { name: 'Scotland', code: 'SCO', flag: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}', icc: 'Associate', gradient: 'from-blue-600 to-blue-800', bg: 'bg-blue-900/20', border: 'border-blue-500/20' },
    { name: 'Nepal', code: 'NEP', flag: '\u{1F1F3}\u{1F1F5}', icc: 'Associate', gradient: 'from-red-600 to-blue-700', bg: 'bg-red-900/20', border: 'border-red-500/20' },
    { name: 'USA', code: 'USA', flag: '\u{1F1FA}\u{1F1F8}', icc: 'Associate', gradient: 'from-blue-700 to-red-700', bg: 'bg-blue-900/20', border: 'border-blue-500/20' },
    { name: 'UAE', code: 'UAE', flag: '\u{1F1E6}\u{1F1EA}', icc: 'Associate', gradient: 'from-green-600 to-red-600', bg: 'bg-green-900/20', border: 'border-green-500/20' },
    { name: 'Oman', code: 'OMA', flag: '\u{1F1F4}\u{1F1F2}', icc: 'Associate', gradient: 'from-red-600 to-green-600', bg: 'bg-red-900/20', border: 'border-red-500/20' },
    { name: 'Namibia', code: 'NAM', flag: '\u{1F1F3}\u{1F1E6}', icc: 'Associate', gradient: 'from-blue-600 to-red-600', bg: 'bg-blue-900/20', border: 'border-blue-500/20' },
    { name: 'Canada', code: 'CAN', flag: '\u{1F1E8}\u{1F1E6}', icc: 'Associate', gradient: 'from-red-600 to-red-800', bg: 'bg-red-900/20', border: 'border-red-500/20' },
    { name: 'Papua New Guinea', code: 'PNG', flag: '\u{1F1F5}\u{1F1EC}', icc: 'Associate', gradient: 'from-red-700 to-yellow-500', bg: 'bg-red-900/20', border: 'border-red-500/20' },
    { name: 'Uganda', code: 'UGA', flag: '\u{1F1FA}\u{1F1EC}', icc: 'Associate', gradient: 'from-yellow-500 to-red-600', bg: 'bg-yellow-900/20', border: 'border-yellow-500/20' },
    { name: 'Kenya', code: 'KEN', flag: '\u{1F1F0}\u{1F1EA}', icc: 'Associate', gradient: 'from-green-700 to-red-700', bg: 'bg-green-900/20', border: 'border-green-500/20' },
    { name: 'Hong Kong', code: 'HK', flag: '\u{1F1ED}\u{1F1F0}', icc: 'Associate', gradient: 'from-red-700 to-red-900', bg: 'bg-red-900/20', border: 'border-red-500/20' },
    { name: 'Jersey', code: 'JER', flag: '\u{1F1EF}\u{1F1EA}', icc: 'Associate', gradient: 'from-red-600 to-yellow-500', bg: 'bg-red-900/20', border: 'border-red-500/20' },
    { name: 'Singapore', code: 'SIN', flag: '\u{1F1F8}\u{1F1EC}', icc: 'Associate', gradient: 'from-red-600 to-white', bg: 'bg-red-900/20', border: 'border-red-500/20' },
    { name: 'Bermuda', code: 'BER', flag: '\u{1F1E7}\u{1F1F2}', icc: 'Associate', gradient: 'from-red-600 to-blue-600', bg: 'bg-red-900/20', border: 'border-blue-500/20' },
    { name: 'Italy', code: 'ITA', flag: '\u{1F1EE}\u{1F1F9}', icc: 'Associate', gradient: 'from-green-600 to-red-600', bg: 'bg-green-900/20', border: 'border-green-500/20' },
    { name: 'Germany', code: 'GER', flag: '\u{1F1E9}\u{1F1EA}', icc: 'Associate', gradient: 'from-yellow-500 to-red-600', bg: 'bg-yellow-900/20', border: 'border-yellow-500/20' },
];

const TeamsPage = () => {
    const [view, setView] = useState('teams');
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [searching, setSearching] = useState(false);
    const [teamFilter, setTeamFilter] = useState('all');
    const [teamSearch, setTeamSearch] = useState('');
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [total, setTotal] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [cachedRosters, setCachedRosters] = useState({});
    const [teamCounts, setTeamCounts] = useState({});
    const [syncProgress, setSyncProgress] = useState(null); // { isRunning, progress, playersSaved, totalRows }
    const [syncing, setSyncing] = useState(false);

    // Fetch team player counts and sync status on mount
    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const { data } = await axios.get(`${API}/teams-list`);
                const counts = {};
                (data || []).forEach(t => { counts[t.name] = t.playerCount; });
                setTeamCounts(counts);
            } catch (err) {
                console.error('Error fetching team counts:', err);
            }
        };
        const fetchSyncStatus = async () => {
            try {
                const { data } = await axios.get(`${API}/sync-status`);
                setSyncProgress(data);
            } catch (err) {
                // Ignore
            }
        };
        fetchCounts();
        fetchSyncStatus();

        // Poll sync status every 5s if a sync is running
        const interval = setInterval(async () => {
            try {
                const { data } = await axios.get(`${API}/sync-status`);
                setSyncProgress(data);
                if (data.isRunning) {
                    // Refresh team counts while syncing
                    fetchCounts();
                }
            } catch (err) { /* ignore */ }
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const startGlobalSync = async () => {
        setSyncing(true);
        try {
            await axios.post(`${API}/sync-all?pages=200`);
            // Poll sync status
            const { data } = await axios.get(`${API}/sync-status`);
            setSyncProgress(data);
        } catch (err) {
            console.error('Failed to start sync:', err);
        } finally {
            setSyncing(false);
        }
    };

    const selectTeam = (team) => {
        setSelectedTeam(team);
        setView('roster');
        setSearch('');
        setSearchResults(null);
        setOffset(0);

        if (cachedRosters[team.name]) {
            const cached = cachedRosters[team.name];
            setPlayers(cached.players);
            setTotal(cached.total);
            setHasMore(cached.hasMore);
        } else {
            setPlayers([]);
            fetchTeamPlayers(team.name, 0);
        }
    };

    const goBack = () => {
        setView('teams');
        setSelectedTeam(null);
        setPlayers([]);
        setSearch('');
        setSearchResults(null);
    };

    const [syncStatus, setSyncStatus] = useState(null); // null | 'syncing' | 'done' | 'error' | 'rate-limited'
    const [notice, setNotice] = useState(null);

    const fetchTeamPlayers = useCallback(async (country, newOffset = 0, append = false) => {
        if (append) setLoadingMore(true);
        else setLoading(true);
        setSyncStatus(null);
        setNotice(null);
        try {
            const { data } = await axios.get(`${API}/team/${encodeURIComponent(country)}?offset=${newOffset}`);
            const fetchedPlayers = data.players || [];

            // Track sync status from backend
            if (data.syncing) {
                setSyncStatus('syncing');
            } else if (data.fromCache) {
                setSyncStatus('done');
            } else {
                setSyncStatus('done');
            }

            if (data._notice) {
                setNotice(data._notice);
            }
            if (data.message && fetchedPlayers.length === 0) {
                setNotice(data.message);
            }

            if (append) {
                setPlayers(prev => {
                    const merged = [...prev, ...fetchedPlayers];
                    setCachedRosters(c => ({ ...c, [country]: { players: merged, total: data.total || 0, hasMore: data.hasMore || false } }));
                    return merged;
                });
            } else {
                setPlayers(fetchedPlayers);
                setCachedRosters(c => ({ ...c, [country]: { players: fetchedPlayers, total: data.total || 0, hasMore: data.hasMore || false } }));
            }
            setTotal(data.total || 0);
            setHasMore(data.hasMore || false);
            setOffset(newOffset);

            // If backend indicated it's syncing in background, poll for updates after a delay
            if (data.syncing) {
                setTimeout(async () => {
                    try {
                        const { data: refreshed } = await axios.get(`${API}/team/${encodeURIComponent(country)}`);
                        if (refreshed.players && refreshed.players.length > fetchedPlayers.length) {
                            setPlayers(refreshed.players);
                            setTotal(refreshed.total || 0);
                            setCachedRosters(c => ({ ...c, [country]: { players: refreshed.players, total: refreshed.total || 0, hasMore: false } }));
                        }
                        setSyncStatus('done');
                    } catch (e) {
                        // Ignore poll errors
                    }
                }, 10000);
            }
        } catch (err) {
            console.error('Error fetching team players:', err);
            if (err.response?.status === 429) {
                setSyncStatus('rate-limited');
                setNotice('API rate limit reached. Showing cached data if available.');
            } else {
                setSyncStatus('error');
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    const handleSearch = useCallback(async () => {
        if (!search || search.length < 2 || !selectedTeam) {
            setSearchResults(null);
            return;
        }
        setSearching(true);
        try {
            const { data } = await axios.get(`${API}/search?q=${encodeURIComponent(search)}`);
            const teamPlayers = (data.players || []).filter(p =>
                p.country && p.country.toLowerCase() === selectedTeam.name.toLowerCase()
            );
            setSearchResults(teamPlayers);
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setSearching(false);
        }
    }, [search, selectedTeam]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search.length >= 2) {
                handleSearch();
            } else {
                setSearchResults(null);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [search, handleSearch]);

    const loadMore = () => {
        if (!loadingMore && hasMore && selectedTeam) {
            fetchTeamPlayers(selectedTeam.name, offset + 50, true);
        }
    };

    const displayPlayers = searchResults !== null ? searchResults : players;

    const filteredTeams = TEAMS.filter(t => {
        const matchesFilter = teamFilter === 'all' ||
            (teamFilter === 'full' && t.icc === 'Full Member') ||
            (teamFilter === 'associate' && t.icc === 'Associate');
        const matchesSearch = !teamSearch || t.name.toLowerCase().includes(teamSearch.toLowerCase()) || t.code.toLowerCase().includes(teamSearch.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const fullMembers = filteredTeams.filter(t => t.icc === 'Full Member');
    const associates = filteredTeams.filter(t => t.icc === 'Associate');

    // ==================== TEAMS VIEW ====================
    if (view === 'teams') {
        return (
            <div className='min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 font-sans text-slate-200'>

                {/* Header */}
                <div className="bg-slate-900/60 backdrop-blur-xl border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-6 py-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-bold text-white tracking-tight">International Teams</h1>
                                        <p className="text-sm text-indigo-300 font-medium">All ICC Member Nations</p>
                                    </div>
                                </div>
                            </div>
                            <Link to="/" className="text-slate-400 hover:text-white transition-colors text-sm flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                Dashboard
                            </Link>
                        </div>

                        {/* Filters */}
                        {/* Sync Status Banner */}
                        {syncProgress && syncProgress.isRunning && (
                            <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-sm text-blue-300">
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                                        Building player database from live API...
                                    </div>
                                    <span className="text-xs text-blue-400 font-mono">{syncProgress.playersSaved || 0} players saved</span>
                                </div>
                                <div className="w-full bg-blue-900/50 rounded-full h-2">
                                    <div
                                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${syncProgress.progress || 0}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">{syncProgress.progress || 0}% of {syncProgress.totalRows || '?'} total players</p>
                            </div>
                        )}

                        <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="relative flex-1 max-w-md">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                <input
                                    type="text"
                                    placeholder="Search teams..."
                                    className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={teamSearch}
                                    onChange={(e) => setTeamSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={startGlobalSync}
                                    disabled={syncing || (syncProgress && syncProgress.isRunning)}
                                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white shadow-lg flex items-center gap-2"
                                >
                                    <svg className={`w-4 h-4 ${(syncing || (syncProgress && syncProgress.isRunning)) ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                    {syncProgress && syncProgress.isRunning ? 'Syncing...' : 'Sync Players'}
                                </button>
                                {[['all', 'All Teams'], ['full', 'Full Members'], ['associate', 'Associates']].map(([key, label]) => (
                                    <button
                                        key={key}
                                        onClick={() => setTeamFilter(key)}
                                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                                            teamFilter === key
                                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50'
                                                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Teams Grid */}
                <div className="max-w-7xl mx-auto px-6 py-8">

                    {/* Full Members */}
                    {(teamFilter === 'all' || teamFilter === 'full') && fullMembers.length > 0 && (
                        <div className="mb-12">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-8 bg-gradient-to-b from-indigo-500 to-violet-500 rounded-full"></div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">ICC Full Members</h2>
                                    <p className="text-xs text-slate-500 mt-0.5">{fullMembers.length} teams with Test status</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {fullMembers.map(team => (
                                    <button
                                        key={team.code}
                                        onClick={() => selectTeam(team)}
                                        className={`group relative overflow-hidden rounded-2xl ${team.bg} border ${team.border} p-5 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:border-white/20`}
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-br ${team.gradient} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-3xl">{team.flag}</span>
                                                <span className="text-xs font-bold bg-white/10 text-white/70 px-2 py-1 rounded-lg">{team.code}</span>
                                            </div>
                                            <h3 className="text-lg font-bold text-white group-hover:text-blue-200 transition-colors">{team.name}</h3>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                                    Full Member
                                                </span>
                                                {teamCounts[team.name] && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-medium">
                                                        {teamCounts[team.name]} players
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-3 flex items-center text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
                                                <span>View Squad</span>
                                                <svg className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Associate Members */}
                    {(teamFilter === 'all' || teamFilter === 'associate') && associates.length > 0 && (
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-8 bg-gradient-to-b from-teal-500 to-emerald-500 rounded-full"></div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">ICC Associate Members</h2>
                                    <p className="text-xs text-slate-500 mt-0.5">{associates.length} teams</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {associates.map(team => (
                                    <button
                                        key={team.code}
                                        onClick={() => selectTeam(team)}
                                        className={`group relative overflow-hidden rounded-2xl ${team.bg} border ${team.border} p-5 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:border-white/20`}
                                    >
                                        <div className={`absolute inset-0 bg-gradient-to-br ${team.gradient} opacity-5 group-hover:opacity-15 transition-opacity`}></div>
                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-3xl">{team.flag}</span>
                                                <span className="text-xs font-bold bg-white/10 text-white/70 px-2 py-1 rounded-lg">{team.code}</span>
                                            </div>
                                            <h3 className="text-lg font-bold text-white group-hover:text-teal-200 transition-colors">{team.name}</h3>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/20 font-semibold">
                                                    Associate
                                                </span>
                                                {teamCounts[team.name] && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-medium">
                                                        {teamCounts[team.name]} players
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-3 flex items-center text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
                                                <span>View Squad</span>
                                                <svg className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {filteredTeams.length === 0 && (
                        <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 border-dashed">
                            <div className="text-5xl mb-4">{'\u{1F50D}'}</div>
                            <h3 className="text-xl font-bold text-white">No Teams Found</h3>
                            <p className="text-slate-400 mt-2">Try adjusting your search or filter.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ==================== ROSTER VIEW ====================
    return (
        <div className='min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 font-sans text-slate-200'>

            {/* Team Header */}
            <div className="relative overflow-hidden bg-slate-900/60 backdrop-blur-xl border-b border-white/10">
                <div className={`absolute inset-0 bg-gradient-to-r ${selectedTeam?.gradient || 'from-blue-600 to-indigo-600'} opacity-10`}></div>
                <div className="relative max-w-7xl mx-auto px-6 py-8">
                    <button
                        onClick={goBack}
                        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        All Teams
                    </button>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                            <div className="text-5xl">{selectedTeam?.flag}</div>
                            <div>
                                <h1 className="text-3xl font-bold text-white tracking-tight">{selectedTeam?.name}</h1>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className="text-sm font-bold text-slate-400">{selectedTeam?.code}</span>
                                    <span className="text-xs text-slate-600">{'\u2022'}</span>
                                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                                        selectedTeam?.icc === 'Full Member'
                                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                            : 'bg-teal-500/15 text-teal-300 border border-teal-500/20'
                                    }`}>{selectedTeam?.icc}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-black text-white">{displayPlayers.length}</div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider">Players</div>
                        </div>
                    </div>

                    {/* Search within team */}
                    <div className="mt-6 relative max-w-md">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input
                            type="text"
                            placeholder={`Search players in ${selectedTeam?.name}...`}
                            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {searching && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <svg className="w-4 h-4 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Players Grid */}
            <div className="max-w-7xl mx-auto px-6 py-8">

                {/* Sync Status Banner */}
                {syncStatus === 'syncing' && (
                    <div className="mb-6 flex items-center gap-3 px-5 py-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm">
                        <svg className="w-4 h-4 animate-spin flex-shrink-0" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                        <span>Syncing latest player data from live API... Showing cached data while updating.</span>
                    </div>
                )}
                {syncStatus === 'rate-limited' && (
                    <div className="mb-6 flex items-center gap-3 px-5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        <span>{notice || 'API rate limit reached. Showing cached data.'}</span>
                    </div>
                )}
                {notice && syncStatus !== 'rate-limited' && (
                    <div className="mb-6 flex items-center gap-3 px-5 py-3 rounded-xl bg-slate-500/10 border border-slate-500/30 text-slate-300 text-sm">
                        <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                        <span>{notice}</span>
                    </div>
                )}

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
                        <p className="text-slate-400">Fetching {selectedTeam?.name} players from live API...</p>
                        <p className="text-xs text-slate-600 mt-2">This may take a moment for the first load</p>
                    </div>
                ) : displayPlayers.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {displayPlayers.map((player, idx) => (
                                <PlayerCard key={player.apiId || player._id || idx} player={player} />
                            ))}
                        </div>

                        {searchResults === null && hasMore && (
                            <div className="mt-10 text-center">
                                <button
                                    onClick={loadMore}
                                    disabled={loadingMore}
                                    className="inline-flex items-center gap-3 px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold rounded-xl shadow-lg transition-all"
                                >
                                    {loadingMore ? (
                                        <>
                                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                                            Loading...
                                        </>
                                    ) : `Load More (${players.length} of ${total})`}
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 border-dashed">
                        <div className="text-5xl mb-4">{selectedTeam?.flag || '\u{1F3CF}'}</div>
                        <h3 className="text-xl font-bold text-white">No Players Found</h3>
                        <p className="text-slate-400 mt-2 max-w-md mx-auto">
                            {syncStatus === 'rate-limited'
                                ? 'API rate limit reached and no cached data available. Try again tomorrow.'
                                : syncStatus === 'error'
                                ? 'An error occurred while fetching players. Please try again.'
                                : `No players found for ${selectedTeam?.name} yet. The API is being queried — try refreshing in a few moments.`}
                        </p>
                        <button
                            onClick={() => selectedTeam && fetchTeamPlayers(selectedTeam.name, 0)}
                            className="mt-6 inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg transition-all text-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            Retry
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamsPage;