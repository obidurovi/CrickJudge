import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';

const AnalyticsHub = () => {
    const [players, setPlayers] = useState([]);

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

    // Process Data for Pie Chart (Roles)
    const roleData = [
        { name: 'Batsman', value: players.filter(p => p.role === 'Batsman').length },
        { name: 'Bowler', value: players.filter(p => p.role === 'Bowler').length },
        { name: 'Allrounder', value: players.filter(p => p.role === 'Allrounder').length },
        { name: 'Wicketkeeper', value: players.filter(p => p.role === 'Wicketkeeper').length },
    ].filter(item => item.value > 0);

    const COLORS = ['#3b82f6', '#ef4444', '#a855f7', '#f59e0b'];

    // Process Data for Scatter Plot (Avg vs Strike Rate)
    const scatterData = players.map(p => ({
        name: p.name,
        x: p.stats.average,
        y: p.stats.strikeRate,
        role: p.role
    }));

    return (
        <div className='min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 font-sans text-slate-200'>
             {/* Navbar */}
             <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-white/10 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center gap-3">
                            <Link to="/" className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-white tracking-tight">Analytics Hub</h1>
                                <p className="text-xs text-emerald-300 font-medium tracking-wide">DATA VISUALIZATION</p>
                            </div>
                        </div>
                        <Link to="/" className="text-slate-400 hover:text-white transition-colors">Back to Dashboard</Link>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Pie Chart Section */}
                    <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-xl">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <span className="text-blue-400">●</span> Player Role Distribution
                        </h2>
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={roleData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={140}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {roleData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff', borderRadius: '12px' }}
                                        itemStyle={{ color: '#e2e8f0' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Scatter Plot Section */}
                    <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-xl">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <span className="text-purple-400">●</span> Batting Performance (Avg vs SR)
                        </h2>
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis type="number" dataKey="x" name="Average" unit="" stroke="#94a3b8" label={{ value: 'Batting Average', position: 'insideBottom', offset: -10, fill: '#94a3b8' }} />
                                    <YAxis type="number" dataKey="y" name="Strike Rate" unit="" stroke="#94a3b8" label={{ value: 'Strike Rate', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                                    <Tooltip cursor={{ strokeDasharray: '3 3' }} 
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl">
                                                        <p className="text-white font-bold">{payload[0].payload.name}</p>
                                                        <p className="text-blue-400 text-sm">Avg: {payload[0].value}</p>
                                                        <p className="text-purple-400 text-sm">SR: {payload[1].value}</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Scatter name="Players" data={scatterData} fill="#8884d8">
                                        {scatterData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.role === 'Bowler' ? '#ef4444' : '#3b82f6'} />
                                        ))}
                                    </Scatter>
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsHub;