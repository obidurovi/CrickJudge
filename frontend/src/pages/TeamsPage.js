import React, { useState, useEffect } from 'react';
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
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!selectedTeam) return;
        const fetchTeamPlayers = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data } = await axios.get(`${API}/team/${encodeURIComponent(selectedTeam)}`);
                setPlayers(data.players || []);
            } catch (err) {
                setError('Failed to load team players');
            } finally {
                setLoading(false);
            }
        };
        fetchTeamPlayers();
    }, [selectedTeam]);

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
                    <h2 className="text-xl font-semibold text-white mb-4">{selectedTeam} Players</h2>
                    {loading && <p className="text-slate-400">Loading...</p>}
                    {error && <p className="text-red-400">{error}</p>}
                    {!loading && !error && players.length === 0 && (
                        <p className="text-slate-500">No players found for {selectedTeam}.</p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {players.map(player => (
                            <Link
                                key={player.apiId || player._id}
                                to={`/player/${player.apiId}`}
                                className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:bg-slate-700 transition-all"
                            >
                                <p className="text-white font-semibold">{player.name}</p>
                                {player.country && <p className="text-slate-400 text-sm">{player.country}</p>}
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
