import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import useSSE from '../hooks/useSSE';

const MatchCard = ({ match, onClick }) => {
    const isLive = match.matchStarted && !match.matchEnded;
    const isUpcoming = !match.matchStarted;
    const isCompleted = match.matchEnded;

    const typeBadge = {
        test: 'bg-red-500/20 text-red-400 border-red-500/30',
        odi: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        t20: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        t10: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    };

    const getTeamInnings = (teamName) => {
        if (!match.score || match.score.length === 0) return [];
        return match.score.filter(s =>
            s.inning.toLowerCase().includes(teamName.toLowerCase())
        );
    };

    const formatScore = (inning) => {
        if (!inning) return '';
        return `${inning.r}/${inning.w} (${inning.o} ov)`;
    };

    const team1 = match.teamInfo?.[0];
    const team2 = match.teamInfo?.[1];
    const team1Innings = getTeamInnings(team1?.name || match.teams?.[0] || '');
    const team2Innings = getTeamInnings(team2?.name || match.teams?.[1] || '');

    return (
        <div
            onClick={() => onClick(match)}
            className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-5 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer group"
        >
            <div className="flex items-center justify-between mb-4">
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border ${typeBadge[match.matchType] || 'bg-slate-700/50 text-slate-400 border-slate-600'}`}>
                    {match.matchType}
                </span>
                {isLive && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        LIVE
                    </span>
                )}
                {isUpcoming && (
                    <span className="text-xs font-medium text-blue-400">Upcoming</span>
                )}
                {isCompleted && (
                    <span className="text-xs font-medium text-slate-500">Completed</span>
                )}
            </div>

            <p className="text-[11px] text-slate-500 mb-4 truncate">{match.name}</p>

            <div className="space-y-3">
                {[{ team: team1, innings: team1Innings, name: match.teams?.[0] },
                  { team: team2, innings: team2Innings, name: match.teams?.[1] }
                ].map((side, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                            {side.team?.img ? (
                                <img src={side.team.img} alt={side.team.shortname} className="w-7 h-7 rounded-full object-cover border border-white/10" />
                            ) : (
                                <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-300">
                                    {(side.team?.shortname || side.name || '?')[0]}
                                </div>
                            )}
                            <div className="min-w-0">
                                <span className="text-sm font-semibold text-white truncate block">
                                    {side.team?.shortname || side.name || 'TBD'}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                            {side.innings.length > 0 ? (
                                side.innings.map((inn, i) => (
                                    <p key={i} className="text-sm font-mono font-bold text-slate-200">
                                        {inn.r}/{inn.w} <span className="text-xs text-slate-500">({inn.o})</span>
                                    </p>
                                ))
                            ) : (
                                <p className="text-sm text-slate-600">—</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-3 border-t border-white/5">
                <p className={`text-xs font-medium truncate ${isLive ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {match.status}
                </p>
                {match.venue && (
                    <p className="text-[10px] text-slate-600 mt-1 flex items-center gap-1 truncate">
                        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                        {match.venue}
                    </p>
                )}
            </div>
        </div>
    );
};

const MatchDetailModal = ({ match, onClose }) => {
    if (!match) return null;

    const isLive = match.matchStarted && !match.matchEnded;

    const getTeamInnings = (teamName) => {
        if (!match.score || match.score.length === 0) return [];
        return match.score.filter(s =>
            s.inning.toLowerCase().includes(teamName.toLowerCase())
        );
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-slate-900 rounded-3xl border border-white/10 shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 uppercase font-bold tracking-wider border border-slate-700">
                                    {match.matchType}
                                </span>
                                {isLive && (
                                    <span className="flex items-center gap-1 text-xs font-bold text-red-400">
                                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                                        LIVE
                                    </span>
                                )}
                            </div>
                            <h2 className="text-lg font-bold text-white">{match.name}</h2>
                        </div>
                        <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>

                    <div className="space-y-4 mb-6">
                        {(match.teamInfo || []).map((team, idx) => {
                            const innings = getTeamInnings(team.name);
                            return (
                                <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/5">
                                    <div className="flex items-center gap-3 mb-3">
                                        {team.img ? (
                                            <img src={team.img} alt={team.shortname} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold">{team.shortname?.[0]}</div>
                                        )}
                                        <div>
                                            <p className="font-bold text-white">{team.name}</p>
                                            <p className="text-xs text-slate-500">{team.shortname}</p>
                                        </div>
                                    </div>
                                    {innings.length > 0 ? (
                                        <div className="space-y-2">
                                            {innings.map((inn, i) => (
                                                <div key={i} className="flex items-center justify-between bg-black/20 rounded-lg px-3 py-2">
                                                    <span className="text-xs text-slate-400">{inn.inning}</span>
                                                    <span className="font-mono font-bold text-white">{inn.r}/{inn.w} <span className="text-slate-500 text-xs">({inn.o} ov)</span></span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-600">Yet to bat</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className={`text-sm font-semibold mb-4 ${isLive ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {match.status}
                    </div>

                    <div className="space-y-2 text-xs text-slate-500">
                        {match.venue && (
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
                                {match.venue}
                            </div>
                        )}
                        {match.date && (
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                {new Date(match.dateTimeGMT || match.date).toLocaleString()}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const LiveMatches = () => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState('all');
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [apiInfo, setApiInfo] = useState(null);

    const fetchMatches = useCallback(async () => {
        try {
            const { data } = await axios.get('http://localhost:5000/api/matches/live');
            if (data.status === 'success') {
                setMatches(data.data || []);
                setApiInfo(data.info || null);
                setLastUpdated(new Date());
                setError(null);
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.message;
            if (msg.includes('CRICKET_API_KEY')) {
                setError('API_KEY_MISSING');
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // SSE handlers for real-time match updates
    const sseHandlers = useMemo(() => ({
        'matches:update': (data) => {
            setMatches(data.matches || []);
            if (data.info) setApiInfo(data.info);
            setLastUpdated(new Date(data.updatedAt || Date.now()));
            setError(null);
            setLoading(false);
        }
    }), []);

    const { connected: sseConnected } = useSSE('/matches', sseHandlers);

    // Initial REST fetch for first load, then SSE takes over
    useEffect(() => {
        fetchMatches();
    }, [fetchMatches]);

    const counts = {
        all: matches.length,
        live: matches.filter(m => m.matchStarted && !m.matchEnded).length,
        upcoming: matches.filter(m => !m.matchStarted).length,
        completed: matches.filter(m => m.matchEnded).length,
    };

    const filteredMatches = matches.filter(m => {
        const isLive = m.matchStarted && !m.matchEnded;
        const isUpcoming = !m.matchStarted;
        const isCompleted = m.matchEnded;
        if (statusFilter === 'live' && !isLive) return false;
        if (statusFilter === 'upcoming' && !isUpcoming) return false;
        if (statusFilter === 'completed' && !isCompleted) return false;
        if (typeFilter !== 'all' && m.matchType !== typeFilter) return false;
        return true;
    });

    const statusFilters = [
        { key: 'all', label: 'All', icon: null },
        { key: 'live', label: 'Live', icon: <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span> },
        { key: 'upcoming', label: 'Upcoming', icon: null },
        { key: 'completed', label: 'Completed', icon: null },
    ];

    const typeFilters = ['all', 'test', 'odi', 't20', 't10'];

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400 font-medium">Loading live matches...</p>
                </div>
            </div>
        );
    }

    if (error === 'API_KEY_MISSING') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 font-sans text-slate-200">
                <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-white/10 shadow-lg">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-20">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-white tracking-tight">Live Cricket</h1>
                                    <p className="text-xs text-red-400 font-medium tracking-wide">SETUP REQUIRED</p>
                                </div>
                            </div>
                            <Link to="/" className="text-slate-400 hover:text-white transition-colors">Back to Dashboard</Link>
                        </div>
                    </div>
                </nav>
                <div className="max-w-2xl mx-auto px-4 py-20">
                    <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-8 text-center">
                        <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-500/20">
                            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-3">API Key Required</h2>
                        <p className="text-slate-400 mb-6">To access live cricket data, you need a free API key from CricAPI.</p>
                        <div className="bg-black/30 rounded-xl p-4 text-left mb-6 border border-white/5">
                            <p className="text-sm text-slate-300 mb-3 font-medium">Setup Steps:</p>
                            <ol className="text-sm text-slate-400 space-y-2 list-decimal list-inside">
                                <li>Go to <span className="text-blue-400 font-medium">https://cricapi.com</span> and sign up</li>
                                <li>Copy your API key from the dashboard</li>
                                <li>Open <span className="text-yellow-400 font-mono text-xs">backend/.env</span></li>
                                <li>Replace <span className="text-yellow-400 font-mono text-xs">your_api_key_here</span> with your key</li>
                                <li>Restart the backend server</li>
                            </ol>
                        </div>
                        <div className="bg-slate-800 rounded-lg p-3 font-mono text-xs text-slate-300 text-left">
                            CRICKET_API_KEY=your_actual_key_here
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 font-sans text-slate-200">
            <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-white/10 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white tracking-tight">Live Cricket</h1>
                                <p className="text-xs text-red-400 font-medium tracking-wide">REAL-TIME SCORES</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {lastUpdated && (
                                <div className="hidden md:flex items-center gap-2 text-xs text-slate-500">
                                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${sseConnected ? 'bg-emerald-500' : 'bg-yellow-500'}`}></span>
                                    {sseConnected ? 'Live' : 'Connecting...'} · {lastUpdated.toLocaleTimeString()}
                                </div>
                            )}
                            {apiInfo && (
                                <span className="hidden md:block text-[10px] text-slate-600 bg-slate-800 px-2 py-1 rounded">
                                    {apiInfo.hitsUsed}/{apiInfo.hitsLimit} API calls
                                </span>
                            )}
                            <button onClick={fetchMatches} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Refresh">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                            </button>
                            <Link to="/" className="text-slate-400 hover:text-white transition-colors text-sm">Back to Dashboard</Link>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">Match Center</h2>
                    <p className="text-slate-400">Live scores, upcoming fixtures, and recent results.</p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
                        <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <p className="text-sm text-red-400">{error}</p>
                        <button onClick={fetchMatches} className="ml-auto text-xs text-red-400 hover:text-red-300 underline">Retry</button>
                    </div>
                )}

                <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-8">
                    <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-xl border border-white/5">
                        {statusFilters.map(f => (
                            <button
                                key={f.key}
                                onClick={() => setStatusFilter(f.key)}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                                    statusFilter === f.key
                                        ? 'bg-white text-slate-900 shadow-lg'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {f.icon}
                                {f.label}
                                <span className={`text-xs ml-1 ${statusFilter === f.key ? 'text-slate-600' : 'text-slate-600'}`}>
                                    {counts[f.key]}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-1">
                        {typeFilters.map(t => (
                            <button
                                key={t}
                                onClick={() => setTypeFilter(t)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                    typeFilter === t
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-500 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredMatches.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/10 border-dashed">
                        <div className="text-5xl mb-4">🏏</div>
                        <h3 className="text-xl font-bold text-white mb-2">No Matches Found</h3>
                        <p className="text-slate-400 text-sm">
                            {matches.length === 0
                                ? 'No matches available right now. Check back later!'
                                : 'Try adjusting your filters to see more matches.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredMatches.map(match => (
                            <MatchCard
                                key={match.id}
                                match={match}
                                onClick={setSelectedMatch}
                            />
                        ))}
                    </div>
                )}
            </div>

            {selectedMatch && (
                <MatchDetailModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />
            )}
        </div>
    );
};

export default LiveMatches;
