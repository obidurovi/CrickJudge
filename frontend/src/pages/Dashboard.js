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
        // 1. Unified Gradient Background for the ENTIRE page
        <div className='min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 font-sans text-slate-200'>
            
            {/* Header Content */}
            <div className="relative pt-12 pb-12 px-4 md:px-8">
                <div className="relative max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-12">
                    <div className="mb-8 md:mb-0 text-center md:text-left">
                        <h1 className='text-5xl md:text-6xl font-black tracking-tight mb-2 text-white drop-shadow-lg'>
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
                            className='group relative px-6 py-3 font-bold text-white transition-all duration-200 bg-white/10 border border-white/10 rounded-full hover:bg-white/20 backdrop-blur-md'
                        >
                            {loading ? 'Syncing...' : 'Refresh Data'}
                        </button>

                        <button 
                            onClick={generateTeam} 
                            className='px-8 py-3 font-bold text-white transition-all duration-200 bg-blue-600 rounded-full shadow-lg hover:bg-blue-500 hover:shadow-blue-500/50'
                        >
                            Generate Best XI
                        </button>
                    </div>
                </div>

                {/* Search Bar - Floating Glass Effect */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl shadow-2xl p-2 mb-12 flex items-center max-w-3xl mx-auto border border-white/10">
                    <div className="pl-4 text-slate-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <input 
                        type='text' 
                        placeholder='Search players by name, role, or country...' 
                        className='w-full p-4 text-lg bg-transparent border-none focus:ring-0 text-white placeholder-slate-400 outline-none'
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 pb-20">
                {/* Best XI Section */}
                {team.length > 0 && (
                    <section className='mb-16 animate-fade-in-up'>
                        <div className='flex items-center justify-between mb-8'>
                            <h2 className='text-3xl font-bold text-white flex items-center gap-3'>
                                <span className="text-yellow-400 text-2xl">🏆</span>
                                Dream Team XI
                            </h2>
                            <button onClick={() => setTeam([])} className='text-slate-400 hover:text-red-400 text-sm font-medium transition-colors'>
                                Clear Selection
                            </button>
                        </div>
                        
                        <div className='bg-white/5 p-8 rounded-3xl border border-white/10 shadow-xl backdrop-blur-sm'>
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

                {/* Database Section */}
                <section>
                    <div className='flex items-center justify-between mb-8'>
                        <h2 className='text-2xl font-bold text-white'>
                            Player Database
                            <span className='ml-3 text-sm font-normal text-slate-300 bg-white/10 border border-white/5 px-3 py-1 rounded-full'>{players.length} Players</span>
                        </h2>
                    </div>

                    {players.length === 0 ? (
                        <div className='text-center py-32 bg-white/5 rounded-3xl border-2 border-dashed border-white/10'>
                            <p className='text-slate-400 text-xl font-medium'>No players found.</p>
                        </div>
                    ) : (
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                            {players.map(player => (
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

export default Dashboard;
