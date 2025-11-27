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
            const { data } = await axios.get(\http://localhost:5000/api/players?search=\\);
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
            fetchPlayers(); // Refresh list
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
            // Scroll to top to see the team
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
        <div className='min-h-screen bg-gray-50 p-4 md:p-8'>
            {/* Header */}
            <header className='flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100'>
                <div>
                    <h1 className='text-3xl font-extrabold text-blue-900 tracking-tight'>CrickJudge</h1>
                    <p className='text-gray-500 text-sm mt-1'>AI-Powered Team Selector & Analytics</p>
                </div>
                <div className='flex space-x-3 mt-4 md:mt-0'>
                    <button 
                        onClick={scrapeData} 
                        disabled={loading}
                        className='bg-gray-800 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-gray-900 transition disabled:opacity-50'
                    >
                        {loading ? 'Scraping...' : 'Refresh Data'}
                    </button>
                    <button 
                        onClick={generateTeam} 
                        className='bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition shadow-lg shadow-blue-200'
                    >
                        Generate Best XI
                    </button>
                </div>
            </header>

            {/* Best XI Section (Conditional Render) */}
            {team.length > 0 && (
                <section className='mb-12 animate-fade-in'>
                    <div className='flex items-center justify-between mb-6'>
                        <h2 className='text-2xl font-bold text-gray-800 border-l-4 border-green-500 pl-3'>
                            Generated Best XI
                        </h2>
                        <button onClick={() => setTeam([])} className='text-red-500 text-sm hover:underline'>Clear Team</button>
                    </div>
                    
                    <div className='bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100'>
                        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5'>
                            {team.map((p, index) => (
                                <div key={p._id} className='relative'>
                                    <div className='absolute -top-3 -left-3 bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-md z-10'>
                                        {index + 1}
                                    </div>
                                    <PlayerCard player={p} />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Search & Database Section */}
            <section>
                <div className='flex flex-col md:flex-row justify-between items-center mb-6'>
                    <h2 className='text-xl font-bold text-gray-800'>Player Database <span className='text-gray-400 font-normal'>({players.length})</span></h2>
                    <input 
                        type='text' 
                        placeholder='Search by name...' 
                        className='w-full md:w-64 p-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition'
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {players.length === 0 ? (
                    <div className='text-center py-20 bg-white rounded-xl border border-dashed border-gray-300'>
                        <p className='text-gray-500 text-lg'>No players found.</p>
                        <p className='text-gray-400 text-sm'>Try clicking "Refresh Data" to seed the database.</p>
                    </div>
                ) : (
                    <div className='grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6'>
                        {players.map(player => (
                            <PlayerCard key={player._id} player={player} />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default Dashboard;
