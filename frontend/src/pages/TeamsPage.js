import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import PlayerCard from '../components/PlayerCard';

// --- Static Data for Leagues & Teams ---
const LEAGUE_DATA = {
    "IPL": ["Chennai Super Kings", "Delhi Capitals", "Gujarat Titans", "Kolkata Knight Riders", "Lucknow Super Giants", "Mumbai Indians", "Punjab Kings", "Royal Challengers Bangalore", "Rajasthan Royals", "Sunrisers Hyderabad"],
    "BPL": ["Chattogram Challengers", "Comilla Victorians", "Durdanto Dhaka", "Fortune Barishal", "Khulna Tigers", "Rangpur Riders", "Sylhet Strikers"],
    "PSL": ["Islamabad United", "Karachi Kings", "Lahore Qalandars", "Multan Sultans", "Peshawar Zalmi", "Quetta Gladiators"],
    "BBL": ["Adelaide Strikers", "Brisbane Heat", "Hobart Hurricanes", "Melbourne Renegades", "Melbourne Stars", "Perth Scorchers", "Sydney Sixers", "Sydney Thunder"],
    "The Hundred": ["Birmingham Phoenix", "London Spirit", "Manchester Originals", "Northern Superchargers", "Oval Invincibles", "Southern Brave", "Trent Rockets", "Welsh Fire"]
};

const TeamsPage = () => {
    const [players, setPlayers] = useState([]);
    const [category, setCategory] = useState('International'); // 'International' or 'Leagues'
    const [selectedTeam, setSelectedTeam] = useState('All');
    const [search, setSearch] = useState('');
    const [expandedLeagues, setExpandedLeagues] = useState({}); // For accordion

    useEffect(() => {
        const fetchPlayers = async () => {
            try {
                const { data } = await axios.get('http://localhost:5000/api/players');
                setPlayers(data);
                // Removed auto-selection of first country so it defaults to 'All'
            } catch (error) {
                console.error("Error fetching players", error);
            }
        };
        fetchPlayers();
    }, []);

    // Extract unique countries: Sort first, then add 'All' at the beginning
    const uniqueCountries = [...new Set(players.map(p => p.country))].sort();
    const countries = ['All', ...uniqueCountries];

    // Toggle Accordion
    const toggleLeague = (league) => {
        setExpandedLeagues(prev => ({ ...prev, [league]: !prev[league] }));
    };

    // Filter Logic
    const filteredPlayers = players.filter(player => {
        // 1. Search Filter
        if (search && !player.name.toLowerCase().includes(search.toLowerCase())) return false;

        // 2. Category & Team Filter
        if (category === 'International') {
            if (selectedTeam === 'All') return true;
            return player.country === selectedTeam;
        } else {
            // League Logic
            if (selectedTeam === 'All') return true;

            // Check if selectedTeam is a League Name (e.g. "IPL")
            if (LEAGUE_DATA[selectedTeam]) {
                // Check if player has an entry for this league in their DB record
                return player.leagues && player.leagues[selectedTeam];
            }

            // Check if selectedTeam is a specific Team Name (e.g. "Chennai Super Kings")
            // We need to check if ANY value in player.leagues matches selectedTeam
            if (player.leagues) {
                return Object.values(player.leagues).includes(selectedTeam);
            }
            
            return false;
        }
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
                    
                    {/* Category Switcher */}
                    <div className="bg-slate-800 p-1 rounded-xl flex">
                        <button 
                            onClick={() => { setCategory('International'); setSelectedTeam('All'); }}
                            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${category === 'International' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            Intl.
                        </button>
                        <button 
                            onClick={() => { setCategory('Leagues'); setSelectedTeam('All'); }}
                            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${category === 'Leagues' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            Leagues
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Find player..." 
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {/* Team List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                            {category === 'International' ? 'Countries' : 'Tournaments'}
                        </h3>
                        
                        <div className="space-y-1">
                            {category === 'International' ? (
                                countries.map(team => (
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
                                                {players.filter(p => p.country === team).length}
                                            </span>
                                        )}
                                    </button>
                                ))
                            ) : (
                                // League Accordion Structure
                                <>
                                    <button
                                        onClick={() => setSelectedTeam('All')}
                                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all mb-2 ${
                                            selectedTeam === 'All' 
                                            ? 'bg-white/10 text-white border border-white/10' 
                                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                        }`}
                                    >
                                        All Leagues
                                    </button>
                                    
                                    {Object.keys(LEAGUE_DATA).map(league => (
                                        <div key={league} className="mb-2">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => toggleLeague(league)}
                                                    className="p-2 text-slate-500 hover:text-white transition-colors"
                                                >
                                                    <svg className={`w-3 h-3 transition-transform ${expandedLeagues[league] ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                                </button>
                                                <button
                                                    onClick={() => setSelectedTeam(league)}
                                                    className={`flex-1 text-left py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-all ${
                                                        selectedTeam === league 
                                                        ? 'text-purple-400' 
                                                        : 'text-slate-300 hover:text-white'
                                                    }`}
                                                >
                                                    {league}
                                                </button>
                                            </div>

                                            {/* Teams List (Accordion Content) */}
                                            {expandedLeagues[league] && (
                                                <div className="ml-6 space-y-1 border-l border-white/10 pl-2 mt-1">
                                                    {LEAGUE_DATA[league].map(team => (
                                                        <button
                                                            key={team}
                                                            onClick={() => setSelectedTeam(team)}
                                                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all truncate ${
                                                                selectedTeam === team 
                                                                ? 'bg-purple-500/20 text-purple-200 border border-purple-500/30' 
                                                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                                            }`}
                                                        >
                                                            {team}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6 md:p-8 overflow-y-auto">
                    
                    {/* Header */}
                    <div className="mb-8 flex items-end justify-between border-b border-white/10 pb-6">
                        <div>
                            <span className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-1 block">
                                {category} • {selectedTeam}
                            </span>
                            <h2 className="text-4xl font-bold text-white">
                                {selectedTeam === 'All' ? 'All Players' : selectedTeam}
                            </h2>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-black text-white">{filteredPlayers.length}</div>
                            <div className="text-xs text-slate-500 uppercase tracking-wider">Squad Size</div>
                        </div>
                    </div>

                    {/* Grid */}
                    {filteredPlayers.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                            {filteredPlayers.map(player => (
                                <PlayerCard key={player._id} player={player} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 border-dashed">
                            <div className="text-6xl mb-4">🏏</div>
                            <h3 className="text-xl font-bold text-white">No Players Found</h3>
                            <p className="text-slate-400 mt-2">
                                {category === 'Leagues' 
                                    ? "Try selecting a different team or league." 
                                    : "Try adjusting your search or filters."}
                            </p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default TeamsPage;