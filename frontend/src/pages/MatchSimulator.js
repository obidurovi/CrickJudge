import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const MatchSimulator = () => {
    const [players, setPlayers] = useState([]);
    const [batsman, setBatsman] = useState(null);
    const [bowler, setBowler] = useState(null);
    const [matchLog, setMatchLog] = useState([]);
    const [score, setScore] = useState(0);
    const [wickets, setWickets] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [gameOver, setGameOver] = useState(false);

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

    const simulateBall = (ballNum) => {
        if (!batsman || !bowler) return;

        // Simple probability logic
        // Higher SR = higher chance of boundaries but also wickets
        // Lower Eco = lower runs
        
        const batFactor = batsman.stats.strikeRate / 100; // e.g., 1.4
        const bowlFactor = (12 - bowler.stats.economy) / 10; // e.g., (12-6)/10 = 0.6 (Good bowler reduces runs)
        
        const random = Math.random();
        let outcome = 0;
        let text = "";
        let isWicket = false;

        // Wicket Probability
        const wicketProb = 0.05 + (0.05 * (1/batFactor)) + (0.05 * bowlFactor); 

        if (random < wicketProb) {
            outcome = 0;
            text = "WICKET!";
            isWicket = true;
        } else {
            // Run scoring logic
            const runRandom = Math.random() * batFactor * (1.5 - bowlFactor);
            
            if (runRandom > 0.95) { outcome = 6; text = "SIX!"; }
            else if (runRandom > 0.8) { outcome = 4; text = "FOUR!"; }
            else if (runRandom > 0.6) { outcome = 2; text = "2 Runs"; }
            else if (runRandom > 0.3) { outcome = 1; text = "1 Run"; }
            else { outcome = 0; text = "Dot Ball"; }
        }

        return { ball: ballNum, runs: outcome, text, isWicket };
    };

    const playOver = async () => {
        setIsPlaying(true);
        setMatchLog([]);
        setScore(0);
        setWickets(0);
        setGameOver(false);

        let currentScore = 0;
        let currentWickets = 0;
        let logs = [];

        for (let i = 1; i <= 6; i++) {
            if (currentWickets >= 10) break; // All out logic (though 1v1)

            await new Promise(r => setTimeout(r, 800)); // Delay for effect
            
            const result = simulateBall(i);
            logs.push(result);
            
            if (result.isWicket) {
                currentWickets++;
            } else {
                currentScore += result.runs;
            }

            setMatchLog([...logs]);
            setScore(currentScore);
            setWickets(currentWickets);
        }

        setIsPlaying(false);
        setGameOver(true);
    };

    return (
        <div className='min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 font-sans text-slate-200'>
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-white/10 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center gap-3">
                            <Link to="/" className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-white tracking-tight">Match Simulator</h1>
                                <p className="text-xs text-orange-300 font-medium tracking-wide">1-OVER SHOWDOWN</p>
                            </div>
                        </div>
                        <Link to="/" className="text-slate-400 hover:text-white transition-colors">Back to Dashboard</Link>
                    </div>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-4 py-12">
                
                {/* Selection Area */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    {/* Batsman Select */}
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <label className="block text-blue-400 font-bold mb-2">Select Batsman</label>
                        <select 
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white"
                            onChange={(e) => setBatsman(players.find(p => p._id === e.target.value))}
                        >
                            <option value="">Choose Player...</option>
                            {players.filter(p => p.role === 'Batsman' || p.role === 'Wicketkeeper' || p.role === 'Allrounder').map(p => (
                                <option key={p._id} value={p._id}>{p.name}</option>
                            ))}
                        </select>
                        {batsman && (
                            <div className="mt-4 flex items-center gap-4">
                                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center text-2xl font-bold border border-blue-500/50 overflow-hidden">
                                    {batsman.image ? <img src={batsman.image} alt={batsman.name} className="w-full h-full object-cover"/> : batsman.name[0]}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{batsman.name}</h3>
                                    <p className="text-xs text-slate-400">SR: {batsman.stats.strikeRate}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bowler Select */}
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <label className="block text-red-400 font-bold mb-2">Select Bowler</label>
                        <select 
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white"
                            onChange={(e) => setBowler(players.find(p => p._id === e.target.value))}
                        >
                            <option value="">Choose Player...</option>
                            {players.filter(p => p.role === 'Bowler' || p.role === 'Allrounder').map(p => (
                                <option key={p._id} value={p._id}>{p.name}</option>
                            ))}
                        </select>
                        {bowler && (
                            <div className="mt-4 flex items-center gap-4">
                                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center text-2xl font-bold border border-red-500/50 overflow-hidden">
                                    {bowler.image ? <img src={bowler.image} alt={bowler.name} className="w-full h-full object-cover"/> : bowler.name[0]}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{bowler.name}</h3>
                                    <p className="text-xs text-slate-400">Eco: {bowler.stats.economy}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Button */}
                <div className="text-center mb-12">
                    <button 
                        onClick={playOver}
                        disabled={!batsman || !bowler || isPlaying}
                        className={`px-8 py-4 rounded-full font-bold text-xl shadow-lg transition-all transform hover:scale-105 ${
                            !batsman || !bowler ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 
                            isPlaying ? 'bg-yellow-600 text-white cursor-wait' : 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:shadow-orange-500/50'
                        }`}
                    >
                        {isPlaying ? 'Simulating...' : gameOver ? 'Play Again' : 'Start 1-Over Match'}
                    </button>
                </div>

                {/* Scoreboard */}
                {(matchLog.length > 0 || isPlaying) && (
                    <div className="bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 p-8 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                        
                        <div className="text-6xl font-black text-white mb-2 tracking-tighter">
                            {score}/{wickets}
                        </div>
                        <p className="text-slate-400 uppercase tracking-widest text-sm mb-8">Total Score (1 Over)</p>

                        <div className="flex justify-center gap-3">
                            {matchLog.map((log, index) => (
                                <div key={index} className={`w-12 h-12 rounded-full flex items-center justify-center font-bold border-2 animate-scale-in ${
                                    log.isWicket ? 'bg-red-500 border-red-400 text-white' : 
                                    log.runs === 6 ? 'bg-purple-600 border-purple-400 text-white' :
                                    log.runs === 4 ? 'bg-blue-600 border-blue-400 text-white' :
                                    'bg-slate-800 border-slate-600 text-slate-300'
                                }`}>
                                    {log.isWicket ? 'W' : log.runs}
                                </div>
                            ))}
                            {/* Placeholders for remaining balls */}
                            {[...Array(6 - matchLog.length)].map((_, i) => (
                                <div key={i} className="w-12 h-12 rounded-full border-2 border-slate-800 bg-slate-900/50"></div>
                            ))}
                        </div>

                        {gameOver && (
                            <div className="mt-8 animate-fade-in-up">
                                <p className="text-xl text-yellow-400 font-bold">
                                    {score > 15 ? "🔥 Explosive Batting!" : score > 8 ? "🏏 Decent Over" : "🎯 Great Bowling!"}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MatchSimulator;