import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import PlayerCard from '../components/PlayerCard';

const API = 'http://localhost:5000/api/players';

const TeamsPage = () => {
    const [players, setPlayers] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState('All');
    const [search, setSearch] = useState('');
    const [searching, setSearching] = useState(false);
    const [countries, setCountries] = useState(['All']);
    const [loading, setLoading] = useState(false);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [total, setTotal] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchResults, setSearchResults] = useState(null);

    const fetchPlayers = useCallback(async (newOffset = 0, append = false) => {
        if (append) setLoadingMore(true);
        else setLoading(true);
        try {
            const { data } = await axios.get(`${API}?offset=${newOffset}`);
            if (append) {
                setPlayers(prev => [...prev, ...(data.players || [])]);
            } else {
                setPlayers(data.players || []);
            }
            setTotal(data.total || 0);
            setHasMore(data.hasMore || false);
            setOffset(newOffset);
        } catch (error) {
            console.error("Error fetching players", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, []);

    const fetchCountries = useCallback(async () => {
        try {
            const { data } = await axios.get(`${API}/countries`);
            setCountries(['All', ...data]);
        } catch (error) {
            const unique = [...new Set(players.map(p => p.country))].filter(Boolean).sort();
            setCountries(['All', ...unique]);
        }
    }, [players]);

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
        fetchCountries();
    }, [fetchPlayers, fetchCountries]);

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
        if (!loadingMore && hasMore) {
            fetchPlayers(offset + 25, true);
        }
    };

    const displayPlayers = searchResults !== null ? searchResults : players;

    const filteredPlayers = displayPlayers.filter(player => {
        if (selectedTeam === 'All') return true;
        return player.country === selectedTeam;
    });

    return (
        <div className='min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 font-sans text-slate-200 flex flex-col'>
            
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-white/10 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center gap-3">
                            <Link to="/" className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-white tracking-tight">Team Directory</h1>
                                <p className="text-xs text-indigo-300 font-medium tracking-wide">GLOBAL DATABASE</p>
                            </div>
                        </div>
                        <Link to="/" className="text-slate-400 hover:text-white transition-colors">Back to Dashboard</Link>
                    </div>
                </div>
            </nav>

            <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full">
                
                {/* Sidebar / Filter Panel */}
                <aside className="w-full md:w-72 bg-slate-900/50 border-r border-white/5 p-6 flex flex-col gap-6 h-auto md:min-h-[calc(100vh-80px)]">
                    
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Search any player..." 
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        {searching && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <svg className="w-4 h-4 text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Countries</h3>
                        
                        <div className="space-y-1">
                            {countries.map(team => (
                                <button
                                    key={team}
                                    onClick={() => setSelectedTeam(team)}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between group ${
                                        selectedTeam === team 
                                        ? 'bg-white/10 text-white border border-white/10 shadow-sm' 
                                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                    }`}
                                >
                                    <span>{team}</span>
                                    {team !== 'All' && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${selectedTeam === team ? 'bg-white text-slate-900' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700'}`}>
                                            {displayPlayers.filter(p => p.country === team).length}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                    
                    {/* Header */}
                    <div className="mb-8 flex items-end justify-between border-b border-white/10 pb-6">
                        <div>
                            <span className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1 block">
                                {selectedTeam}
                            </span>
                            <h2 className="text-4xl font-bold text-white">
                                {selectedTeam === 'All' ? 'All Players' : selectedTeam}
                            </h2>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-black text-white">{filteredPlayers.length}</div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider">Players</div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32">
                            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
                            <p className="text-slate-400">Loading players...</p>
                        </div>
                    ) : filteredPlayers.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                                {filteredPlayers.map((player, idx) => (
                                    <PlayerCard key={player.apiId || player._id || idx} player={player} />
                                ))}
                            </div>
                            {searchResults === null && hasMore && selectedTeam === 'All' && (
                                <div className="mt-10 text-center">
                                    <button
                                        onClick={loadMore}
                                        disabled={loadingMore}
                                        className="inline-flex items-center gap-3 px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold rounded-xl shadow-lg transition-all"
                                    >
                                        {loadingMore ? 'Loading...' : `Load More (${players.length} of ${total.toLocaleString()})`}
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 border-dashed">
                            <div className="text-6xl mb-4">🏏</div>
                            <h3 className="text-xl font-bold text-white">No Players Found</h3>
                            <p className="text-slate-400 mt-2">Try adjusting your search or selecting a different country.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default TeamsPage;