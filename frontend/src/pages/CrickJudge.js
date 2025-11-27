import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

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
                            <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white tracking-tight">Versus Arena</h1>
                                <p className="text-xs text-rose-300 font-medium tracking-wide">COMPARISON ENGINE</p>
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
                            <label className="block text-blue-400 text-sm font-bold mb-3 uppercase tracking-wider">Challenger (Blue)</label>
                            <select 
                                className="w-full bg-slate-800/50 border border-slate-600 text-white rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                onChange={(e) => setP1(players.find(p => p._id === e.target.value))}
                            >
                                <option value="">Select Player...</option>
                                {players.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                            </select>
                            
                            {p1 && (
                                <div className="mt-8 text-center animate-fade-in">
                                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg mb-4 border border-white/20">
                                        {p1.name[0]}
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
                            <label className="block text-purple-400 text-sm font-bold mb-3 uppercase tracking-wider">Opponent (Purple)</label>
                            <select 
                                className="w-full bg-slate-800/50 border border-slate-600 text-white rounded-xl p-3 focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                onChange={(e) => setP2(players.find(p => p._id === e.target.value))}
                            >
                                <option value="">Select Player...</option>
                                {players.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                            </select>

                            {p2 && (
                                <div className="mt-8 text-center animate-fade-in">
                                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg mb-4 border border-white/20">
                                        {p2.name[0]}
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