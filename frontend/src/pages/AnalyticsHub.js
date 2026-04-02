import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import useSSE from '../hooks/useSSE';

const ROLE_COLORS = {
    Batsman: '#3b82f6',
    Bowler: '#f97316',
    Allrounder: '#22c55e',
    Wicketkeeper: '#0ea5e9'
};

const PIE_COLORS = Object.values(ROLE_COLORS);

const ScatterTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    const point = payload[0]?.payload;
    if (!point) return null;

    return (
        <div className="rounded-xl border border-slate-700/80 bg-slate-950/95 px-3 py-2 shadow-xl">
            <p className="text-sm font-semibold text-white">{point.name}</p>
            <p className="text-xs text-blue-300">Average: {Number(point.x || 0).toFixed(2)}</p>
            <p className="text-xs text-cyan-300">Strike Rate: {Number(point.y || 0).toFixed(2)}</p>
            <p className="text-[11px] text-slate-400">Role: {point.role || 'Unknown'}</p>
        </div>
    );
};

const AnalyticsHub = () => {
    const [players, setPlayers] = useState([]);

    const fetchPlayers = useCallback(async () => {
        try {
            const { data } = await axios.get('http://localhost:5000/api/players?offset=0');
            const list = data.players || data;
            setPlayers(Array.isArray(list) ? list.filter(p => p.stats) : []);
        } catch (error) {
            console.error("Error fetching players", error);
        }
    }, []);

    useEffect(() => {
        fetchPlayers();
    }, [fetchPlayers]);

    // SSE: refresh analytics data when sync completes
    const debounceRef = useRef(null);

    const debouncedFetchPlayers = useCallback(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            fetchPlayers();
        }, 2000);
    }, [fetchPlayers]);

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    const sseHandlers = useMemo(() => ({
        'sync:complete': () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            fetchPlayers();
        },
        'dashboard:crawlProgress': () => {
            debouncedFetchPlayers();
        }
    }), [fetchPlayers, debouncedFetchPlayers]);

    const { connected: sseConnected } = useSSE('/dashboard', sseHandlers);

    // Process Data for Pie Chart (Roles)
    const roleData = [
        { name: 'Batsman', value: players.filter(p => p.role === 'Batsman').length },
        { name: 'Bowler', value: players.filter(p => p.role === 'Bowler').length },
        { name: 'Allrounder', value: players.filter(p => p.role === 'Allrounder').length },
        { name: 'Wicketkeeper', value: players.filter(p => p.role === 'Wicketkeeper').length },
    ].filter(item => item.value > 0);

    // Process Data for Scatter Plot (Avg vs Strike Rate) — exclude players with no meaningful stats
    const scatterData = players
        .filter(p => p.stats?.average > 0 || p.stats?.strikeRate > 0)
        .map(p => ({
            name: p.name,
            x: p.stats.average,
            y: p.stats.strikeRate,
            role: p.role
        }));

    const summaryCards = [
        {
            label: 'Tracked Players',
            value: players.length.toLocaleString(),
            tone: 'text-blue-200'
        },
        {
            label: 'Role Buckets',
            value: roleData.length,
            tone: 'text-cyan-200'
        },
        {
            label: 'Scatter Samples',
            value: scatterData.length,
            tone: 'text-emerald-200'
        },
        {
            label: 'Live Feed',
            value: sseConnected ? 'Connected' : 'Reconnect',
            tone: sseConnected ? 'text-emerald-200' : 'text-amber-200'
        }
    ];

    return (
        <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 font-sans text-slate-200">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-16 left-10 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl"></div>
                <div className="absolute top-28 right-0 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl"></div>
            </div>

            <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/80 shadow-lg backdrop-blur-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center gap-3">
                            <Link to="/" className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-white tracking-tight">Analytics Hub</h1>
                                <p className="text-xs text-emerald-300 font-medium tracking-wide flex items-center gap-1.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${sseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-yellow-400'}`}></span>
                                    DATA VISUALIZATION
                                </p>
                            </div>
                        </div>
                        <Link to="/" className="text-slate-400 hover:text-white transition-colors">Back to Dashboard</Link>
                    </div>
                </div>
            </nav>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <section className="surface-glass rounded-3xl p-6 md:p-7 mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/80">Insights Center</p>
                            <h2 className="mt-2 text-3xl md:text-4xl font-extrabold text-white leading-tight">Player Performance Analytics</h2>
                            <p className="mt-3 max-w-2xl text-sm md:text-base text-slate-300">
                                Explore distribution by role and identify batting profile outliers using live synchronized player metrics.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 min-w-[250px]">
                            {summaryCards.map((card) => (
                                <div key={card.label} className="rounded-xl border border-white/10 bg-black/20 p-3">
                                    <p className="text-[10px] uppercase tracking-wider text-slate-500">{card.label}</p>
                                    <p className={`text-lg font-bold ${card.tone}`}>{card.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="surface-glass rounded-3xl p-6">
                        <h2 className="text-xl font-bold text-white mb-1">Player Role Distribution</h2>
                        <p className="text-sm text-slate-400 mb-5">Current role spread across synchronized player records.</p>
                        <div className="h-[380px] w-full">
                            {roleData.length ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={roleData}
                                            cx="50%"
                                            cy="47%"
                                            innerRadius={75}
                                            outerRadius={135}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {roleData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={ROLE_COLORS[entry.name] || PIE_COLORS[index % PIE_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', color: '#fff', borderRadius: '12px' }}
                                            itemStyle={{ color: '#e2e8f0' }}
                                        />
                                        <Legend verticalAlign="bottom" height={30} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full rounded-2xl border border-dashed border-white/15 bg-slate-900/40 flex items-center justify-center text-center px-6">
                                    <p className="text-sm text-slate-400">Role distribution will appear once players are available.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="surface-glass rounded-3xl p-6">
                        <h2 className="text-xl font-bold text-white mb-1">Batting Performance Map</h2>
                        <p className="text-sm text-slate-400 mb-5">Scatter lens for batting average versus strike rate.</p>
                        <div className="h-[380px] w-full">
                            {scatterData.length ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart margin={{ top: 16, right: 16, bottom: 20, left: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                        <XAxis
                                            type="number"
                                            dataKey="x"
                                            name="Average"
                                            stroke="#94a3b8"
                                            label={{ value: 'Batting Average', position: 'insideBottom', offset: -10, fill: '#94a3b8' }}
                                        />
                                        <YAxis
                                            type="number"
                                            dataKey="y"
                                            name="Strike Rate"
                                            stroke="#94a3b8"
                                            label={{ value: 'Strike Rate', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                                        />
                                        <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<ScatterTooltip />} />
                                        <Scatter name="Players" data={scatterData}>
                                            {scatterData.map((entry, index) => (
                                                <Cell key={`scatter-cell-${index}`} fill={ROLE_COLORS[entry.role] || '#60a5fa'} />
                                            ))}
                                        </Scatter>
                                    </ScatterChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full rounded-2xl border border-dashed border-white/15 bg-slate-900/40 flex items-center justify-center text-center px-6">
                                    <p className="text-sm text-slate-400">Average and strike-rate points will appear when player stat samples are loaded.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsHub;