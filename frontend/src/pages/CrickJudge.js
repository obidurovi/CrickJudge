import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

// --- Advanced Searchable Dropdown ---
const PlayerDropdown = ({ label, color, players, selectedId, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Focus search input when opened
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
        if (!isOpen) {
            setSearchTerm(''); // Reset search on close
        }
    }, [isOpen]);

    const selectedPlayer = players.find(p => p._id === selectedId);
    const filteredPlayers = players.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Theme Configuration
    const theme = {
        blue: {
            label: 'text-blue-400',
            borderFocus: 'focus:ring-blue-500 border-blue-500/50',
            icon: 'text-blue-500',
            itemHover: 'hover:bg-blue-600/20 hover:border-blue-500/30',
            itemSelected: 'bg-blue-600/20 border-blue-500/50',
            avatar: 'from-blue-500 to-cyan-500'
        },
        purple: {
            label: 'text-purple-400',
            borderFocus: 'focus:ring-purple-500 border-purple-500/50',
            icon: 'text-purple-500',
            itemHover: 'hover:bg-purple-600/20 hover:border-purple-500/30',
            itemSelected: 'bg-purple-600/20 border-purple-500/50',
            avatar: 'from-purple-500 to-pink-500'
        }
    }[color];

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <label className={`block ${theme.label} text-xs font-bold mb-2 uppercase tracking-widest`}>
                {label}
            </label>
            
            {/* Trigger Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-slate-900/60 backdrop-blur-sm border border-slate-700 text-white rounded-xl py-3 pl-3 pr-10 text-left focus:outline-none focus:ring-2 ${theme.borderFocus} transition-all duration-200 flex items-center gap-3 group hover:bg-slate-800/80 hover:border-slate-600 shadow-lg`}
            >
                {selectedPlayer ? (
                    <>
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${theme.avatar} flex-shrink-0 flex items-center justify-center text-xs font-bold shadow-md overflow-hidden border border-white/10`}>
                            {selectedPlayer.image ? (
                                <img src={selectedPlayer.image} alt={selectedPlayer.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-white text-sm">{selectedPlayer.name[0]}</span>
                            )}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="font-bold text-sm leading-tight truncate">{selectedPlayer.name}</span>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider leading-tight truncate">{selectedPlayer.role}</span>
                        </div>
                    </>
                ) : (
                    <span className="text-slate-400 font-medium ml-1 py-2">Select a player...</span>
                )}

                <span className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <svg className={`h-5 w-5 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </span>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute z-50 mt-2 w-full bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in-down origin-top ring-1 ring-black/5">
                    
                    {/* Search Bar */}
                    <div className="p-2 border-b border-slate-800 sticky top-0 bg-slate-900/95 z-10">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                            </div>
                            <input
                                ref={searchInputRef}
                                type="text"
                                className="w-full bg-slate-950 text-slate-200 text-sm rounded-lg pl-9 pr-3 py-2 border border-slate-800 focus:border-slate-600 focus:ring-0 placeholder-slate-600 outline-none transition-colors"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* List Items */}
                    <ul className="max-h-64 overflow-y-auto custom-scrollbar py-1">
                        {filteredPlayers.length === 0 ? (
                            <li className="px-4 py-3 text-sm text-slate-500 text-center">No players found</li>
                        ) : (
                            filteredPlayers.map((player) => (
                                <li
                                    key={player._id}
                                    onClick={() => {
                                        onSelect(player._id);
                                        setIsOpen(false);
                                    }}
                                    className={`cursor-pointer select-none relative px-3 py-2 mx-2 my-1 rounded-lg border border-transparent transition-all duration-150 group ${selectedId === player._id ? theme.itemSelected : theme.itemHover}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-9 h-9 rounded-full bg-slate-800 flex-shrink-0 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:text-white group-hover:bg-slate-700 transition-colors overflow-hidden border border-slate-700 ${selectedId === player._id ? `bg-gradient-to-br ${theme.avatar} text-white border-white/20` : ''}`}>
                                            {player.image ? (
                                                <img src={player.image} alt={player.name} className="w-full h-full object-cover" />
                                            ) : (
                                                player.name[0]
                                            )}
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <span className={`text-sm font-medium truncate ${selectedId === player._id ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                                                {player.name}
                                            </span>
                                            <span className="text-[10px] text-slate-500 uppercase tracking-wider truncate">
                                                {player.role} • {player.country}
                                            </span>
                                        </div>
                                        {selectedId === player._id && (
                                            <div className="ml-auto">
                                                <svg className={`h-5 w-5 ${theme.icon}`} viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

// --- Main Page Component ---
const CrickJudge = () => {
    const [players, setPlayers] = useState([]);
    const [p1, setP1] = useState(null);
    const [p2, setP2] = useState(null);

    useEffect(() => {
        const fetchPlayers = async () => {
            try {
                const { data } = await axios.get('http://localhost:5000/api/players');
                setPlayers(data);
            } catch (error) {
                console.error("Error fetching players", error);
            }
        };
        fetchPlayers();
    }, []);

    // Normalize data for Radar Chart (0-100 scale)
    const getChartData = () => {
        if (!p1 || !p2) return [];
        
        // Helper to normalize stats roughly to 100
        const norm = (val, max) => (val / max) * 100;

        return [
            { subject: 'Batting Avg', A: norm(p1.stats.average, 60), B: norm(p2.stats.average, 60), fullMark: 100 },
            { subject: 'Strike Rate', A: norm(p1.stats.strikeRate, 160), B: norm(p2.stats.strikeRate, 160), fullMark: 100 },
            { subject: 'Wickets', A: norm(p1.stats.wickets, 600), B: norm(p2.stats.wickets, 600), fullMark: 100 },
            { subject: 'Economy', A: 100 - norm(p1.stats.economy, 12), B: 100 - norm(p2.stats.economy, 12), fullMark: 100 }, // Lower is better
            { subject: 'Experience', A: norm(p1.stats.matches, 500), B: norm(p2.stats.matches, 500), fullMark: 100 },
        ];
    };

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
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Player 1 Selector */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-xl">
                            
                            {/* Custom Dropdown for Player 1 */}
                            <PlayerDropdown 
                                label="Challenger (Blue)"
                                color="blue"
                                players={players}
                                selectedId={p1?._id}
                                onSelect={(id) => setP1(players.find(p => p._id === id))}
                            />
                            
                            {p1 && (
                                <div className="mt-8 text-center animate-fade-in">
                                    <div className="w-32 h-32 mx-auto bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-2xl mb-4 border-4 border-slate-800 overflow-hidden relative ring-4 ring-blue-500/20">
                                        {p1.image ? (
                                            <img src={p1.image} alt={p1.name} className="w-full h-full object-cover" />
                                        ) : (
                                            p1.name[0]
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold text-white">{p1.name}</h3>
                                    <span className="inline-block mt-2 px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-bold rounded-full border border-blue-500/30">
                                        {p1.role}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Arena (Chart) */}
                    <div className="lg:col-span-6">
                        <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-6 flex items-center justify-center min-h-[500px] relative overflow-hidden shadow-2xl">
                            {(!p1 || !p2) ? (
                                <div className="text-center text-slate-500">
                                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <svg className="w-10 h-10 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                                    </div>
                                    <h3 className="text-xl font-medium text-slate-300">Comparison Engine Idle</h3>
                                    <p className="mt-2 text-sm">Select two players to initialize the battle simulation.</p>
                                </div>
                            ) : (
                                <div className="w-full h-[450px] animate-scale-in">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={getChartData()}>
                                            <PolarGrid stroke="#334155" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                            <Radar name={p1.name} dataKey="A" stroke="#3b82f6" strokeWidth={3} fill="#3b82f6" fillOpacity={0.4} />
                                            <Radar name={p2.name} dataKey="B" stroke="#a855f7" strokeWidth={3} fill="#a855f7" fillOpacity={0.4} />
                                            <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '12px' }}
                                                itemStyle={{ color: '#e2e8f0' }}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Player 2 Selector */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-xl">
                            
                            {/* Custom Dropdown for Player 2 */}
                            <PlayerDropdown 
                                label="Opponent (Purple)"
                                color="purple"
                                players={players}
                                selectedId={p2?._id}
                                onSelect={(id) => setP2(players.find(p => p._id === id))}
                            />

                            {p2 && (
                                <div className="mt-8 text-center animate-fade-in">
                                    <div className="w-32 h-32 mx-auto bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-2xl mb-4 border-4 border-slate-800 overflow-hidden relative ring-4 ring-purple-500/20">
                                        {p2.image ? (
                                            <img src={p2.image} alt={p2.name} className="w-full h-full object-cover" />
                                        ) : (
                                            p2.name[0]
                                        )}
                                    </div>
                                    <h3 className="text-xl font-bold text-white">{p2.name}</h3>
                                    <span className="inline-block mt-2 px-3 py-1 bg-purple-500/20 text-purple-300 text-xs font-bold rounded-full border border-purple-500/30">
                                        {p2.role}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CrickJudge;