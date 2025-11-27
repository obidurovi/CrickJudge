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
        <div className="p-8 text-slate-200 min-h-screen">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-500 tracking-tight flex items-center justify-center gap-3">
                    <svg className="w-10 h-10 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    CrickJudge Arena
                </h2>
                <p className="text-slate-500 mt-2">Head-to-head statistical comparison engine</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Player 1 Selector */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-xl backdrop-blur-sm">
                        <label className="block text-blue-400 text-sm font-bold mb-2">Select Player 1 (Blue)</label>
                        <select 
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                            onChange={(e) => setP1(players.find(p => p._id === e.target.value))}
                        >
                            <option value="">Choose Challenger...</option>
                            {players.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>
                        
                        {p1 && (
                            <div className="mt-6 text-center animate-fade-in">
                                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg mb-4">
                                    {p1.name[0]}
                                </div>
                                <h3 className="text-xl font-bold">{p1.name}</h3>
                                <p className="text-blue-400 text-sm">{p1.role}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Arena (Chart) */}
                <div className="lg:col-span-6 bg-slate-800/30 rounded-3xl border border-slate-700/50 p-4 flex items-center justify-center min-h-[400px] relative overflow-hidden">
                    {(!p1 || !p2) ? (
                        <div className="text-center text-slate-600">
                            <svg className="w-20 h-20 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                            <p>Select two players to initialize the comparison engine.</p>
                        </div>
                    ) : (
                        <div className="w-full h-[400px] animate-scale-in">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getChartData()}>
                                    <PolarGrid stroke="#334155" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                    <Radar name={p1.name} dataKey="A" stroke="#3b82f6" strokeWidth={3} fill="#3b82f6" fillOpacity={0.3} />
                                    <Radar name={p2.name} dataKey="B" stroke="#a855f7" strokeWidth={3} fill="#a855f7" fillOpacity={0.3} />
                                    <Legend />
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}/>
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Player 2 Selector */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 shadow-xl backdrop-blur-sm">
                        <label className="block text-purple-400 text-sm font-bold mb-2">Select Player 2 (Purple)</label>
                        <select 
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-purple-500 outline-none"
                            onChange={(e) => setP2(players.find(p => p._id === e.target.value))}
                        >
                            <option value="">Choose Opponent...</option>
                            {players.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                        </select>

                        {p2 && (
                            <div className="mt-6 text-center animate-fade-in">
                                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg mb-4">
                                    {p2.name[0]}
                                </div>
                                <h3 className="text-xl font-bold">{p2.name}</h3>
                                <p className="text-purple-400 text-sm">{p2.role}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CrickJudge;