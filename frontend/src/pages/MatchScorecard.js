import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';

const API_BASE = 'http://localhost:5000/api/matches';

const getName = (entity, fallback = 'Unknown') => {
    if (!entity) return fallback;
    if (typeof entity === 'string') return entity;
    return entity.name || entity.fullName || entity.shortname || fallback;
};

const toNumber = (value, fallback = 0) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
};

const formatRate = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(2) : '-';
};

const normalizeFow = (entry) => {
    if (!entry) return null;
    if (typeof entry === 'string') {
        return { text: entry };
    }

    const player = getName(entry.batsman || entry.player || entry.name, 'Batter');
    const score = entry.score || entry.teamScore || '-';
    const overs = entry.overs || entry.over || entry.atOver;
    return {
        text: `${player} ${score}${overs ? ` (${overs})` : ''}`
    };
};

const normalizePartnership = (entry) => {
    if (!entry) return null;

    const batter1 = getName(entry.bat1 || entry.batsman1 || entry.striker || entry.player1, 'Batter 1');
    const batter2 = getName(entry.bat2 || entry.batsman2 || entry.nonStriker || entry.player2, 'Batter 2');
    const runs = entry.runs ?? entry.r ?? entry.score ?? '-';
    const balls = entry.balls ?? entry.b ?? null;
    const overs = entry.overs ?? entry.o ?? null;

    return {
        pair: `${batter1} & ${batter2}`,
        runs,
        balls,
        overs
    };
};

const inningsScoreText = (inning) => {
    if (!inning) return '-';
    const runs = inning.r ?? inning.runs ?? '-';
    const wickets = inning.w ?? inning.wickets ?? '-';
    const overs = inning.o ?? inning.overs ?? '-';
    return `${runs}/${wickets} (${overs} ov)`;
};

