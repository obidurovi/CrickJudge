import React, { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const TOTAL_OVERS = 20;
const TOTAL_BALLS = TOTAL_OVERS * 6;
const BALL_DELAY_MS = 180;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const runColor = (runs) => {
    if (runs === 6) return '#a855f7';
    if (runs === 4) return '#3b82f6';
    if (runs === 3) return '#22c55e';
    if (runs === 2) return '#f59e0b';
    return '#14b8a6';
};

const outcomeClass = (event) => {
    if (event.isWicket) return 'bg-red-500 border-red-400 text-white';
    if (event.runs === 6) return 'bg-purple-600 border-purple-400 text-white';
    if (event.runs === 4) return 'bg-blue-600 border-blue-400 text-white';
    if (event.runs >= 2) return 'bg-emerald-600 border-emerald-400 text-white';
    if (event.runs === 1) return 'bg-cyan-700 border-cyan-500 text-white';
    return 'bg-slate-800 border-slate-600 text-slate-300';
};

const getBallLabel = (ballNumber) => {
    const over = Math.floor((ballNumber - 1) / 6);
    const ball = ((ballNumber - 1) % 6) + 1;
    return `${over}.${ball}`;
};

const getOversText = (balls) => `${Math.floor(balls / 6)}.${balls % 6}`;

const createShotPoint = (runs, isPowerplay) => {
    const sectors = [12, 28, 42, 58, 74, 92, 108, 124, 142, 160, 178, 202, 220, 238, 256, 272, 290, 308, 326, 344];
    const angle = sectors[Math.floor(Math.random() * sectors.length)] + (Math.random() * 10 - 5);
    const radiusByRuns = { 1: 26, 2: 39, 3: 50, 4: 62, 6: 74 };
    const baseRadius = radiusByRuns[runs] || 22;
    const radius = clamp(baseRadius + (isPowerplay && runs >= 4 ? 4 : 0) + (Math.random() * 7 - 3), 16, 78);
    const radians = (angle * Math.PI) / 180;

    return {
        angle,
        radius,
        x: 50 + Math.cos(radians) * (radius * 0.52),
        y: 50 - Math.sin(radians) * (radius * 0.52)
    };
};

const MatchSimulator = () => {
    const [players, setPlayers] = useState([]);
    const [loadingPlayers, setLoadingPlayers] = useState(true);
    const [batsman, setBatsman] = useState(null);
    const [bowler, setBowler] = useState(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [gameOver, setGameOver] = useState(false);

    const [runs, setRuns] = useState(0);
    const [wickets, setWickets] = useState(0);
    const [ballsFaced, setBallsFaced] = useState(0);

    const [powerplayRuns, setPowerplayRuns] = useState(0);
    const [powerplayWickets, setPowerplayWickets] = useState(0);

    const [matchLog, setMatchLog] = useState([]);
    const [overSummary, setOverSummary] = useState([]);
    const [wagonShots, setWagonShots] = useState([]);

    const cancelledRef = useRef(false);

    useEffect(() => {
        const fetchPlayers = async () => {
            try {
                const { data } = await axios.get('http://localhost:5000/api/players?offset=0');
                const list = data.players || data;
                const normalized = Array.isArray(list) ? list.filter((p) => p && p.stats) : [];
                setPlayers(normalized);
            } catch (error) {
                console.error('Error fetching players', error);
                setPlayers([]);
            } finally {
                setLoadingPlayers(false);
            }
        };

        fetchPlayers();
    }, []);

    useEffect(() => {
        return () => {
            cancelledRef.current = true;
        };
    }, []);

    const batsmanOptions = useMemo(
        () => players.filter((p) => !p.role || p.role === 'Batsman' || p.role === 'Wicketkeeper' || p.role === 'Allrounder'),
        [players]
    );

    const bowlerOptions = useMemo(
        () => players.filter((p) => !p.role || p.role === 'Bowler' || p.role === 'Allrounder'),
        [players]
    );

    const simulateDelivery = ({ ballNumber }) => {
        const over = Math.floor((ballNumber - 1) / 6) + 1;
        const isPowerplay = over <= 6;

        const strikeRate = Number(batsman?.stats?.strikeRate) || 120;
        const economy = Number(bowler?.stats?.economy) || 7;

        const battingIntent = clamp((strikeRate - 95) / 40, 0.35, 1.45);
        const bowlingThreat = clamp((8.2 - economy) / 4.5, 0.25, 1.35);
        const phaseBoost = isPowerplay ? 1.12 : (over > 15 ? 1.2 : 1.0);

        const wicketProbability = clamp(
            0.028 + bowlingThreat * 0.03 + (isPowerplay ? 0.006 : 0) + (over > 15 ? 0.008 : 0) - battingIntent * 0.012,
            0.02,
            0.18
        );

        if (Math.random() < wicketProbability) {
            return {
                ballNumber,
                over,
                isPowerplay,
                isWicket: true,
                runs: 0,
                text: 'Wicket'
            };
        }

        const scoringIndex = clamp(battingIntent * phaseBoost * (1.55 - bowlingThreat * 0.42), 0.32, 1.95);
        const sample = Math.random() * scoringIndex;
        let outcomeRuns = 0;
        let text = 'Dot Ball';

        if (sample < 0.24) {
            outcomeRuns = 0;
            text = 'Dot Ball';
        } else if (sample < 0.55) {
            outcomeRuns = 1;
            text = 'Single';
        } else if (sample < 0.72) {
            outcomeRuns = 2;
            text = 'Two';
        } else if (sample < 0.78) {
            outcomeRuns = 3;
            text = 'Three';
        } else if (sample < 0.93) {
            outcomeRuns = 4;
            text = 'Four';
        } else {
            outcomeRuns = 6;
            text = 'Six';
        }

        const shot = outcomeRuns > 0 ? createShotPoint(outcomeRuns, isPowerplay) : null;

        return {
            ballNumber,
            over,
            isPowerplay,
            isWicket: false,
            runs: outcomeRuns,
            text,
            shot
        };
    };

    const resetInningsState = () => {
        setRuns(0);
        setWickets(0);
        setBallsFaced(0);
        setPowerplayRuns(0);
        setPowerplayWickets(0);
        setMatchLog([]);
        setOverSummary([]);
        setWagonShots([]);
        setGameOver(false);
    };

    const playInnings = async () => {
        if (!batsman || !bowler) return;

        cancelledRef.current = false;
        setIsPlaying(true);
        resetInningsState();

        let currentRuns = 0;
        let currentWickets = 0;
        let currentBalls = 0;
        let ppRuns = 0;
        let ppWickets = 0;
        const log = [];
        const overs = [];
        const shots = [];

        for (let ballNumber = 1; ballNumber <= TOTAL_BALLS && currentWickets < 10; ballNumber++) {
            await new Promise((resolve) => setTimeout(resolve, BALL_DELAY_MS));
            if (cancelledRef.current) {
                setIsPlaying(false);
                return;
            }

            const event = simulateDelivery({ ballNumber });
            currentBalls += 1;

            const overIndex = Math.floor((ballNumber - 1) / 6);
            if (!overs[overIndex]) {
                overs[overIndex] = { over: overIndex + 1, runs: 0, wickets: 0, balls: 0 };
            }

            overs[overIndex].balls += 1;

            if (event.isWicket) {
                currentWickets += 1;
                overs[overIndex].wickets += 1;
                if (event.isPowerplay) ppWickets += 1;
            } else {
                currentRuns += event.runs;
                overs[overIndex].runs += event.runs;
                if (event.isPowerplay) ppRuns += event.runs;
            }

            const inningsOverText = getOversText(currentBalls);
            const currentRR = currentBalls ? (currentRuns * 6) / currentBalls : 0;

            const eventWithContext = {
                ...event,
                label: getBallLabel(ballNumber),
                scoreAfter: `${currentRuns}/${currentWickets}`,
                overText: inningsOverText,
                runRateAfter: currentRR
            };

            if (event.shot) {
                shots.push({
                    ...event.shot,
                    runs: event.runs,
                    label: eventWithContext.label
                });
            }

            log.push(eventWithContext);

            setRuns(currentRuns);
            setWickets(currentWickets);
            setBallsFaced(currentBalls);
            setPowerplayRuns(ppRuns);
            setPowerplayWickets(ppWickets);
            setMatchLog([...log]);
            setOverSummary([...overs.filter(Boolean)]);
            setWagonShots([...shots]);
        }

        setIsPlaying(false);
        setGameOver(true);
    };

    const currentRR = ballsFaced ? ((runs * 6) / ballsFaced) : 0;
    const projectedScore = currentRR * TOTAL_OVERS;
    const overText = getOversText(ballsFaced);
    const powerplayActive = ballsFaced < 36;
    const inningsComplete = ballsFaced >= TOTAL_BALLS || wickets >= 10;
    const recentBalls = matchLog.slice(-18);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 font-sans text-slate-200">
            <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-white/10 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center gap-3">
                            <Link to="/" className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-white tracking-tight">Match Simulator</h1>
                                <p className="text-xs text-orange-300 font-medium tracking-wide">FULL T20 INNINGS ENGINE</p>
                            </div>
                        </div>
                        <Link to="/" className="text-slate-400 hover:text-white transition-colors">Back to Dashboard</Link>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <label className="block text-blue-400 font-bold mb-2">Select Batsman Profile</label>
                        <select
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white"
                            value={batsman ? (batsman._id || batsman.apiId) : ''}
                            onChange={(e) => setBatsman(batsmanOptions.find((p) => (p._id || p.apiId) === e.target.value) || null)}
                        >
                            <option value="">Choose Player...</option>
                            {batsmanOptions.map((p) => (
                                <option key={p._id || p.apiId} value={p._id || p.apiId}>{p.name}</option>
                            ))}
                        </select>
                        {batsman && (
                            <p className="text-xs text-slate-400 mt-3">Strike Rate Influence: {batsman?.stats?.strikeRate || 'N/A'}</p>
                        )}
                    </div>

                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <label className="block text-red-400 font-bold mb-2">Select Bowler Profile</label>
                        <select
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white"
                            value={bowler ? (bowler._id || bowler.apiId) : ''}
                            onChange={(e) => setBowler(bowlerOptions.find((p) => (p._id || p.apiId) === e.target.value) || null)}
                        >
                            <option value="">Choose Player...</option>
                            {bowlerOptions.map((p) => (
                                <option key={p._id || p.apiId} value={p._id || p.apiId}>{p.name}</option>
                            ))}
                        </select>
                        {bowler && (
                            <p className="text-xs text-slate-400 mt-3">Economy Influence: {bowler?.stats?.economy || 'N/A'}</p>
                        )}
                    </div>
                </div>

                <div className="text-center mb-8">
                    <button
                        onClick={playInnings}
                        disabled={!batsman || !bowler || isPlaying || loadingPlayers}
                        className={`px-8 py-4 rounded-full font-bold text-lg shadow-lg transition-all transform hover:scale-105 ${
                            !batsman || !bowler || loadingPlayers
                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                : isPlaying
                                    ? 'bg-yellow-600 text-white cursor-wait'
                                    : 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:shadow-orange-500/50'
                        }`}
                    >
                        {isPlaying ? 'Simulating 20 Overs...' : gameOver ? 'Simulate Again' : 'Start Full T20 Innings'}
                    </button>
                </div>

                {(matchLog.length > 0 || isPlaying || gameOver) && (
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        <div className="xl:col-span-2 space-y-6">
                            <div className="bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 p-6 md:p-8">
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div className="bg-slate-900/60 rounded-xl p-4 border border-white/10">
                                        <p className="text-xs text-slate-400 uppercase tracking-wider">Score</p>
                                        <p className="text-3xl font-black text-white">{runs}/{wickets}</p>
                                    </div>
                                    <div className="bg-slate-900/60 rounded-xl p-4 border border-white/10">
                                        <p className="text-xs text-slate-400 uppercase tracking-wider">Overs</p>
                                        <p className="text-3xl font-black text-white">{overText}</p>
                                    </div>
                                    <div className="bg-slate-900/60 rounded-xl p-4 border border-white/10">
                                        <p className="text-xs text-slate-400 uppercase tracking-wider">Current RR</p>
                                        <p className="text-3xl font-black text-white">{currentRR.toFixed(2)}</p>
                                    </div>
                                    <div className="bg-slate-900/60 rounded-xl p-4 border border-white/10">
                                        <p className="text-xs text-slate-400 uppercase tracking-wider">Projected</p>
                                        <p className="text-3xl font-black text-white">{Math.round(projectedScore)}</p>
                                    </div>
                                    <div className="bg-slate-900/60 rounded-xl p-4 border border-white/10">
                                        <p className="text-xs text-slate-400 uppercase tracking-wider">Powerplay</p>
                                        <p className={`text-sm font-bold ${powerplayActive ? 'text-emerald-400' : 'text-slate-300'}`}>
                                            {powerplayActive ? 'ACTIVE' : `${powerplayRuns}/${powerplayWickets}`}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-1">Overs 1-6 rules</p>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <p className="text-sm uppercase tracking-wider text-slate-400 mb-3">Recent Deliveries</p>
                                    <div className="flex flex-wrap gap-2">
                                        {recentBalls.map((event, index) => (
                                            <div key={`${event.label}-${index}`} className={`w-11 h-11 rounded-full flex items-center justify-center font-bold border-2 ${outcomeClass(event)}`} title={`${event.label} - ${event.text}`}>
                                                {event.isWicket ? 'W' : event.runs}
                                            </div>
                                        ))}
                                        {recentBalls.length === 0 && (
                                            <p className="text-slate-500 text-sm">Ball-by-ball events appear here as the innings runs.</p>
                                        )}
                                    </div>
                                </div>

                                {gameOver && (
                                    <div className="mt-6 bg-slate-900/70 border border-white/10 rounded-xl p-4">
                                        <p className="text-sm text-slate-300">
                                            Innings complete at {runs}/{wickets} in {overText} overs.
                                            {inningsComplete && wickets >= 10 ? ' All out.' : ' Full allocation completed.'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-sm uppercase tracking-wider text-slate-300">Over Summary</p>
                                    <p className="text-xs text-slate-500">Runs / Wickets per over</p>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                    {overSummary.map((entry) => (
                                        <div key={entry.over} className="rounded-xl border border-white/10 bg-slate-900/70 p-3">
                                            <p className="text-xs text-slate-500">Over {entry.over}</p>
                                            <p className="text-lg font-bold text-white">{entry.runs}/{entry.wickets}</p>
                                            <p className="text-xs text-slate-400">{entry.balls} balls</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-sm uppercase tracking-wider text-slate-300">Wagon Wheel</p>
                                <p className="text-xs text-slate-500">Scoring shot map</p>
                            </div>

                            <svg viewBox="0 0 100 100" className="w-full max-w-xs mx-auto">
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#334155" strokeWidth="0.8" />
                                <circle cx="50" cy="50" r="30" fill="none" stroke="#334155" strokeWidth="0.7" />
                                <circle cx="50" cy="50" r="20" fill="none" stroke="#334155" strokeWidth="0.6" />
                                <line x1="50" y1="10" x2="50" y2="90" stroke="#334155" strokeWidth="0.6" />
                                <line x1="10" y1="50" x2="90" y2="50" stroke="#334155" strokeWidth="0.6" />
                                <line x1="21" y1="21" x2="79" y2="79" stroke="#334155" strokeWidth="0.5" />
                                <line x1="79" y1="21" x2="21" y2="79" stroke="#334155" strokeWidth="0.5" />

                                {wagonShots.map((shot, idx) => (
                                    <g key={`${shot.label}-${idx}`}>
                                        <line x1="50" y1="50" x2={shot.x} y2={shot.y} stroke={runColor(shot.runs)} strokeOpacity="0.35" strokeWidth="0.4" />
                                        <circle cx={shot.x} cy={shot.y} r={shot.runs >= 4 ? 1.4 : 1.1} fill={runColor(shot.runs)}>
                                            <title>{`${shot.label}: ${shot.runs} run${shot.runs > 1 ? 's' : ''}`}</title>
                                        </circle>
                                    </g>
                                ))}
                            </svg>

                            <div className="mt-5 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-400">Scoring shots</span>
                                    <span className="font-semibold text-white">{wagonShots.length}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-400">Boundaries</span>
                                    <span className="font-semibold text-white">{matchLog.filter((e) => e.runs === 4 || e.runs === 6).length}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-slate-400">Dots</span>
                                    <span className="font-semibold text-white">{matchLog.filter((e) => !e.isWicket && e.runs === 0).length}</span>
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                                {[1, 2, 4, 6].map((r) => (
                                    <div key={r} className="flex items-center gap-2 text-slate-300">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: runColor(r) }}></span>
                                        {r}s
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MatchSimulator;
