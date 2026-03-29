import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Line, ReferenceArea } from 'recharts';
import {
    useLazyGetLastSimulationQuery,
    useSaveLastSimulationMutation,
    useClearLastSimulationMutation
} from '../store/simulationStorageApi';

const TOTAL_OVERS = 20;
const TOTAL_BALLS = TOTAL_OVERS * 6;
const BALL_DELAY_MS = 180;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getPlayerId = (player) => player?._id || player?.apiId || player?.name;

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

const parseOversTextToBalls = (oversText) => {
    const raw = typeof oversText === 'string' ? oversText : '0.0';
    const [overPart, ballPart] = raw.split('.');
    const overs = Number(overPart) || 0;
    const balls = Number(ballPart) || 0;
    return overs * 6 + Math.min(Math.max(balls, 0), 5);
};

const toCsvValue = (value) => {
    const raw = value === null || value === undefined ? '' : String(value);
    if (raw.includes(',') || raw.includes('"') || raw.includes('\n')) {
        return `"${raw.replace(/"/g, '""')}"`;
    }
    return raw;
};

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

const buildBattingLineup = (anchorBatter, candidates) => {
    const anchorId = getPlayerId(anchorBatter);
    const pool = candidates
        .filter((p) => getPlayerId(p) !== anchorId)
        .sort((a, b) => (Number(b?.stats?.strikeRate) || 0) - (Number(a?.stats?.strikeRate) || 0));

    return [anchorBatter, ...pool.slice(0, 10)];
};

const buildBowlingAttack = (leadBowler, candidates) => {
    const leadId = getPlayerId(leadBowler);
    const pool = candidates
        .filter((p) => getPlayerId(p) !== leadId)
        .sort((a, b) => (Number(a?.stats?.economy) || 20) - (Number(b?.stats?.economy) || 20));

    return [leadBowler, ...pool.slice(0, 4)];
};

const pickBowlerForOver = ({ overNumber, attack, spellById, previousBowlerId }) => {
    const isPowerplay = overNumber <= 6;
    const isDeath = overNumber >= 16;

    const ppGroup = attack.slice(0, Math.min(3, attack.length));
    const middleGroup = attack.length > 3 ? attack.slice(1) : attack;
    const deathGroup = attack.slice(0, Math.min(2, attack.length));

    const preferred = isPowerplay ? ppGroup : (isDeath ? deathGroup : middleGroup);

    const allowed = (list) => list.filter((b) => (spellById[getPlayerId(b)] || 0) < 4);
    const nonConsecutive = (list) => list.filter((b) => getPlayerId(b) !== previousBowlerId);

    let options = nonConsecutive(allowed(preferred));
    if (!options.length) options = allowed(preferred);
    if (!options.length) options = nonConsecutive(allowed(attack));
    if (!options.length) options = allowed(attack);

    return options[0] || attack[0] || null;
};

