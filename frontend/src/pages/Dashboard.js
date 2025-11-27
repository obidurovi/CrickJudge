import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PlayerCard from '../components/PlayerCard';

const Dashboard = () => {
    const [players, setPlayers] = useState([]);
    const [team, setTeam] = useState([]);
    const [search, setSearch] = useState('');
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

    return (
        <div className='min-h-screen bg-slate-50 font-sans text-slate-900'>
            {/* Hero Section with Gradient */}
            <div className="relative bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white pb-32 pt-12 px-4 md:px-8 shadow-2xl overflow-hidden">
                {/* Abstract Background Shapes */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>

                <div className="relative max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-8 md:mb-0 text-center md:text-left">
                        <h1 className='text-5xl md:text-6xl font-black tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-white'>
                            CrickJudge
                        </h1>
                        <p className='text-blue-200 text-lg md:text-xl font-light tracking-wide'>
                            Advanced Team Selector & Analytics
                        </p>
                    </div>
                    
                    <div className='flex flex-col sm:flex-row gap-4'>
                         <button 
                            onClick={scrapeData} 
                            disabled={loading}
                            className='group relative px-6 py-3 font-bold text-white transition-all duration-200 bg-white/10 border border-white/20 rounded-full hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 backdrop-blur-sm'
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Syncing DB...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                    Refresh Data
                                </span>
                            )}
                        </button>

                        <button 
                            onClick={generateTeam} 
                            className='px-8 py-3 font-bold text-white transition-all duration-200 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500'
                        >
                            Generate Best XI
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-20 relative z-10">
                {/* Floating Search Bar */}
                <div className="bg-white rounded-2xl shadow-xl p-2 mb-12 flex items-center max-w-3xl mx-auto border border-slate-100">
                    <div className="pl-4 text-slate-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <input 
                        type='text' 
                        placeholder='Search players by name, role, or country...' 
                        className='w-full p-4 text-lg bg-transparent border-none focus:ring-0 text-slate-700 placeholder-slate-400 outline-none'
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Best XI Section */}
                {team.length > 0 && (
                    <section className='mb-16 animate-fade-in-up'>
                        <div className='flex items-center justify-between mb-8'>
                            <h2 className='text-3xl font-bold text-slate-800 flex items-center gap-3'>
                                <span className="bg-emerald-100 text-emerald-600 p-2 rounded-lg text-2xl">🏆</span>
                                Dream Team XI
                            </h2>
                            <button onClick={() => setTeam([])} className='text-slate-400 hover:text-red-500 text-sm font-medium transition-colors'>
                                Clear Selection
                            </button>
                        </div>
                        
                        <div className='bg-gradient-to-b from-emerald-50 to-white p-8 rounded-3xl border border-emerald-100 shadow-lg relative overflow-hidden'>
                            <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
                                {team.map((p, index) => (
                                    <div key={p._id} className='relative group'>
                                        <div className='absolute -top-4 -left-4 w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl flex items-center justify-center font-bold shadow-lg z-20 border-2 border-white transform group-hover:scale-110 transition-transform'>
                                            {index + 1}
                                        </div>
                                        <div className="transform transition-all duration-300 hover:-translate-y-2">
                                            <PlayerCard player={p} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Database Section */}
                <section className="pb-20">
                    <div className='flex items-center justify-between mb-8'>
                        <h2 className='text-2xl font-bold text-slate-800'>
                            Player Database
                            <span className='ml-3 text-sm font-normal text-slate-500 bg-slate-200 px-3 py-1 rounded-full'>{players.length} Players</span>
                        </h2>
                    </div>

                    {players.length === 0 ? (
                        <div className='text-center py-32 bg-white rounded-3xl border-2 border-dashed border-slate-200'>
                            <div className="text-6xl mb-4">🏏</div>
                            <p className='text-slate-500 text-xl font-medium'>No players found.</p>
                            <p className='text-slate-400 mt-2'>Hit "Refresh Data" to scout some talent.</p>
                        </div>
                    ) : (
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                            {players.map(player => (
                                <div key={player._id} className="transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
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

export default Dashboard;
