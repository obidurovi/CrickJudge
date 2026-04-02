import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useSearchParams } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line, Tooltip } from 'recharts';

const API = 'http://localhost:5000/api/matches/form-tracker';

const statusClass = {
    'In Form': 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    'Out of Form': 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    'Neutral': 'bg-slate-500/10 text-slate-300 border-slate-500/30',
    'Data Limited': 'bg-amber-500/10 text-amber-300 border-amber-500/30'
};

const toSparkData = (values = []) => values.map((value, index) => ({
    x: index + 1,
    y: Number(value) || 0
}));

const Sparkline = ({ values, color, emptyText }) => {
    const data = toSparkData(values);
    const hasSignal = data.some((point) => point.y !== 0);

    if (!data.length || !hasSignal) {
        return <p className="text-[10px] text-slate-500">{emptyText}</p>;
    }

    return (
        <div className="h-14 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 4, right: 2, bottom: 0, left: 2 }}>
                    <Tooltip
                        formatter={(value) => [Number(value).toFixed(2), 'Value']}
                        labelFormatter={(label) => `Match ${label}`}
                        contentStyle={{
                            background: '#0f172a',
                            border: '1px solid rgba(148,163,184,0.25)',
                            borderRadius: 8,
                            color: '#e2e8f0',
                            fontSize: 11
                        }}
                        itemStyle={{ color: '#e2e8f0' }}
                    />
                    <Line type="monotone" dataKey="y" stroke={color} strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

const highlightColumns = [
    { key: 'player', label: 'Player' },
    { key: 'team', label: 'Team' },
    { key: 'formScore', label: 'Form', align: 'right', render: (value) => Number(value).toFixed(1) }
];

const MiniTable = ({ title, accent, rows = [], columns = [] }) => (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-white">{title}</h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${accent}`}>Top {rows.length}</span>
        </div>
        {rows.length === 0 ? (
            <p className="text-xs text-slate-500">No records available.</p>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-white/10 text-slate-400">
                            <th className="text-left py-2 pr-2 w-6">#</th>
                            {columns.map((column) => (
                                <th key={column.key} className={`py-2 px-2 ${column.align === 'right' ? 'text-right' : 'text-left'}`}>{column.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => (
                            <tr key={`${row.player}-${index}`} className="border-b border-white/5 last:border-b-0">
                                <td className="py-1.5 pr-2 text-slate-500">{index + 1}</td>
                                {columns.map((column) => (
                                    <td key={column.key} className={`py-1.5 px-2 ${column.align === 'right' ? 'text-right font-mono text-slate-200' : 'text-slate-200'}`}>
                                        {column.render ? column.render(row[column.key], row) : row[column.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
);

const trendTone = (value) => {
    if (value > 5) return 'text-emerald-300';
    if (value < -5) return 'text-rose-300';
    return 'text-slate-300';
};

const PlayerFormTracker = () => {
    const [searchParams] = useSearchParams();
    const initialSearch = searchParams.get('player') || '';

    const [payload, setPayload] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [selectedSeriesKey, setSelectedSeriesKey] = useState('');
    const [searchText, setSearchText] = useState(initialSearch);
    const [statusFilter, setStatusFilter] = useState('all');
    const [windowSize, setWindowSize] = useState('10');
    const [sortBy, setSortBy] = useState('formScore');
    const [minMatches, setMinMatches] = useState('0');

    const fetchForm = useCallback(async (seriesKey = '', background = false) => {
        if (background) setRefreshing(true);
        else setLoading(true);

        setError('');
        try {
            const params = new URLSearchParams({ limit: '80' });
            if (seriesKey) params.set('series', seriesKey);
            const { data } = await axios.get(`${API}?${params.toString()}`);
            setPayload(data);
            if (!seriesKey && data?.series?.seriesKey) {
                setSelectedSeriesKey(data.series.seriesKey);
            }
        } catch (err) {
            setError(err?.response?.data?.message || 'Unable to load player form tracker');
            setPayload(null);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchForm('');
    }, [fetchForm]);

    const availableSeries = payload?.availableSeries || [];

    const onSeriesChange = (event) => {
        const next = event.target.value;
        setSelectedSeriesKey(next);
        fetchForm(next, false);
    };

    const filteredPlayers = useMemo(() => {
        const query = searchText.trim().toLowerCase();
        const min = Number(minMatches) || 0;

        const list = (payload?.players || []).filter((player) => {
            if (min > 0 && Number(player.matches || 0) < min) return false;
            if (statusFilter !== 'all' && player.formStatus !== statusFilter) return false;
            if (!query) return true;
            return (
                String(player.player || '').toLowerCase().includes(query)
                || String(player.team || '').toLowerCase().includes(query)
                || String(player.roleHint || '').toLowerCase().includes(query)
            );
        });

        return [...list].sort((a, b) => {
            if (sortBy === 'confidence') return Number(b.confidence || 0) - Number(a.confidence || 0);
            if (sortBy === 'consistency') return Number(b.consistencyIndex || 0) - Number(a.consistencyIndex || 0);
            if (sortBy === 'runsTrend') return Number(b?.batting?.runsTrendPct || 0) - Number(a?.batting?.runsTrendPct || 0);
            if (sortBy === 'wicketsTrend') return Number(b?.bowling?.wicketsTrendPct || 0) - Number(a?.bowling?.wicketsTrendPct || 0);
            return Number(b.formScore || 0) - Number(a.formScore || 0);
        });
    }, [payload, searchText, statusFilter, sortBy, minMatches]);

    const summary = payload?.summary || {
        playersTracked: 0,
        inFormCount: 0,
        outOfFormCount: 0,
        neutralCount: 0,
        dataLimitedCount: 0
    };

    const exportCsv = () => {
        const rows = [
            ['Player', 'Team', 'Role', 'Status', 'FormScore', 'Confidence', 'Matches', 'RunsAvg5', 'RunsAvg10', 'WktsAvg5', 'WktsAvg10', 'Eco5', 'SR5']
        ];

        filteredPlayers.forEach((player) => {
            rows.push([
                player.player,
                player.team,
                player.roleHint,
                player.formStatus,
                player.formScore,
                player.confidence,
                player.matches,
                player?.batting?.avgRuns5 ?? 0,
                player?.batting?.avgRuns10 ?? 0,
                player?.bowling?.avgWickets5 ?? 0,
                player?.bowling?.avgWickets10 ?? 0,
                player?.bowling?.economy5 ?? 0,
                player?.batting?.strikeRate5 ?? 0
            ]);
        });

        const csv = rows
            .map((row) => row.map((value) => {
                const text = String(value ?? '');
                if (text.includes(',') || text.includes('"') || text.includes('\n')) {
                    return `"${text.replace(/"/g, '""')}"`;
                }
                return text;
            }).join(','))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'player-form-tracker.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400 font-medium">Calculating player form trends...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Player Form Tracker</h1>
                        <p className="text-sm text-slate-400 mt-1">Last 5/10 match trends with rolling averages, sparks, and form-state flags.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => fetchForm(selectedSeriesKey, true)}
                            className="px-3 py-2 text-sm font-semibold rounded-lg border border-white/10 bg-white/5 hover:bg-white/10"
                        >
                            {refreshing ? 'Refreshing...' : 'Refresh'}
                        </button>
                        <button
                            onClick={exportCsv}
                            className="px-3 py-2 text-sm font-semibold rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20"
                        >
                            Export CSV
                        </button>
                        <Link to="/series-leaderboards" className="text-sm text-slate-400 hover:text-white">Series Leaderboards</Link>
                    </div>
                </div>

                {error && (
                    <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                        {error}
                    </div>
                )}

                {payload?._notice && (
                    <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300">
                        {payload._notice}
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                    <div className="bg-black/20 border border-white/10 rounded-xl p-3">
                        <p className="text-xs text-slate-400 uppercase">Tracked</p>
                        <p className="text-xl font-bold text-white">{summary.playersTracked}</p>
                    </div>
                    <div className="bg-black/20 border border-emerald-500/30 rounded-xl p-3">
                        <p className="text-xs text-emerald-300 uppercase">In Form</p>
                        <p className="text-xl font-bold text-emerald-300">{summary.inFormCount}</p>
                    </div>
                    <div className="bg-black/20 border border-rose-500/30 rounded-xl p-3">
                        <p className="text-xs text-rose-300 uppercase">Out of Form</p>
                        <p className="text-xl font-bold text-rose-300">{summary.outOfFormCount}</p>
                    </div>
                    <div className="bg-black/20 border border-slate-500/30 rounded-xl p-3">
                        <p className="text-xs text-slate-300 uppercase">Neutral</p>
                        <p className="text-xl font-bold text-slate-200">{summary.neutralCount}</p>
                    </div>
                    <div className="bg-black/20 border border-amber-500/30 rounded-xl p-3">
                        <p className="text-xs text-amber-300 uppercase">Data Limited</p>
                        <p className="text-xl font-bold text-amber-300">{summary.dataLimitedCount}</p>
                    </div>
                </div>

                <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-6 gap-3 items-end">
                        <div className="lg:col-span-2">
                            <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Series</p>
                            <select
                                value={selectedSeriesKey}
                                onChange={onSeriesChange}
                                className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-white/10 text-sm text-white"
                            >
                                {availableSeries.map((series) => (
                                    <option key={series.seriesKey} value={series.seriesKey}>
                                        {series.seriesName} ({series.liveCount} live / {series.matchCount} matches)
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Search</p>
                            <input
                                value={searchText}
                                onChange={(event) => setSearchText(event.target.value)}
                                placeholder="Player or team"
                                className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-white/10 text-sm text-white placeholder-slate-500"
                            />
                        </div>

                        <div>
                            <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Status</p>
                            <select
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-white/10 text-sm text-white"
                            >
                                <option value="all">All</option>
                                <option value="In Form">In Form</option>
                                <option value="Out of Form">Out of Form</option>
                                <option value="Neutral">Neutral</option>
                                <option value="Data Limited">Data Limited</option>
                            </select>
                        </div>

                        <div>
                            <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Spark Window</p>
                            <select
                                value={windowSize}
                                onChange={(event) => setWindowSize(event.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-white/10 text-sm text-white"
                            >
                                <option value="5">Last 5</option>
                                <option value="10">Last 10</option>
                            </select>
                        </div>

                        <div>
                            <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Sort</p>
                            <select
                                value={sortBy}
                                onChange={(event) => setSortBy(event.target.value)}
                                className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-white/10 text-sm text-white"
                            >
                                <option value="formScore">Form Score</option>
                                <option value="confidence">Confidence</option>
                                <option value="consistency">Consistency</option>
                                <option value="runsTrend">Runs Trend</option>
                                <option value="wicketsTrend">Wickets Trend</option>
                            </select>
                        </div>
                    </div>

                    <div className="mt-3 flex items-center gap-3 flex-wrap">
                        <p className="text-xs text-slate-500 uppercase">Minimum matches</p>
                        {['0', '3', '5', '8'].map((value) => (
                            <button
                                key={value}
                                onClick={() => setMinMatches(value)}
                                className={`px-2.5 py-1 rounded-full text-xs border ${minMatches === value ? 'bg-blue-500/20 border-blue-500/40 text-blue-200' : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'}`}
                            >
                                {value === '0' ? 'All' : `${value}+`}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                    <MiniTable
                        title="Hottest Players"
                        accent="bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                        rows={payload?.highlights?.inFormPlayers || []}
                        columns={highlightColumns}
                    />
                    <MiniTable
                        title="Cooling Off"
                        accent="bg-rose-500/10 text-rose-300 border-rose-500/30"
                        rows={payload?.highlights?.outOfFormPlayers || []}
                        columns={highlightColumns}
                    />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                    <MiniTable
                        title="Most Consistent"
                        accent="bg-blue-500/10 text-blue-300 border-blue-500/30"
                        rows={payload?.highlights?.consistencyLeaders || []}
                        columns={[
                            { key: 'player', label: 'Player' },
                            { key: 'team', label: 'Team' },
                            { key: 'consistencyIndex', label: 'Consistency', align: 'right', render: (value) => Number(value).toFixed(1) }
                        ]}
                    />
                    <MiniTable
                        title="Biggest Improvers"
                        accent="bg-violet-500/10 text-violet-300 border-violet-500/30"
                        rows={payload?.highlights?.biggestImprovers || []}
                        columns={highlightColumns}
                    />
                </div>

                {filteredPlayers.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/20 bg-black/20 px-4 py-12 text-center text-slate-400">
                        No players match the selected filters.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {filteredPlayers.map((player) => {
                            const runsSeries = player?.sparkline?.[`runs${windowSize}`] || [];
                            const wicketsSeries = player?.sparkline?.[`wickets${windowSize}`] || [];
                            const economySeries = player?.sparkline?.[`economy${windowSize}`] || [];
                            const srSeries = player?.sparkline?.[`strikeRate${windowSize}`] || [];

                            return (
                                <article key={`${player.player}-${player.team}`} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div>
                                            <h3 className="text-white font-bold text-base leading-tight">{player.player}</h3>
                                            <p className="text-xs text-slate-400 mt-0.5">{player.team} · {player.roleHint}</p>
                                        </div>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wide ${statusClass[player.formStatus] || statusClass.Neutral}`}>
                                            {player.formStatus}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                        <div className="bg-black/20 border border-white/10 rounded-lg px-2 py-1.5">
                                            <p className="text-[10px] text-slate-500 uppercase">Form</p>
                                            <p className={`text-xs font-mono font-semibold ${trendTone(player.formScore)}`}>{Number(player.formScore).toFixed(1)}</p>
                                        </div>
                                        <div className="bg-black/20 border border-white/10 rounded-lg px-2 py-1.5">
                                            <p className="text-[10px] text-slate-500 uppercase">Confidence</p>
                                            <p className="text-xs font-mono font-semibold text-slate-200">{Number(player.confidence).toFixed(1)}%</p>
                                        </div>
                                        <div className="bg-black/20 border border-white/10 rounded-lg px-2 py-1.5">
                                            <p className="text-[10px] text-slate-500 uppercase">Matches</p>
                                            <p className="text-xs font-mono font-semibold text-slate-200">{player.matches}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-[10px] uppercase tracking-wide text-slate-500">Runs Trend ({windowSize})</p>
                                                <span className={`text-[10px] font-mono ${trendTone(player?.batting?.runsTrendPct || 0)}`}>
                                                    {Number(player?.batting?.runsTrendPct || 0).toFixed(1)}%
                                                </span>
                                            </div>
                                            <Sparkline values={runsSeries} color="#22c55e" emptyText="No batting trend" />
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-[10px] uppercase tracking-wide text-slate-500">Wickets Trend ({windowSize})</p>
                                                <span className={`text-[10px] font-mono ${trendTone(player?.bowling?.wicketsTrendPct || 0)}`}>
                                                    {Number(player?.bowling?.wicketsTrendPct || 0).toFixed(1)}%
                                                </span>
                                            </div>
                                            <Sparkline values={wicketsSeries} color="#60a5fa" emptyText="No bowling trend" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-[10px] uppercase tracking-wide text-slate-500">Economy ({windowSize})</p>
                                                <span className={`text-[10px] font-mono ${trendTone(player?.bowling?.economyTrendPct || 0)}`}>
                                                    {Number(player?.bowling?.economyTrendPct || 0).toFixed(1)}%
                                                </span>
                                            </div>
                                            <Sparkline values={economySeries} color="#f59e0b" emptyText="No economy trend" />
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-[10px] uppercase tracking-wide text-slate-500">Strike Rate ({windowSize})</p>
                                                <span className={`text-[10px] font-mono ${trendTone(player?.batting?.strikeRateTrendPct || 0)}`}>
                                                    {Number(player?.batting?.strikeRateTrendPct || 0).toFixed(1)}%
                                                </span>
                                            </div>
                                            <Sparkline values={srSeries} color="#a78bfa" emptyText="No SR trend" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400">
                                        <p>Runs Avg 5/10: <span className="text-slate-200 font-mono">{Number(player?.batting?.avgRuns5 || 0).toFixed(1)} / {Number(player?.batting?.avgRuns10 || 0).toFixed(1)}</span></p>
                                        <p>Wkts Avg 5/10: <span className="text-slate-200 font-mono">{Number(player?.bowling?.avgWickets5 || 0).toFixed(2)} / {Number(player?.bowling?.avgWickets10 || 0).toFixed(2)}</span></p>
                                        <p>Eco 5/10: <span className="text-slate-200 font-mono">{Number(player?.bowling?.economy5 || 0).toFixed(2)} / {Number(player?.bowling?.economy10 || 0).toFixed(2)}</span></p>
                                        <p>SR 5/10: <span className="text-slate-200 font-mono">{Number(player?.batting?.strikeRate5 || 0).toFixed(1)} / {Number(player?.batting?.strikeRate10 || 0).toFixed(1)}</span></p>
                                    </div>

                                    <div className="mt-3 flex gap-2 flex-wrap">
                                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-600 text-slate-300">Momentum: {player.momentum}</span>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-600 text-slate-300">50+ Streak: {player?.streaks?.fiftyPlus || 0}</span>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-600 text-slate-300">Wicket Streak: {player?.streaks?.wicketStreak || 0}</span>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full border border-slate-600 text-slate-300">Consistency: {Number(player.consistencyIndex || 0).toFixed(1)}</span>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlayerFormTracker;
