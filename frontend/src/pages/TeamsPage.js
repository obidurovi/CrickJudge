import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API = 'http://localhost:5000/api/players';

const TEAMS = [
    'India', 'Australia', 'England', 'South Africa', 'New Zealand',
    'Pakistan', 'Sri Lanka', 'Bangladesh', 'West Indies', 'Afghanistan',
    'Zimbabwe', 'Ireland', 'Netherlands', 'Scotland', 'Nepal'
];

const TeamsPage = () => {
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [gender, setGender] = useState('male');
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const [total, setTotal] = useState(0);
    const [syncing, setSyncing] = useState(false);
    const pollRef = useRef(null);

    const fetchTeamPlayers = async (isPolling = false) => {
        if (!isPolling) setLoading(true);
        setError(null);
        try {
            const { data } = await axios.get(`${API}/team/${encodeURIComponent(selectedTeam)}?gender=${gender}`);
            setPlayers(data.players || []);
            setTotal(data.total || 0);
            setMessage(data.message || null);
            setSyncing(data.syncing || false);
        } catch (err) {
            if (!isPolling) setError('Failed to load team players');
        } finally {
            if (!isPolling) setLoading(false);
        }
    };

    useEffect(() => {
        if (!selectedTeam) return;
        fetchTeamPlayers(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTeam, gender]);

    // Auto-poll every 5s while syncing
    useEffect(() => {
        if (pollRef.current) clearInterval(pollRef.current);
        if (syncing && selectedTeam) {
            pollRef.current = setInterval(() => fetchTeamPlayers(true), 5000);
        }
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [syncing, selectedTeam, gender]);

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-white mb-6">Teams</h1>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
                {TEAMS.map(team => (
                    <button
                        key={team}
                        onClick={() => setSelectedTeam(team)}
                        className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                            selectedTeam === team
                                ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-900/40'
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                        }`}
                    >
                        {team}
                    </button>
                ))}
            </div>

            {selectedTeam && (
                <div>
                    <div className="flex items-center gap-4 mb-4">
                        <h2 className="text-xl font-semibold text-white">{selectedTeam}</h2>
                        <div className="flex rounded-lg overflow-hidden border border-slate-600">
                            <button
                                onClick={() => setGender('male')}
                                className={`px-4 py-1.5 text-sm font-medium transition-all ${
                                    gender === 'male'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-800 text-slate-400 hover:text-white'
                                }`}
                            >
                                Men
                            </button>
                            <button
                                onClick={() => setGender('female')}
                                className={`px-4 py-1.5 text-sm font-medium transition-all ${
                                    gender === 'female'
                                        ? 'bg-pink-600 text-white'
                                        : 'bg-slate-800 text-slate-400 hover:text-white'
                                }`}
                            >
                                Women
                            </button>
                        </div>
                    </div>
                    {loading && <p className="text-slate-400">Loading players...</p>}
                    {error && <p className="text-red-400">{error}</p>}
                    {message && !loading && (
                        <div className="flex items-center gap-3 text-amber-400 text-sm mb-4 bg-amber-900/20 border border-amber-800 rounded-lg px-4 py-2">
                            {syncing && (
                                <svg className="animate-spin h-4 w-4 flex-shrink-0" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                </svg>
                            )}
                            <span>{message}</span>
                        </div>
                    )}
                    {!loading && !error && players.length === 0 && !message && (
                        <p className="text-slate-500">No players found for {selectedTeam}.</p>
                    )}
                    {!loading && players.length > 0 && (
                        <p className="text-slate-400 text-sm mb-4">{total} player{total !== 1 ? 's' : ''}</p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {players.map(player => (
                            <Link
                                key={player.apiId || player._id}
                                to={`/player/${player.apiId}`}
                                className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:bg-slate-700 transition-all flex items-center gap-4"
                            >
                                {player.image ? (
                                    <img
                                        src={player.image}
                                        alt={player.name}
                                        className="w-12 h-12 rounded-full object-cover bg-slate-700 flex-shrink-0"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 text-slate-400 text-lg font-bold">
                                        {player.name?.charAt(0)}
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <p className="text-white font-semibold truncate">{player.name}</p>
                                    {player.role && player.role !== 'Unknown' && (
                                        <p className="text-slate-400 text-xs">{player.role}</p>
                                    )}
                                    {player.stats && player.stats.matches > 0 && (
                                        <p className="text-slate-500 text-xs mt-0.5">
                                            {player.stats.matches} matches · {player.stats.runs} runs
                                            {player.stats.wickets > 0 && ` · ${player.stats.wickets} wkts`}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {!selectedTeam && (
                <p className="text-slate-500 text-center mt-12">Select a team to view players</p>
            )}
        </div>
    );
};

export default TeamsPage;
