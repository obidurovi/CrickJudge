import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import PlayerCard from '../components/PlayerCard';

const Dashboard = () => {
    const [players, setPlayers] = useState([]);
    const [team, setTeam] = useState([]);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('All'); // New state for filter
    const [loading, setLoading] = useState(false);

    // Fetch players from Backend
    const fetchPlayers = async () => {
        try {
            const { data } = await axios.get(`http://localhost:5000/api/players?search=${search}`);
            setPlayers(data);
        } catch (error) {
            console.error('Error fetching players:', error);
        }
    };

    // Trigger Scraper
    const scrapeData = async () => {
        setLoading(true);
        try {
            await axios.post('http://localhost:5000/api/players/scrape');
            alert('Data scraped successfully! Database updated.');
            fetchPlayers();
        } catch (err) {
            alert('Error scraping data: ' + err.message);
        }
        setLoading(false);
    };

    // Generate Best Team
    const generateTeam = async () => {
        try {
            const { data } = await axios.get('http://localhost:5000/api/players/generate-team');
            setTeam(data);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            alert('Error generating team: ' + (err.response?.data?.message || err.message));
        }
    };

    useEffect(() => {
        fetchPlayers();
        // eslint-disable-next-line
    }, [search]);

    // Filter logic
    const filteredPlayers = players.filter(player => {
        if (roleFilter === 'All') return true;
        return player.role === roleFilter;
    });

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

                        {/* Right: Action Buttons */}
                        <div className="flex items-center gap-3">
                            {/* Navigation Links */}
                            <Link to="/teams" className="hidden md:flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm font-medium">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                Teams
                            </Link>
                            <Link to="/analytics" className="hidden md:flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm font-medium">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                                Analytics
                            </Link>
                            <Link to="/simulator" className="hidden md:flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm font-medium">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                Simulator
                            </Link>
                            <Link to="/compare" className="hidden md:flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors text-sm font-medium">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path></svg>
                                Compare
                            </Link>

                            <div className="h-6 w-px bg-slate-700 mx-2"></div>

                            <button 
                                onClick={scrapeData}
                                disabled={loading}
                                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                title="Refresh Database"
                            >
                                <svg className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                            </button>
                            
                            <button 
                                onClick={generateTeam}
                                className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-blue-900/20 transition-all transform hover:scale-105 active:scale-95"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                                Generate Best XI
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {/* Best XI Section */}
                {team.length > 0 && (
                    <section className='mb-12 animate-fade-in-up'>
                        <div className='flex items-center justify-between mb-6'>
                            <h2 className='text-2xl font-bold text-white flex items-center gap-3'>
                                <span className="text-yellow-400">🏆</span>
                                Dream Team XI
                            </h2>
                            <button onClick={() => setTeam([])} className='text-sm text-slate-400 hover:text-red-400 transition-colors'>
                                Clear Selection
                            </button>
                        </div>
                        
                        <div className='bg-white/5 p-6 rounded-3xl border border-white/10 shadow-xl backdrop-blur-sm'>
                            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                                {team.map((p, index) => (
                                    <div key={p._id} className='relative group'>
                                        <div className='absolute -top-3 -left-3 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold shadow-lg z-20 border border-white/20'>
                                            {index + 1}
                                        </div>
                                        <PlayerCard player={p} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Database Section - Redesigned */}
                <section>
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold text-white mb-2">Player Archive</h2>
                        <div className="flex items-center gap-3 mb-6">
                            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-xs font-medium uppercase tracking-wider">Live Sync</span>
                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs font-medium uppercase tracking-wider">{filteredPlayers.length} Records</span>
                        </div>

                        {/* Filter Bar Container */}
                        <div className="bg-slate-800/40 border border-white/10 p-1.5 rounded-2xl flex flex-col md:flex-row items-center gap-2 backdrop-blur-sm">
                            {/* Search Input */}
                            <div className="relative flex-1 w-full">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-11 pr-4 py-3 bg-transparent border-none text-white placeholder-slate-500 focus:ring-0 sm:text-sm"
                                    placeholder="Search database..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            
                            {/* Divider */}
                            <div className="hidden md:block w-px h-8 bg-white/10 mx-2"></div>

                            {/* Filter Buttons */}
                            <div 
                                className="flex items-center gap-1 w-full md:w-auto overflow-x-auto overflow-y-hidden pb-2 md:pb-0 px-2 md:px-0 no-scrollbar"
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            >
                                {/* Hide scrollbar for Chrome/Safari/Opera */}
                                <style>{`
                                    .no-scrollbar::-webkit-scrollbar {
                                        display: none;
                                    }
                                `}</style>
                                {['All', 'Batsman', 'Bowler', 'Allrounder', 'Wicketkeeper'].map((role) => (
                                    <button
                                        key={role}
                                        onClick={() => setRoleFilter(role)}
                                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                                            roleFilter === role 
                                            ? 'bg-white text-slate-900 shadow-lg transform scale-105' 
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        {role}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Grid */}
                    {filteredPlayers.length === 0 ? (
                        <div className='text-center py-32 bg-white/5 rounded-3xl border-2 border-dashed border-white/10'>
                            <p className='text-slate-400 text-lg'>No players found matching your criteria.</p>
                        </div>
                    ) : (
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                            {filteredPlayers.map(player => (
                                <div key={player._id} className="transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-900/20">
                                    <PlayerCard player={player} />
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default Dashboard
