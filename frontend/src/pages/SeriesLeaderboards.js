import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API = 'http://localhost:5000/api/matches/leaderboards';

const LeaderboardTable = ({ title, accentClass, rows, columns, emptyText }) => (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-white">{title}</h3>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${accentClass}`}>Top {rows.length}</span>
        </div>

        {rows.length === 0 ? (
            <p className="text-sm text-slate-500">{emptyText}</p>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-slate-400 border-b border-white/10">
                            <th className="text-left py-2 pr-2 font-semibold w-8">#</th>
                            {columns.map((col) => (
                                <th key={col.key} className={`py-2 px-2 font-semibold ${col.align === 'right' ? 'text-right' : 'text-left'}`}>
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => (
                            <tr key={`${row.player}-${index}`} className="border-b border-white/5 last:border-b-0">
                                <td className="py-2 pr-2 text-slate-500">{index + 1}</td>
                                {columns.map((col) => (
                                    <td key={col.key} className={`py-2 px-2 ${col.align === 'right' ? 'text-right font-mono text-slate-200' : 'text-slate-200'}`}>
                                        {typeof col.render === 'function' ? col.render(row[col.key], row) : row[col.key]}
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

const SeriesLeaderboards = () => {
    const [payload, setPayload] = useState(null);
    const [selectedSeriesKey, setSelectedSeriesKey] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchLeaderboards = useCallback(async (seriesKey = '') => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams({ limit: '10' });
            if (seriesKey) params.set('series', seriesKey);
            const { data } = await axios.get(`${API}?${params.toString()}`);
            setPayload(data);

            if (!seriesKey && data?.series?.seriesKey) {
                setSelectedSeriesKey(data.series.seriesKey);
            }
        } catch (err) {
            setError(err?.response?.data?.message || 'Unable to load series leaderboards');
            setPayload(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeaderboards('');
    }, [fetchLeaderboards]);

    const availableSeries = payload?.availableSeries || [];

    const onSeriesChange = (event) => {
        const next = event.target.value;
        setSelectedSeriesKey(next);
        fetchLeaderboards(next);
    };

    const summary = useMemo(() => {
        return {
            matches: payload?.matchesAnalyzed || 0,
            covered: payload?.coverage?.matchesWithScorecards || 0,
            innings: payload?.coverage?.inningsProcessed || 0,
            freeTierMode: payload?.freeTierMode
        };
    }, [payload]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400 font-medium">Building live series leaderboards...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Tournament / Series Leaderboards</h1>
                        <p className="text-sm text-slate-400 mt-1">Top performers aggregated from live-match scorecards.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => fetchLeaderboards(selectedSeriesKey)}
                            className="px-3 py-2 text-sm font-semibold rounded-lg border border-white/10 bg-white/5 hover:bg-white/10"
                        >
                            Refresh
                        </button>
                        <Link to="/player-form-tracker" className="text-sm text-blue-300 hover:text-blue-200">Player Form Tracker</Link>
                        <Link to="/live-matches" className="text-sm text-slate-400 hover:text-white">Back to Live Matches</Link>
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

                <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="flex items-end gap-4 flex-wrap">
                        <div>
                            <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">Current Series</p>
                            <select
                                value={selectedSeriesKey}
                                onChange={onSeriesChange}
                                className="min-w-[280px] px-3 py-2 rounded-lg bg-slate-800/80 border border-white/10 text-sm text-white"
                            >
                                {availableSeries.map((series) => (
                                    <option key={series.seriesKey} value={series.seriesKey}>
                                        {series.seriesName} ({series.liveCount} live / {series.matchCount} matches)
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="ml-auto flex gap-3 flex-wrap">
                            <span className="px-3 py-1 bg-blue-500/10 text-blue-300 border border-blue-500/30 rounded text-xs font-semibold uppercase tracking-wider">
                                Matches: {summary.matches}
                            </span>
                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded text-xs font-semibold uppercase tracking-wider">
                                Scorecards: {summary.covered}
                            </span>
                            <span className="px-3 py-1 bg-violet-500/10 text-violet-300 border border-violet-500/30 rounded text-xs font-semibold uppercase tracking-wider">
                                Innings: {summary.innings}
                            </span>
                            <span className={`px-3 py-1 rounded text-xs font-semibold uppercase tracking-wider border ${summary.freeTierMode ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'}`}>
                                {summary.freeTierMode ? 'Free Tier Mode' : 'Full Fetch Mode'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <LeaderboardTable
                        title="Top Run Scorers"
                        accentClass="bg-blue-500/10 text-blue-300 border-blue-500/30"
                        rows={payload?.leaderboards?.topRunScorers || []}
                        emptyText="No batting scorecards available for this series yet."
                        columns={[
                            { key: 'player', label: 'Player' },
                            { key: 'team', label: 'Team' },
                            { key: 'runs', label: 'Runs', align: 'right' },
                            { key: 'innings', label: 'Inns', align: 'right' },
                            { key: 'strikeRate', label: 'SR', align: 'right', render: (value) => Number(value || 0).toFixed(2) }
                        ]}
                    />

                    <LeaderboardTable
                        title="Top Wicket-Takers"
                        accentClass="bg-rose-500/10 text-rose-300 border-rose-500/30"
                        rows={payload?.leaderboards?.topWicketTakers || []}
                        emptyText="No bowling scorecards available for this series yet."
                        columns={[
                            { key: 'player', label: 'Player' },
                            { key: 'team', label: 'Team' },
                            { key: 'wickets', label: 'Wkts', align: 'right' },
                            { key: 'oversText', label: 'Overs', align: 'right' },
                            { key: 'economy', label: 'Econ', align: 'right', render: (value) => Number(value || 0).toFixed(2) }
                        ]}
                    />

                    <LeaderboardTable
                        title="Best Economy"
                        accentClass="bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                        rows={payload?.leaderboards?.bestEconomy || []}
                        emptyText="Need at least 2 overs bowled to qualify."
                        columns={[
                            { key: 'player', label: 'Player' },
                            { key: 'team', label: 'Team' },
                            { key: 'economy', label: 'Econ', align: 'right', render: (value) => Number(value || 0).toFixed(2) },
                            { key: 'oversText', label: 'Overs', align: 'right' },
                            { key: 'wickets', label: 'Wkts', align: 'right' }
                        ]}
                    />

                    <LeaderboardTable
                        title="Best Strike Rates"
                        accentClass="bg-amber-500/10 text-amber-300 border-amber-500/30"
                        rows={payload?.leaderboards?.bestStrikeRates || []}
                        emptyText="Need at least 20 balls faced to qualify."
                        columns={[
                            { key: 'player', label: 'Player' },
                            { key: 'team', label: 'Team' },
                            { key: 'strikeRate', label: 'SR', align: 'right', render: (value) => Number(value || 0).toFixed(2) },
                            { key: 'runs', label: 'Runs', align: 'right' },
                            { key: 'balls', label: 'Balls', align: 'right' }
                        ]}
                    />
                </div>
            </div>
        </div>
    );
};

export default SeriesLeaderboards;