const MatchSimulator = () => {
    const [players, setPlayers] = useState([]);
    const [loadingPlayers, setLoadingPlayers] = useState(true);
    const [anchorBatter, setAnchorBatter] = useState(null);
    const [leadBowler, setLeadBowler] = useState(null);

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

    const [battingLineup, setBattingLineup] = useState([]);
    const [bowlingAttack, setBowlingAttack] = useState([]);
    const [currentPair, setCurrentPair] = useState({ striker: null, nonStriker: null });
    const [nextBatter, setNextBatter] = useState(null);
    const [currentOverBowler, setCurrentOverBowler] = useState(null);
    const [bowlingSpells, setBowlingSpells] = useState([]);
    const [battingStats, setBattingStats] = useState([]);
    const [fallOfWickets, setFallOfWickets] = useState([]);
    const [currentPartnership, setCurrentPartnership] = useState({ runs: 0, balls: 0, batters: '-' });
    const [bestPartnership, setBestPartnership] = useState({ runs: 0, balls: 0, batters: '-', wicketAt: '-' });
    const [copyStatus, setCopyStatus] = useState('');
    const [restoreStatus, setRestoreStatus] = useState('');

    const [saveLastSimulation, { isLoading: isSavingSimulation }] = useSaveLastSimulationMutation();
    const [clearLastSimulation, { isLoading: isClearingSimulation }] = useClearLastSimulationMutation();
    const [fetchLastSimulation, { isFetching: isRestoringSimulation }] = useLazyGetLastSimulationQuery();
    const lastAutoSavedKeyRef = useRef('');

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

    const simulateDelivery = ({ ballNumber, striker, bowler }) => {
        const over = Math.floor((ballNumber - 1) / 6) + 1;
        const isPowerplay = over <= 6;

        const strikeRate = Number(striker?.stats?.strikeRate) || 120;
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
        setBowlingSpells([]);
        setCurrentOverBowler(null);
        setCurrentPair({ striker: null, nonStriker: null });
        setNextBatter(null);
        setBattingStats([]);
        setFallOfWickets([]);
        setCurrentPartnership({ runs: 0, balls: 0, batters: '-' });
        setBestPartnership({ runs: 0, balls: 0, batters: '-', wicketAt: '-' });
        setCopyStatus('');
        setRestoreStatus('');
        setGameOver(false);
    };

    const playInnings = async () => {
        if (!anchorBatter || !leadBowler) return;

        const lineup = buildBattingLineup(anchorBatter, batsmanOptions);
        const attack = buildBowlingAttack(leadBowler, bowlerOptions);
        if (lineup.length < 2 || attack.length < 1) return;

        cancelledRef.current = false;
        setIsPlaying(true);
        resetInningsState();

        setBattingLineup(lineup);
        setBowlingAttack(attack);

        let striker = lineup[0];
        let nonStriker = lineup[1];
        let nextBatterIndex = 2;
        let overBowler = null;

        let currentRuns = 0;
        let currentWickets = 0;
        let currentBalls = 0;
        let ppRuns = 0;
        let ppWickets = 0;
        let partnershipRuns = 0;
        let partnershipBalls = 0;
        let partnershipBatters = `${striker.name} & ${nonStriker.name}`;

        let bestPartnershipRuns = 0;
        let bestPartnershipBalls = 0;
        let bestPartnershipBatters = '-';
        let bestPartnershipWicketAt = '-';

        const spellById = {};
        const log = [];
        const overs = [];
        const shots = [];
        const fowLog = [];

        const lineupOrderIds = lineup.map((p) => getPlayerId(p));
        const battingMap = {};
        lineup.forEach((p, idx) => {
            battingMap[getPlayerId(p)] = {
                id: getPlayerId(p),
                order: idx + 1,
                name: p.name,
                runs: 0,
                balls: 0,
                fours: 0,
                sixes: 0,
                isOut: false,
                entered: false,
                status: 'Yet to bat',
                dismissal: '-'
            };
        });

        const syncBattingStatuses = () => {
            lineupOrderIds.forEach((id) => {
                const row = battingMap[id];
                if (!row) return;
                if (row.isOut) {
                    row.status = 'Out';
                    return;
                }
                if (!row.entered) {
                    row.status = 'Yet to bat';
                    return;
                }
                row.status = 'Not out';
            });

            const strikerId = getPlayerId(striker);
            const nonStrikerId = getPlayerId(nonStriker);
            if (strikerId && battingMap[strikerId] && !battingMap[strikerId].isOut) battingMap[strikerId].status = 'Batting';
            if (nonStrikerId && battingMap[nonStrikerId] && !battingMap[nonStrikerId].isOut) battingMap[nonStrikerId].status = 'Batting';
        };

        const snapshotBatting = (inningsClosed = false) => lineupOrderIds.map((id) => {
            const row = battingMap[id];
            const strikeRate = row.balls ? (row.runs * 100) / row.balls : 0;
            const adjustedStatus = inningsClosed && row.status === 'Batting' ? 'Not out' : row.status;
            return {
                ...row,
                status: adjustedStatus,
                strikeRate
            };
        });

        battingMap[getPlayerId(striker)].entered = true;
        battingMap[getPlayerId(nonStriker)].entered = true;
        syncBattingStatuses();

        setCurrentPair({ striker, nonStriker });
        setNextBatter(lineup[nextBatterIndex] || null);
        setBattingStats(snapshotBatting());
        setCurrentPartnership({ runs: partnershipRuns, balls: partnershipBalls, batters: partnershipBatters });

        for (let ballNumber = 1; ballNumber <= TOTAL_BALLS && currentWickets < 10; ballNumber++) {
            const overNumber = Math.floor((ballNumber - 1) / 6) + 1;
            const isOverStart = ((ballNumber - 1) % 6) === 0;

            if (isOverStart) {
                overBowler = pickBowlerForOver({
                    overNumber,
                    attack,
                    spellById,
                    previousBowlerId: getPlayerId(overBowler)
                });
                setCurrentOverBowler(overBowler);
            }

            await new Promise((resolve) => setTimeout(resolve, BALL_DELAY_MS));
            if (cancelledRef.current) {
                setIsPlaying(false);
                return;
            }

            const event = simulateDelivery({ ballNumber, striker, bowler: overBowler });
            currentBalls += 1;
            partnershipBalls += 1;

            const overIndex = Math.floor((ballNumber - 1) / 6);
            if (!overs[overIndex]) {
                overs[overIndex] = {
                    over: overIndex + 1,
                    runs: 0,
                    wickets: 0,
                    balls: 0,
                    bowlerName: overBowler?.name || 'Unknown'
                };
            }

            overs[overIndex].balls += 1;

            const bowlerId = getPlayerId(overBowler);
            spellById[bowlerId] = spellById[bowlerId] || 0;

            const strikerAtBallStart = striker;
            const strikerId = getPlayerId(strikerAtBallStart);
            if (strikerId && battingMap[strikerId]) {
                battingMap[strikerId].entered = true;
                battingMap[strikerId].balls += 1;
            }

            if (event.isWicket) {
                currentWickets += 1;
                overs[overIndex].wickets += 1;
                if (event.isPowerplay) ppWickets += 1;

                if (partnershipRuns > bestPartnershipRuns || (partnershipRuns === bestPartnershipRuns && partnershipBalls > bestPartnershipBalls)) {
                    bestPartnershipRuns = partnershipRuns;
                    bestPartnershipBalls = partnershipBalls;
                    bestPartnershipBatters = partnershipBatters;
                    bestPartnershipWicketAt = `${currentRuns}-${currentWickets}`;
                }

                if (strikerId && battingMap[strikerId]) {
                    battingMap[strikerId].isOut = true;
                    battingMap[strikerId].dismissal = `b ${overBowler?.name || 'Unknown'}`;
                }

                fowLog.push({
                    wicket: currentWickets,
                    score: currentRuns,
                    over: getOversText(currentBalls),
                    batter: strikerAtBallStart?.name || 'Unknown',
                    bowler: overBowler?.name || 'Unknown'
                });

                if (nextBatterIndex < lineup.length) {
                    striker = lineup[nextBatterIndex];
                    const newStrikerId = getPlayerId(striker);
                    if (newStrikerId && battingMap[newStrikerId]) battingMap[newStrikerId].entered = true;
                    nextBatterIndex += 1;
                }

                partnershipRuns = 0;
                partnershipBalls = 0;
                if (striker && nonStriker) {
                    partnershipBatters = `${striker.name} & ${nonStriker.name}`;
                }
            } else {
                currentRuns += event.runs;
                overs[overIndex].runs += event.runs;
                if (event.isPowerplay) ppRuns += event.runs;
                partnershipRuns += event.runs;

                if (strikerId && battingMap[strikerId]) {
                    battingMap[strikerId].runs += event.runs;
                    if (event.runs === 4) battingMap[strikerId].fours += 1;
                    if (event.runs === 6) battingMap[strikerId].sixes += 1;
                }

                if (event.runs % 2 === 1) {
                    [striker, nonStriker] = [nonStriker, striker];
                }
            }

            if (event.shot) {
                shots.push({
                    ...event.shot,
                    runs: event.runs,
                    label: getBallLabel(ballNumber)
                });
            }

            if (currentBalls % 6 === 0) {
                spellById[bowlerId] += 1;
                if (striker && nonStriker) {
                    [striker, nonStriker] = [nonStriker, striker];
                }
            }

            syncBattingStatuses();

            const inningsOverText = getOversText(currentBalls);
            const currentRR = currentBalls ? (currentRuns * 6) / currentBalls : 0;

            log.push({
                ...event,
                label: getBallLabel(ballNumber),
                strikerName: striker?.name,
                bowlerName: overBowler?.name,
                scoreAfter: `${currentRuns}/${currentWickets}`,
                overText: inningsOverText,
                runRateAfter: currentRR
            });

            setRuns(currentRuns);
            setWickets(currentWickets);
            setBallsFaced(currentBalls);
            setPowerplayRuns(ppRuns);
            setPowerplayWickets(ppWickets);
            setMatchLog([...log]);
            setOverSummary([...overs.filter(Boolean)]);
            setWagonShots([...shots]);
            setCurrentPair({ striker, nonStriker });
            setNextBatter(lineup[nextBatterIndex] || null);
            setBattingStats(snapshotBatting());
            setFallOfWickets([...fowLog]);
            setCurrentPartnership({ runs: partnershipRuns, balls: partnershipBalls, batters: partnershipBatters });
            setBestPartnership({
                runs: bestPartnershipRuns,
                balls: bestPartnershipBalls,
                batters: bestPartnershipBatters,
                wicketAt: bestPartnershipWicketAt
            });
            setBowlingSpells(
                Object.keys(spellById).map((id) => {
                    const p = attack.find((x) => getPlayerId(x) === id);
                    return {
                        id,
                        name: p?.name || 'Unknown',
                        overs: spellById[id]
                    };
                })
            );
        }

        syncBattingStatuses();
        if (partnershipRuns > bestPartnershipRuns || (partnershipRuns === bestPartnershipRuns && partnershipBalls > bestPartnershipBalls)) {
            bestPartnershipRuns = partnershipRuns;
            bestPartnershipBalls = partnershipBalls;
            bestPartnershipBatters = partnershipBatters;
            bestPartnershipWicketAt = 'Unbroken';
        }
        setBattingStats(snapshotBatting(true));
        setFallOfWickets([...fowLog]);
        setCurrentPartnership({ runs: partnershipRuns, balls: partnershipBalls, batters: partnershipBatters });
        setBestPartnership({
            runs: bestPartnershipRuns,
            balls: bestPartnershipBalls,
            batters: bestPartnershipBatters,
            wicketAt: bestPartnershipWicketAt
        });
        setIsPlaying(false);
        setGameOver(true);
    };

    const currentRR = ballsFaced ? ((runs * 6) / ballsFaced) : 0;
    const projectedScore = currentRR * TOTAL_OVERS;
    const overText = getOversText(ballsFaced);
    const powerplayActive = ballsFaced < 36;
    const inningsComplete = ballsFaced >= TOTAL_BALLS || wickets >= 10;
    const recentBalls = matchLog.slice(-18);
    const overRunTrend = overSummary.reduce((acc, entry) => {
        const previousCumulative = acc.length ? acc[acc.length - 1].cumulative : 0;
        acc.push({
            overNumber: entry.over,
            over: `O${entry.over}`,
            runs: entry.runs,
            wickets: entry.wickets,
            cumulative: previousCumulative + entry.runs
        });
        return acc;
    }, []);

    const createExportPayload = useCallback(() => ({
        meta: {
            generatedAt: new Date().toISOString(),
            format: 'T20 innings simulation'
        },
        setup: {
            openingBatter: anchorBatter?.name || null,
            leadBowler: leadBowler?.name || null,
            battingLineup: battingLineup.map((p, idx) => ({ order: idx + 1, name: p.name })),
            bowlingAttack: bowlingAttack.map((p) => ({ name: p.name, economy: Number(p?.stats?.economy || 0) }))
        },
        scoreboard: {
            runs,
            wickets,
            overs: overText,
            currentRunRate: Number(currentRR.toFixed(2)),
            projectedScore: Math.round(projectedScore),
            powerplay: {
                active: powerplayActive,
                runs: powerplayRuns,
                wickets: powerplayWickets
            },
            partnership: {
                current: currentPartnership,
                best: bestPartnership
            }
        },
        battingCard: battingStats,
        overSummary,
        fallOfWickets,
        deliveries: matchLog
    }), [
        anchorBatter,
        leadBowler,
        battingLineup,
        bowlingAttack,
        runs,
        wickets,
        overText,
        currentRR,
        projectedScore,
        powerplayActive,
        powerplayRuns,
        powerplayWickets,
        currentPartnership,
        bestPartnership,
        battingStats,
        overSummary,
        fallOfWickets,
        matchLog
    ]);

    const triggerDownload = (content, fileName, mimeType) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const applySimulationPayload = (payload) => {
        if (!payload || !payload.scoreboard) return false;

        setIsPlaying(false);
        setGameOver(true);

        setRuns(payload.scoreboard.runs || 0);
        setWickets(payload.scoreboard.wickets || 0);
        setBallsFaced(parseOversTextToBalls(payload.scoreboard.overs));
        setPowerplayRuns(payload.scoreboard?.powerplay?.runs || 0);
        setPowerplayWickets(payload.scoreboard?.powerplay?.wickets || 0);

        setMatchLog(Array.isArray(payload.deliveries) ? payload.deliveries : []);
        setOverSummary(Array.isArray(payload.overSummary) ? payload.overSummary : []);
        setFallOfWickets(Array.isArray(payload.fallOfWickets) ? payload.fallOfWickets : []);
        setBattingStats(Array.isArray(payload.battingCard) ? payload.battingCard : []);

        const setupLineup = Array.isArray(payload.setup?.battingLineup)
            ? payload.setup.battingLineup.map((p) => ({ name: p.name }))
            : [];
        setBattingLineup(setupLineup);

        const setupAttack = Array.isArray(payload.setup?.bowlingAttack)
            ? payload.setup.bowlingAttack.map((p) => ({ name: p.name, stats: { economy: p.economy } }))
            : [];
        setBowlingAttack(setupAttack);

        setCurrentPartnership(payload.scoreboard?.partnership?.current || { runs: 0, balls: 0, batters: '-' });
        setBestPartnership(payload.scoreboard?.partnership?.best || { runs: 0, balls: 0, batters: '-', wicketAt: '-' });

        const activeBatters = (payload.battingCard || []).filter((r) => r.status === 'Batting' || r.status === 'Not out');
        setCurrentPair({
            striker: activeBatters[0] ? { name: activeBatters[0].name } : null,
            nonStriker: activeBatters[1] ? { name: activeBatters[1].name } : null
        });

        const next = (payload.battingCard || []).find((r) => r.status === 'Yet to bat');
        setNextBatter(next ? { name: next.name } : null);

        const lastOver = Array.isArray(payload.overSummary) && payload.overSummary.length
            ? payload.overSummary[payload.overSummary.length - 1]
            : null;
        setCurrentOverBowler(lastOver?.bowlerName ? { name: lastOver.bowlerName } : null);

        if (players.length) {
            const restoredAnchor = players.find((p) => p.name === payload.setup?.openingBatter);
            const restoredLead = players.find((p) => p.name === payload.setup?.leadBowler);
            if (restoredAnchor) setAnchorBatter(restoredAnchor);
            if (restoredLead) setLeadBowler(restoredLead);
        }

        return true;
    };

    useEffect(() => {
        if (!gameOver || !matchLog.length) return;

        const saveKey = `${runs}-${wickets}-${ballsFaced}-${matchLog.length}`;
        if (saveKey === lastAutoSavedKeyRef.current) return;

        lastAutoSavedKeyRef.current = saveKey;
        saveLastSimulation(createExportPayload()).catch(() => {
            setRestoreStatus('Auto-save failed');
        });
    }, [gameOver, matchLog.length, runs, wickets, ballsFaced, saveLastSimulation, createExportPayload]);

    const exportAsJson = () => {
        const payload = createExportPayload();
        triggerDownload(JSON.stringify(payload, null, 2), 'match-simulation.json', 'application/json;charset=utf-8;');
    };

    const buildShareSummary = (payload) => {
        const topBatters = [...payload.battingCard]
            .sort((a, b) => b.runs - a.runs)
            .slice(0, 3)
            .map((b, idx) => `${idx + 1}. ${b.name} ${b.runs}(${b.balls})`)
            .join(' | ');

        const bestOver = payload.overSummary.length
            ? payload.overSummary.reduce((best, over) => (over.runs > best.runs ? over : best), payload.overSummary[0])
            : null;

        const fowLine = payload.fallOfWickets.length
            ? payload.fallOfWickets.map((f) => `${f.score}-${f.wicket} (${f.over})`).join(', ')
            : 'No wickets';

        return [
            `CrickJudge T20 Simulation`,
            `Score: ${payload.scoreboard.runs}/${payload.scoreboard.wickets} in ${payload.scoreboard.overs} overs`,
            `RR: ${payload.scoreboard.currentRunRate} | Projected: ${payload.scoreboard.projectedScore}`,
            `Powerplay: ${payload.scoreboard.powerplay.runs}/${payload.scoreboard.powerplay.wickets}`,
            `Current Partnership: ${payload.scoreboard.partnership.current.runs} (${payload.scoreboard.partnership.current.balls})`,
            `Best Partnership: ${payload.scoreboard.partnership.best.runs} (${payload.scoreboard.partnership.best.balls}) ${payload.scoreboard.partnership.best.batters}`,
            `Top Batters: ${topBatters || 'N/A'}`,
            `Best Over: ${bestOver ? `Over ${bestOver.over} - ${bestOver.runs}/${bestOver.wickets}` : 'N/A'}`,
            `FOW: ${fowLine}`
        ].join('\n');
    };

    const copySummaryToClipboard = async () => {
        try {
            const summary = buildShareSummary(createExportPayload());
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(summary);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = summary;
                textarea.setAttribute('readonly', '');
                textarea.style.position = 'absolute';
                textarea.style.left = '-9999px';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }

            setCopyStatus('Summary copied');
            setTimeout(() => setCopyStatus(''), 1800);
        } catch {
            setCopyStatus('Copy failed');
            setTimeout(() => setCopyStatus(''), 1800);
        }
    };

    const restoreLastSimulation = async () => {
        try {
            const saved = await fetchLastSimulation().unwrap();
            if (!saved) {
                setRestoreStatus('No saved simulation found');
                setTimeout(() => setRestoreStatus(''), 1800);
                return;
            }

            const applied = applySimulationPayload(saved);
            setRestoreStatus(applied ? 'Last simulation restored' : 'Saved data is invalid');
            setTimeout(() => setRestoreStatus(''), 1800);
        } catch {
            setRestoreStatus('Restore failed');
            setTimeout(() => setRestoreStatus(''), 1800);
        }
    };

    const clearSavedSimulation = async () => {
        try {
            await clearLastSimulation().unwrap();
            setRestoreStatus('Saved simulation cleared');
            setTimeout(() => setRestoreStatus(''), 1800);
        } catch {
            setRestoreStatus('Clear failed');
            setTimeout(() => setRestoreStatus(''), 1800);
        }
    };

    const exportAsCsv = () => {
        const payload = createExportPayload();
        const rows = [
            ['Section', 'Metric', 'Value'],
            ['Scoreboard', 'Score', `${payload.scoreboard.runs}/${payload.scoreboard.wickets}`],
            ['Scoreboard', 'Overs', payload.scoreboard.overs],
            ['Scoreboard', 'Current RR', payload.scoreboard.currentRunRate],
            ['Scoreboard', 'Projected Score', payload.scoreboard.projectedScore],
            ['Scoreboard', 'Powerplay', `${payload.scoreboard.powerplay.runs}/${payload.scoreboard.powerplay.wickets}`],
            ['Partnership', 'Current', `${payload.scoreboard.partnership.current.runs} (${payload.scoreboard.partnership.current.balls})`],
            ['Partnership', 'Best', `${payload.scoreboard.partnership.best.runs} (${payload.scoreboard.partnership.best.balls}) - ${payload.scoreboard.partnership.best.batters}`]
        ];

        rows.push(['', '', '']);
        rows.push(['Batting Card', 'Name', 'R/B | 4s | 6s | SR | Status']);
        payload.battingCard.forEach((row) => {
            rows.push([
                'Batting Card',
                `${row.order}. ${row.name}`,
                `${row.runs}/${row.balls} | ${row.fours} | ${row.sixes} | ${row.strikeRate.toFixed(1)} | ${row.status}`
            ]);
        });

        rows.push(['', '', '']);
        rows.push(['Over Summary', 'Over', 'Runs/Wkts | Bowler']);
        payload.overSummary.forEach((row) => {
            rows.push(['Over Summary', `Over ${row.over}`, `${row.runs}/${row.wickets} | ${row.bowlerName}`]);
        });

        rows.push(['', '', '']);
        rows.push(['Fall Of Wickets', 'Wicket', 'Detail']);
        payload.fallOfWickets.forEach((row) => {
            rows.push(['Fall Of Wickets', `${row.wicket}`, `${row.score}-${row.wicket} (${row.over}) ${row.batter} b ${row.bowler}`]);
        });

        rows.push(['', '', '']);
        rows.push(['Ball Log', 'Ball', 'Event']);
        payload.deliveries.forEach((row) => {
            rows.push([
                'Ball Log',
                row.label,
                `${row.scoreAfter} | ${row.isWicket ? 'W' : row.runs} | ${row.text} | ${row.bowlerName}`
            ]);
        });

        const csv = rows.map((row) => row.map(toCsvValue).join(',')).join('\n');
        triggerDownload(csv, 'match-simulation.csv', 'text/csv;charset=utf-8;');
    };

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
                        <label className="block text-blue-400 font-bold mb-2">Select Opening Batter</label>
                        <select
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white"
                            value={anchorBatter ? getPlayerId(anchorBatter) : ''}
                            onChange={(e) => setAnchorBatter(batsmanOptions.find((p) => getPlayerId(p) === e.target.value) || null)}
                        >
                            <option value="">Choose Player...</option>
                            {batsmanOptions.map((p) => (
                                <option key={getPlayerId(p)} value={getPlayerId(p)}>{p.name}</option>
                            ))}
                        </select>
                        {anchorBatter && (
                            <p className="text-xs text-slate-400 mt-3">Lineup auto-fills with top strike-rate batters after {anchorBatter.name}.</p>
                        )}
                    </div>

                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                        <label className="block text-red-400 font-bold mb-2">Select Lead Bowler</label>
                        <select
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white"
                            value={leadBowler ? getPlayerId(leadBowler) : ''}
                            onChange={(e) => setLeadBowler(bowlerOptions.find((p) => getPlayerId(p) === e.target.value) || null)}
                        >
                            <option value="">Choose Player...</option>
                            {bowlerOptions.map((p) => (
                                <option key={getPlayerId(p)} value={getPlayerId(p)}>{p.name}</option>
                            ))}
                        </select>
                        {leadBowler && (
                            <p className="text-xs text-slate-400 mt-3">Bowler rotation auto-builds a 5-bowler attack using economy ranks.</p>
                        )}
                    </div>
                </div>

                <div className="text-center mb-8">
                    <button
                        onClick={playInnings}
                        disabled={!anchorBatter || !leadBowler || isPlaying || loadingPlayers}
                        className={`px-8 py-4 rounded-full font-bold text-lg shadow-lg transition-all transform hover:scale-105 ${
                            !anchorBatter || !leadBowler || loadingPlayers
                                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                : isPlaying
                                    ? 'bg-yellow-600 text-white cursor-wait'
                                    : 'bg-gradient-to-r from-orange-500 to-red-600 text-white hover:shadow-orange-500/50'
                        }`}
                    >
                        {isPlaying ? 'Simulating 20 Overs...' : gameOver ? 'Simulate Again' : 'Start Full T20 Innings'}
                    </button>

                    <div className="mt-4 flex items-center justify-center gap-3">
                        <button
                            onClick={exportAsJson}
                            disabled={matchLog.length === 0}
                            className="px-4 py-2 rounded-lg text-sm font-semibold border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/10 disabled:text-slate-500 disabled:border-slate-700 disabled:hover:bg-transparent"
                        >
                            Export JSON
                        </button>
                        <button
                            onClick={exportAsCsv}
                            disabled={matchLog.length === 0}
                            className="px-4 py-2 rounded-lg text-sm font-semibold border border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/10 disabled:text-slate-500 disabled:border-slate-700 disabled:hover:bg-transparent"
                        >
                            Export CSV
                        </button>
                        <button
                            onClick={copySummaryToClipboard}
                            disabled={matchLog.length === 0}
                            className="px-4 py-2 rounded-lg text-sm font-semibold border border-violet-400/40 text-violet-300 hover:bg-violet-500/10 disabled:text-slate-500 disabled:border-slate-700 disabled:hover:bg-transparent"
                        >
                            Copy Summary
                        </button>
                        <button
                            onClick={restoreLastSimulation}
                            disabled={isRestoringSimulation}
                            className="px-4 py-2 rounded-lg text-sm font-semibold border border-amber-400/40 text-amber-300 hover:bg-amber-500/10 disabled:text-slate-500 disabled:border-slate-700 disabled:hover:bg-transparent"
                        >
                            {isRestoringSimulation ? 'Restoring...' : 'Restore Last'}
                        </button>
                        <button
                            onClick={clearSavedSimulation}
                            disabled={isClearingSimulation}
                            className="px-4 py-2 rounded-lg text-sm font-semibold border border-rose-400/40 text-rose-300 hover:bg-rose-500/10 disabled:text-slate-500 disabled:border-slate-700 disabled:hover:bg-transparent"
                        >
                            {isClearingSimulation ? 'Clearing...' : 'Clear Saved'}
                        </button>
                    </div>
                    {copyStatus && (
                        <p className={`mt-2 text-xs ${copyStatus === 'Summary copied' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {copyStatus}
                        </p>
                    )}
                    {restoreStatus && (
                        <p className={`mt-1 text-xs ${restoreStatus.toLowerCase().includes('failed') || restoreStatus.toLowerCase().includes('invalid') ? 'text-rose-400' : 'text-amber-300'}`}>
                            {restoreStatus}
                        </p>
                    )}
                    {isSavingSimulation && (
                        <p className="mt-1 text-xs text-slate-400">Auto-saving latest simulation...</p>
                    )}
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

                                <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="bg-slate-900/70 border border-white/10 rounded-xl p-3">
                                        <p className="text-xs text-slate-500 uppercase">Striker</p>
                                        <p className="text-sm font-semibold text-white">{currentPair?.striker?.name || 'N/A'}</p>
                                    </div>
                                    <div className="bg-slate-900/70 border border-white/10 rounded-xl p-3">
                                        <p className="text-xs text-slate-500 uppercase">Non-Striker</p>
                                        <p className="text-sm font-semibold text-white">{currentPair?.nonStriker?.name || 'N/A'}</p>
                                    </div>
                                    <div className="bg-slate-900/70 border border-white/10 rounded-xl p-3">
                                        <p className="text-xs text-slate-500 uppercase">Bowling This Over</p>
                                        <p className="text-sm font-semibold text-white">{currentOverBowler?.name || 'N/A'}</p>
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="bg-slate-900/70 border border-white/10 rounded-xl p-3">
                                        <p className="text-xs text-slate-500 uppercase">Next Batter In Queue</p>
                                        <p className="text-sm font-semibold text-white">{nextBatter?.name || 'Tail End / None'}</p>
                                    </div>
                                    <div className="bg-slate-900/70 border border-white/10 rounded-xl p-3">
                                        <p className="text-xs text-slate-500 uppercase">Bowling Spells</p>
                                        <p className="text-xs text-slate-300 mt-1">
                                            {bowlingSpells.length
                                                ? bowlingSpells.map((s) => `${s.name} (${s.overs})`).join(' | ')
                                                : 'No completed overs yet'}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="bg-slate-900/70 border border-white/10 rounded-xl p-3">
                                        <p className="text-xs text-slate-500 uppercase">Current Partnership</p>
                                        <p className="text-lg font-semibold text-white">{currentPartnership.runs} ({currentPartnership.balls})</p>
                                        <p className="text-xs text-slate-400 truncate" title={currentPartnership.batters}>{currentPartnership.batters}</p>
                                    </div>
                                    <div className="bg-slate-900/70 border border-white/10 rounded-xl p-3">
                                        <p className="text-xs text-slate-500 uppercase">Best Partnership</p>
                                        <p className="text-lg font-semibold text-white">{bestPartnership.runs} ({bestPartnership.balls})</p>
                                        <p className="text-xs text-slate-400 truncate" title={bestPartnership.batters}>{bestPartnership.batters}</p>
                                        <p className="text-[11px] text-slate-500 mt-1">At: {bestPartnership.wicketAt}</p>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <p className="text-sm uppercase tracking-wider text-slate-400 mb-3">Recent Deliveries</p>
                                    <div className="flex flex-wrap gap-2">
                                        {recentBalls.map((event, index) => (
                                            <div key={`${event.label}-${index}`} className={`w-11 h-11 rounded-full flex items-center justify-center font-bold border-2 ${outcomeClass(event)}`} title={`${event.label} - ${event.text} (${event.bowlerName})`}>
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
                                    <p className="text-xs text-slate-500">Runs / Wickets / Bowler</p>
                                </div>

                                <div className="h-44 mb-5 border border-white/10 rounded-xl bg-slate-900/50 p-2">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={overRunTrend} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
                                            {overRunTrend.length > 0 && (
                                                <>
                                                    <ReferenceArea x1="O1" x2="O6" fill="#22c55e" fillOpacity={0.08} />
                                                    <ReferenceArea x1="O7" x2="O15" fill="#3b82f6" fillOpacity={0.07} />
                                                    <ReferenceArea x1="O16" x2="O20" fill="#f97316" fillOpacity={0.08} />
                                                </>
                                            )}
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.4} />
                                            <XAxis dataKey="over" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
                                            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: '#334155' }} tickLine={{ stroke: '#334155' }} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '0.5rem' }}
                                                labelStyle={{ color: '#e2e8f0', fontWeight: 600 }}
                                                itemStyle={{ color: '#cbd5e1' }}
                                                labelFormatter={(value) => `Over ${String(value).replace('O', '')}`}
                                                formatter={(value, name, dataPoint) => {
                                                    if (name === 'runs') {
                                                        const wicketText = dataPoint?.payload?.wickets ? ` | Wkts ${dataPoint.payload.wickets}` : '';
                                                        return [`${value}${wicketText}`, 'Runs'];
                                                    }
                                                    if (name === 'cumulative') {
                                                        return [value, 'Cumulative'];
                                                    }
                                                    return [value, name];
                                                }}
                                            />
                                            <Bar dataKey="runs" fill="#f97316" radius={[4, 4, 0, 0]} />
                                            <Line type="monotone" dataKey="cumulative" stroke="#38bdf8" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-5 text-[11px]">
                                    <span className="px-2 py-1 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-400/20">Powerplay (1-6)</span>
                                    <span className="px-2 py-1 rounded-md bg-blue-500/15 text-blue-300 border border-blue-400/20">Middle (7-15)</span>
                                    <span className="px-2 py-1 rounded-md bg-orange-500/15 text-orange-300 border border-orange-400/20">Death (16-20)</span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                                    {overSummary.map((entry) => (
                                        <div key={entry.over} className="rounded-xl border border-white/10 bg-slate-900/70 p-3">
                                            <p className="text-xs text-slate-500">Over {entry.over}</p>
                                            <p className="text-lg font-bold text-white">{entry.runs}/{entry.wickets}</p>
                                            <p className="text-xs text-slate-400 truncate" title={entry.bowlerName}>{entry.bowlerName}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-sm uppercase tracking-wider text-slate-300">Fall Of Wickets</p>
                                    <p className="text-xs text-slate-500">Wicket timeline</p>
                                </div>
                                {fallOfWickets.length === 0 ? (
                                    <p className="text-sm text-slate-500">No wickets have fallen yet.</p>
                                ) : (
                                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                        {fallOfWickets.map((entry) => (
                                            <div key={`${entry.wicket}-${entry.over}-${entry.batter}`} className="rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2">
                                                <p className="text-sm font-semibold text-white">{entry.score}-{entry.wicket} ({entry.over})</p>
                                                <p className="text-xs text-slate-400">{entry.batter} b {entry.bowler}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
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

                            <div className="bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-sm uppercase tracking-wider text-slate-300">Batting Card</p>
                                    <p className="text-xs text-slate-500">Live innings stats</p>
                                </div>
                                <div className="mb-4 border border-white/10 rounded-xl p-3 bg-slate-900/60">
                                    <p className="text-xs uppercase text-slate-500 mb-2">Bowling Attack Rotation Pool</p>
                                    <p className="text-xs text-slate-300">
                                        {bowlingAttack.length
                                            ? bowlingAttack.map((p) => `${p.name} (Eco ${Number(p?.stats?.economy || 0).toFixed(1)})`).join(' | ')
                                            : 'No bowling unit selected yet'}
                                    </p>
                                </div>
                                <div className="border border-white/10 rounded-xl overflow-hidden">
                                    <div className="grid grid-cols-12 bg-slate-800/80 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-300">
                                        <span className="col-span-5">Batter</span>
                                        <span className="col-span-1 text-center">R</span>
                                        <span className="col-span-1 text-center">B</span>
                                        <span className="col-span-1 text-center">4s</span>
                                        <span className="col-span-1 text-center">6s</span>
                                        <span className="col-span-2 text-center">SR</span>
                                        <span className="col-span-1 text-right">St</span>
                                    </div>

                                    <div className="max-h-72 overflow-y-auto bg-slate-900/60">
                                        {battingStats.map((row) => (
                                            <div key={row.id} className="border-t border-white/5 px-3 py-2">
                                                <div className="grid grid-cols-12 items-center text-sm">
                                                    <div className="col-span-5 pr-2">
                                                        <p className="text-slate-200 truncate">{row.order}. {row.name}</p>
                                                        {row.isOut && <p className="text-[11px] text-slate-500 truncate">{row.dismissal}</p>}
                                                    </div>
                                                    <span className="col-span-1 text-center text-slate-200 font-semibold">{row.runs}</span>
                                                    <span className="col-span-1 text-center text-slate-300">{row.balls}</span>
                                                    <span className="col-span-1 text-center text-slate-300">{row.fours}</span>
                                                    <span className="col-span-1 text-center text-slate-300">{row.sixes}</span>
                                                    <span className="col-span-2 text-center text-slate-300">{row.strikeRate.toFixed(1)}</span>
                                                    <span className={`col-span-1 text-right text-xs font-semibold ${row.status === 'Out' ? 'text-rose-400' : row.status === 'Batting' ? 'text-emerald-400' : 'text-slate-400'}`}>
                                                        {row.status === 'Batting' ? '*' : row.status === 'Out' ? 'O' : row.status === 'Not out' ? 'NO' : '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}

                                        {battingStats.length === 0 && (
                                            <div className="px-3 py-3 text-sm text-slate-500">
                                                Batting card will appear after simulation starts.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mt-4 border border-white/10 rounded-xl p-3 bg-slate-900/60">
                                    <p className="text-xs uppercase text-slate-500 mb-2">Auto Batting Order</p>
                                    <p className="text-xs text-slate-300">
                                        {battingLineup.length
                                            ? battingLineup.map((p, idx) => `${idx + 1}. ${p.name}`).join(' | ')
                                            : 'No batting lineup generated yet'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MatchSimulator;
