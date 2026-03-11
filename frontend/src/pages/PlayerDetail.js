import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import useSSE from '../hooks/useSSE';

const API = 'http://localhost:5000/api/players';

const StatCard = ({ label, value, sub }) => (
  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{label}</p>
    <p className="text-2xl font-bold text-white">{value ?? '-'}</p>
    {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
  </div>
);

const FormatSection = ({ title, color, stats }) => {
  if (!stats || !stats.matches) return null;
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <h3 className={`text-lg font-bold mb-4 ${color}`}>{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard label="Matches" value={stats.matches} />
        <StatCard label="Innings" value={stats.innings} />
        <StatCard label="Runs" value={stats.runs?.toLocaleString()} />
        <StatCard label="Average" value={stats.average} />
        <StatCard label="Strike Rate" value={stats.strikeRate} />
        <StatCard label="100s" value={stats.hundreds} />
        <StatCard label="50s" value={stats.fifties} />
        <StatCard label="Best Batting" value={stats.bestBatting || '-'} />
        <StatCard label="Wickets" value={stats.wickets} />
        <StatCard label="Bowl Avg" value={stats.bowlingAvg} />
        <StatCard label="Economy" value={stats.economy} />
        <StatCard label="Best Bowling" value={stats.bestBowling || '-'} />
      </div>
    </div>
  );
};

const PlayerDetail = () => {
  const { apiId } = useParams();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlayer = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API}/detail/${apiId}`);
        setPlayer(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load player');
      } finally {
        setLoading(false);
      }
    };
    fetchPlayer();
  }, [apiId]);

  // SSE: listen for real-time updates when this player is re-synced
  const sseHandlers = useMemo(() => ({
    'player:update': (data) => {
      if (data) setPlayer(data);
    }
  }), []);

  const { connected: sseConnected } = useSSE(`/player/${apiId}`, sseHandlers);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center gap-4">
        <p className="text-red-400 text-lg">{error || 'Player not found'}</p>
        <Link to="/" className="text-blue-400 hover:text-blue-300 underline">Back to Dashboard</Link>
      </div>
    );
  }

  const roleColor = {
    'Batsman': 'text-blue-400', 'Batter': 'text-blue-400',
    'Bowler': 'text-rose-400',
    'Allrounder': 'text-purple-400', 'All-Rounder': 'text-purple-400',
    'Wicketkeeper': 'text-amber-400', 'WK-Batter': 'text-amber-400',
  };

  const stats = player.stats || {};
  const detailed = player.detailedStats || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-slate-200 p-6 lg:p-10">
      <div className="max-w-5xl mx-auto">

        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group">
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          Back to Players
        </Link>

        {/* Player Header */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {player.image ? (
              <img src={player.image} alt={player.name} className="w-24 h-24 rounded-2xl object-cover border border-white/10 shadow-lg" />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center text-4xl font-bold text-white border border-white/10">
                {player.name?.charAt(0)}
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl lg:text-4xl font-bold text-white">{player.name}</h1>
                {player.source === 'api' && (
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-semibold flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${sseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                    LIVE DATA
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <span className="text-slate-400 text-sm uppercase tracking-wider font-medium">{player.country}</span>
                <span className={`text-sm font-bold ${roleColor[player.role] || 'text-slate-300'}`}>{player.role}</span>
                {player.dateOfBirth && (
                  <span className="text-xs text-slate-500">Born: {new Date(player.dateOfBirth).toLocaleDateString()}</span>
                )}
                {player.placeOfBirth && (
                  <span className="text-xs text-slate-500">{player.placeOfBirth}</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            <StatCard label="Total Runs" value={(stats.runs || 0).toLocaleString()} />
            <StatCard label="Total Wickets" value={stats.wickets || 0} />
            <StatCard label="Average" value={stats.average || 0} />
            <StatCard label="Strike Rate" value={stats.strikeRate || 0} />
          </div>
        </div>

        {/* Format-wise Detailed Stats */}
        {(detailed.test || detailed.odi || detailed.t20i || detailed.ipl) ? (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Career Statistics</h2>
            <FormatSection title="Test Cricket" color="text-red-400" stats={detailed.test} />
            <FormatSection title="One Day Internationals" color="text-blue-400" stats={detailed.odi} />
            <FormatSection title="T20 Internationals" color="text-green-400" stats={detailed.t20i} />
            <FormatSection title="IPL" color="text-amber-400" stats={detailed.ipl} />
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            <p className="text-slate-400">Detailed format-wise stats not available for this player.</p>
            <p className="text-xs text-slate-500 mt-2">Try searching for this player from the live API to get detailed stats.</p>
          </div>
        )}

        {/* Sync Info */}
        {player.lastSynced && (
          <p className="text-xs text-slate-600 mt-8 text-center">
            Last synced: {new Date(player.lastSynced).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default PlayerDetail;
