import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import PlayerCard from '../components/PlayerCard';
import useSSE from '../hooks/useSSE';

const API = 'http://localhost:5000/api/players';

const Dashboard = () => {
    const [players, setPlayers] = useState([]);
    const [searchResults, setSearchResults] = useState(null);
    const [search, setSearch] = useState('');
    const [offset, setOffset] = useState(0);
    const [total, setTotal] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searching, setSearching] = useState(false);
    const [error, setError] = useState(null);
    const [notice, setNotice] = useState(null);

    const fetchPlayers = useCallback(async (newOffset = 0, append = false) => {
        if (append) setLoadingMore(true);
        else setLoading(true);
        setError(null);
        try {
            const { data } = await axios.get(`${API}?offset=${newOffset}`);
            if (data._notice) setNotice(data._notice);
            if (append) {
                setPlayers(prev => [...prev, ...data.players]);
            } else {
                setPlayers(data.players);
            }
            setTotal(data.total);
            setHasMore(data.hasMore);
            setOffset(newOffset);
        } catch (err) {
            if (err.response?.data?.code === 'API_KEY_MISSING') {
                setError('API key not configured. Add CRICKET_API_KEY to your backend .env file.');
            } else {
                setError('Failed to fetch players. Make sure the backend is running.');
            }
            if (err.response?.data?.code === 'RATE_LIMITED') {
                setError('CricAPI daily limit reached (100 req/day free tier). Try again tomorrow or upgrade your API plan.');
            }
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    const handleSearch = useCallback(async () => {
        if (!search || search.length < 2) {
            setSearchResults(null);
            return;
        }
        setSearching(true);
        try {
            const { data } = await axios.get(`${API}/search?q=${encodeURIComponent(search)}`);
            setSearchResults(data.players || []);
        } catch (err) {
            console.error('Search error:', err);
        } finally {
            setSearching(false);
        }
    }, [search]);

    useEffect(() => {
        fetchPlayers(0);
    }, [fetchPlayers]);

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

    // SSE: listen for crawl progress and refresh player list when new batches arrive
    const [syncProgress, setSyncProgress] = useState(null);
    const debounceRef = useRef(null);

    const debouncedFetchPlayers = useCallback(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchPlayers(0);
        }, 2000);
    }, [fetchPlayers]);

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    const sseHandlers = useMemo(() => ({
        'sync:progress': (data) => {
            setSyncProgress(data);
        },
        'sync:complete': () => {
            setSyncProgress(null);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            fetchPlayers(0);
        },
        'dashboard:crawlProgress': (data) => {
            setSyncProgress(prev => ({ ...prev, playersSaved: data.playersSaved, offset: data.offset, totalRows: data.totalRows }));
            debouncedFetchPlayers();
        }
    }), [fetchPlayers, debouncedFetchPlayers]);

    const { connected: sseConnected } = useSSE('/dashboard', sseHandlers);

    const loadMore = () => {
        if (!loadingMore && hasMore) {
            fetchPlayers(offset + 25, true);
        }
    };

    const displayPlayers = searchResults !== null ? searchResults : players;

    return (
        <div className='min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 font-sans text-slate-200'>
            
            {/* Modern Glass Navbar */}
            <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-white/10 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        
            {/* Logo Section */}
                        <div className="flex-shrink-0 flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white tracking-tight">CrickJudge</h1>
                                <p className="text-xs text-blue-300 font-medium tracking-wide">ANALYTICS ENGINE</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link to="/teams" className="hidden md:flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm font-medium">Teams</Link>
                            <Link to="/analytics" className="hidden md:flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm font-medium">Analytics</Link>
                            <Link to="/simulator" className="hidden md:flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm font-medium">Simulator</Link>
                            <Link to="/live-matches" className="hidden md:flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm font-medium">Live</Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                <section>
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-white mb-2">All Players</h2>
                        <div className="flex items-center gap-3 mb-6 flex-wrap">
                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs font-medium uppercase tracking-wider flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${sseConnected ? 'bg-emerald-400' : 'bg-yellow-400'}`}></span>
                                {sseConnected ? 'Live from CricAPI' : 'Connecting...'}
                            </span>
                            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-xs font-medium uppercase tracking-wider">
                                {searchResults !== null ? `${searchResults.length} Results` : `${total.toLocaleString()} Players`}
                            </span>
                            {searchResults !== null && (
                                <button
                                    onClick={() => { setSearch(''); setSearchResults(null); }}
                                    className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-xs font-medium uppercase tracking-wider hover:bg-red-500/20 transition-colors cursor-pointer"
                                >
                                    Clear Search
                                </button>
                            )}
                        </div>

                        <div className="bg-slate-800/40 border border-white/10 p-1.5 rounded-2xl flex items-center gap-2 backdrop-blur-sm">
                            <div className="relative flex-1 w-full">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    {searching ? (
                                        <svg className="w-5 h-5 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                                    ) : (
                                        <svg className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-11 pr-4 py-3 bg-transparent border-none text-white placeholder-slate-500 focus:ring-0 sm:text-sm"
                                    placeholder="Search any cricketer worldwide..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-8 bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
                            <p className="text-red-400 font-medium">{error}</p>
                        </div>
                    )}

                    {notice && !error && (
                        <div className="mb-8 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
                            <p className="text-amber-400 text-sm font-medium">{notice}</p>
                        </div>
                    )}

                    {syncProgress && !error && (
                        <div className="mb-8 bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-center gap-3">
                            <svg className="animate-spin h-4 w-4 text-blue-400" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                            </svg>
                            <p className="text-blue-400 text-sm font-medium">
                                Syncing player database... {syncProgress.progress || 0}% ({syncProgress.playersSaved || 0} players)
                            </p>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32">
                            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
                            <p className="text-slate-400">Fetching players from live API...</p>
                        </div>
                    ) : displayPlayers.length === 0 ? (
                        <div className='text-center py-32 bg-white/5 rounded-3xl border-2 border-dashed border-white/10'>
                            <div className="text-6xl mb-4">🏏</div>
                            <p className='text-slate-300 text-lg font-semibold mb-2'>
                                {searchResults !== null ? 'No players found' : 'No players available'}
                            </p>
                            <p className='text-slate-500 text-sm'>
                                {searchResults !== null ? 'Try a different search term.' : 'Check your API key and internet connection.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                                {displayPlayers.map((player, idx) => (
                                    <div key={player.apiId || player._id || idx} className="transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-900/20">
                                        <PlayerCard player={player} />
                                    </div>
                                ))}
                            </div>

                            {searchResults === null && hasMore && (
                                <div className="mt-10 text-center">
                                    <button
                                        onClick={loadMore}
                                        disabled={loadingMore}
                                        className="inline-flex items-center gap-3 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold rounded-xl shadow-lg transition-all"
                                    >
                                        {loadingMore ? (
                                            <>
                                                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                                                Loading...
                                            </>
                                        ) : (
                                            <>
                                                Load More Players
                                                <span className="text-blue-200 text-sm">({players.length} of {total.toLocaleString()})</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </section>
            </div>
        </div>
    );
};

export default Dashboard