const BattingTable = ({ batting = [] }) => {
    if (!batting.length) {
        return <p className="text-sm text-slate-500">Batting details unavailable.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-slate-400 border-b border-white/10">
                        <th className="text-left py-2 pr-2 font-semibold">Batter</th>
                        <th className="text-left py-2 px-2 font-semibold">Dismissal</th>
                        <th className="text-right py-2 px-2 font-semibold">R</th>
                        <th className="text-right py-2 px-2 font-semibold">B</th>
                        <th className="text-right py-2 px-2 font-semibold">4s</th>
                        <th className="text-right py-2 px-2 font-semibold">6s</th>
                        <th className="text-right py-2 pl-2 font-semibold">SR</th>
                    </tr>
                </thead>
                <tbody>
                    {batting.map((batter, idx) => {
                        const name = getName(batter.batsman || batter.player || batter.name, 'Unknown Batter');
                        const dismissal = batter.dismissal || batter.outDesc || batter.howOut || batter.status || 'not out';
                        const runs = toNumber(batter.runs ?? batter.r, '-');
                        const balls = toNumber(batter.balls ?? batter.b, '-');
                        const fours = toNumber(batter.fours ?? batter['4s'] ?? batter['4'], '-');
                        const sixes = toNumber(batter.sixes ?? batter['6s'] ?? batter['6'], '-');
                        const strikeRate = batter.sr ?? batter.strikeRate;

                        return (
                            <tr key={`${name}-${idx}`} className="border-b border-white/5">
                                <td className="py-2 pr-2 font-medium text-white">{name}</td>
                                <td className="py-2 px-2 text-slate-400">{dismissal}</td>
                                <td className="py-2 px-2 text-right font-mono text-slate-200">{runs}</td>
                                <td className="py-2 px-2 text-right font-mono text-slate-300">{balls}</td>
                                <td className="py-2 px-2 text-right font-mono text-slate-300">{fours}</td>
                                <td className="py-2 px-2 text-right font-mono text-slate-300">{sixes}</td>
                                <td className="py-2 pl-2 text-right font-mono text-slate-300">{formatRate(strikeRate)}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

const BowlingTable = ({ bowling = [] }) => {
    if (!bowling.length) {
        return <p className="text-sm text-slate-500">Bowling details unavailable.</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-slate-400 border-b border-white/10">
                        <th className="text-left py-2 pr-2 font-semibold">Bowler</th>
                        <th className="text-right py-2 px-2 font-semibold">O</th>
                        <th className="text-right py-2 px-2 font-semibold">M</th>
                        <th className="text-right py-2 px-2 font-semibold">R</th>
                        <th className="text-right py-2 px-2 font-semibold">W</th>
                        <th className="text-right py-2 px-2 font-semibold">Econ</th>
                        <th className="text-right py-2 px-2 font-semibold">NB</th>
                        <th className="text-right py-2 pl-2 font-semibold">WD</th>
                    </tr>
                </thead>
                <tbody>
                    {bowling.map((bowler, idx) => {
                        const name = getName(bowler.bowler || bowler.player || bowler.name, 'Unknown Bowler');
                        const overs = bowler.overs ?? bowler.o ?? '-';
                        const maidens = toNumber(bowler.maidens ?? bowler.m, '-');
                        const runs = toNumber(bowler.runs ?? bowler.r, '-');
                        const wickets = toNumber(bowler.wickets ?? bowler.w, '-');
                        const economy = bowler.econ ?? bowler.eco;
                        const nb = toNumber(bowler.nb ?? bowler.noBalls, '-');
                        const wd = toNumber(bowler.wd ?? bowler.wides, '-');

                        return (
                            <tr key={`${name}-${idx}`} className="border-b border-white/5">
                                <td className="py-2 pr-2 font-medium text-white">{name}</td>
                                <td className="py-2 px-2 text-right font-mono text-slate-300">{overs}</td>
                                <td className="py-2 px-2 text-right font-mono text-slate-300">{maidens}</td>
                                <td className="py-2 px-2 text-right font-mono text-slate-300">{runs}</td>
                                <td className="py-2 px-2 text-right font-mono text-slate-200">{wickets}</td>
                                <td className="py-2 px-2 text-right font-mono text-slate-300">{formatRate(economy)}</td>
                                <td className="py-2 px-2 text-right font-mono text-slate-300">{nb}</td>
                                <td className="py-2 pl-2 text-right font-mono text-slate-300">{wd}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

const MatchScorecard = () => {
    const { id } = useParams();
    const [matchInfo, setMatchInfo] = useState(null);
    const [scorecardData, setScorecardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchScorecard = useCallback(async (isBackgroundRefresh = false) => {
        if (!id) return;

        try {
            if (isBackgroundRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const [detailRes, scorecardRes] = await Promise.all([
                axios.get(`${API_BASE}/${id}`),
                axios.get(`${API_BASE}/${id}/scorecard`)
            ]);

            setMatchInfo(detailRes.data?.data || detailRes.data || null);
            setScorecardData(scorecardRes.data?.data || scorecardRes.data || null);
            setError(null);
            setLastUpdated(new Date());
        } catch (err) {
            const message = err.response?.data?.message || err.message || 'Failed to load scorecard';
            setError(message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [id]);

    useEffect(() => {
        fetchScorecard(false);
    }, [fetchScorecard]);

    const mergedMatch = useMemo(() => {
        if (!scorecardData && !matchInfo) return null;
        return {
            ...(matchInfo || {}),
            ...(scorecardData || {})
        };
    }, [matchInfo, scorecardData]);

    const isLive = !!(mergedMatch?.matchStarted && !mergedMatch?.matchEnded);

    useEffect(() => {
        if (!isLive) return undefined;

        const interval = setInterval(() => {
            fetchScorecard(true);
        }, 30000);

        return () => clearInterval(interval);
    }, [fetchScorecard, isLive]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400 font-medium">Loading scorecard...</p>
                </div>
            </div>
        );
    }

    if (!mergedMatch || error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-slate-200 px-6 py-10">
                <div className="max-w-5xl mx-auto">
                    <div className="mb-6">
                        <Link to="/live-matches" className="text-sm text-slate-400 hover:text-white transition-colors">Back to Live Matches</Link>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
                        <h1 className="text-xl font-bold text-white mb-2">Unable to load match scorecard</h1>
                        <p className="text-red-300 text-sm mb-4">{error || 'Scorecard data not available for this match.'}</p>
                        <button
                            onClick={() => fetchScorecard(false)}
                            className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-500/20 text-red-200 border border-red-500/30 hover:bg-red-500/30"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const innings = mergedMatch.scorecard || [];
    const scoreList = mergedMatch.score || [];
    const teamInfo = mergedMatch.teamInfo || [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <Link to="/live-matches" className="text-sm text-slate-400 hover:text-white transition-colors">Back to Live Matches</Link>
                    <div className="flex items-center gap-3">
                        {lastUpdated && (
                            <p className="text-xs text-slate-500">
                                {isLive ? 'Live' : 'Snapshot'} · Updated {lastUpdated.toLocaleTimeString()}
                            </p>
                        )}
                        <button
                            onClick={() => fetchScorecard(true)}
                            disabled={refreshing}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-60"
                        >
                            {refreshing ? 'Refreshing...' : 'Refresh'}
                        </button>
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border bg-slate-800 text-slate-300 border-slate-700">
                                    {mergedMatch.matchType || 'match'}
                                </span>
                                {isLive && (
                                    <span className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                        LIVE
                                    </span>
                                )}
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold text-white">{mergedMatch.name || 'Match Scorecard'}</h1>
                            <p className="text-sm text-slate-400 mt-1">{mergedMatch.status || 'Status unavailable'}</p>
                        </div>
                        <div className="text-sm text-slate-400 space-y-1 md:text-right">
                            {mergedMatch.venue && <p>{mergedMatch.venue}</p>}
                            {mergedMatch.dateTimeGMT && <p>{new Date(mergedMatch.dateTimeGMT).toLocaleString()}</p>}
                            {mergedMatch.tossWinner && (
                                <p>
                                    Toss: {mergedMatch.tossWinner}
                                    {mergedMatch.tossChoice ? ` (${mergedMatch.tossChoice})` : ''}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(teamInfo.length ? teamInfo : (mergedMatch.teams || []).map((name) => ({ name }))).map((team, idx) => {
                            const teamName = getName(team, `Team ${idx + 1}`);
                            const teamScore = scoreList.filter((entry) => {
                                const inningText = (entry.inning || '').toLowerCase();
                                return teamName && inningText.includes(teamName.toLowerCase());
                            });

                            return (
                                <div key={`${teamName}-${idx}`} className="bg-black/20 border border-white/5 rounded-xl p-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        {team.img ? (
                                            <img src={team.img} alt={teamName} className="w-9 h-9 rounded-full object-cover border border-white/10" />
                                        ) : (
                                            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                                                {teamName[0] || 'T'}
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-white font-semibold">{teamName}</p>
                                            <p className="text-xs text-slate-500">{team.shortname || ''}</p>
                                        </div>
                                    </div>
                                    {teamScore.length ? (
                                        teamScore.map((entry, i) => (
                                            <p key={i} className="text-sm font-mono text-slate-200">
                                                {inningsScoreText(entry)}
                                            </p>
                                        ))
                                    ) : (
                                        <p className="text-sm text-slate-500">Yet to bat</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {innings.length === 0 ? (
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <p className="text-slate-400">Detailed innings scorecard is not available yet for this match.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {innings.map((inning, idx) => {
                            const fowEntries = (inning.fow || inning.fallOfWickets || []).map(normalizeFow).filter(Boolean);
                            const partnershipEntries = (inning.partnerships || inning.partnership || []).map(normalizePartnership).filter(Boolean);

                            return (
                                <section key={`${inning.inning || `inning-${idx}`}-${idx}`} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-5">
                                        <h2 className="text-xl font-bold text-white">{inning.inning || `Innings ${idx + 1}`}</h2>
                                        <p className="text-sm font-mono text-emerald-300">
                                            {inningsScoreText(inning)}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                        <div className="bg-black/20 border border-white/5 rounded-xl p-4">
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3">Batting</h3>
                                            <BattingTable batting={inning.batting || []} />
                                        </div>

                                        <div className="bg-black/20 border border-white/5 rounded-xl p-4">
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3">Bowling</h3>
                                            <BowlingTable bowling={inning.bowling || []} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
                                        <div className="bg-black/20 border border-white/5 rounded-xl p-4">
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3">Fall of Wickets</h3>
                                            {fowEntries.length ? (
                                                <ul className="space-y-2 text-sm text-slate-300">
                                                    {fowEntries.map((entry, fowIdx) => (
                                                        <li key={`fow-${fowIdx}`} className="border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                                            {entry.text}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-slate-500">No wicket data available.</p>
                                            )}
                                        </div>

                                        <div className="bg-black/20 border border-white/5 rounded-xl p-4">
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3">Partnerships</h3>
                                            {partnershipEntries.length ? (
                                                <ul className="space-y-2 text-sm text-slate-300">
                                                    {partnershipEntries.map((entry, partIdx) => (
                                                        <li key={`part-${partIdx}`} className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0 gap-1">
                                                            <span>{entry.pair}</span>
                                                            <span className="font-mono text-slate-200">
                                                                {entry.runs} runs
                                                                {entry.balls ? ` / ${entry.balls} balls` : ''}
                                                                {entry.overs ? ` (${entry.overs})` : ''}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <p className="text-sm text-slate-500">No partnership data available.</p>
                                            )}
                                        </div>
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MatchScorecard;
