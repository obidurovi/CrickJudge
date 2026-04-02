import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip,
    Legend,
    BarChart,
    Bar,
    CartesianGrid,
    XAxis,
    YAxis
} from 'recharts';

const PLAYERS_API = 'http://localhost:5000/api/players';
const MAX_COMPARE_PLAYERS = 8;
const PRESETS_STORAGE_KEY = 'crickjudge.h2h.presets.v1';
const MAX_PRESETS = 30;

const COLOR_PALETTE = ['#3b82f6', '#a855f7', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#84cc16'];

const FORMAT_OPTIONS = [
    { key: 'overall', label: 'Overall' },
    { key: 'test', label: 'Test' },
    { key: 'odi', label: 'ODI' },
    { key: 't20', label: 'T20' }
];

const METRIC_OPTIONS = [
    { key: 'formScore', label: 'Form Score', better: 'higher' },
    { key: 'runs', label: 'Runs', better: 'higher' },
    { key: 'wickets', label: 'Wickets', better: 'higher' },
    { key: 'average', label: 'Bat Avg', better: 'higher' },
    { key: 'strikeRate', label: 'Bat SR', better: 'higher' },
    { key: 'economy', label: 'Economy', better: 'lower' },
    { key: 'matches', label: 'Matches', better: 'higher' }
];

const H2H_METRICS = ['runs', 'wickets', 'average', 'strikeRate', 'economy', 'formScore'];

const RADAR_METRICS = [
    { key: 'average', label: 'Bat Avg', reference: 65, inverse: false },
    { key: 'strikeRate', label: 'Bat SR', reference: 170, inverse: false },
    { key: 'runs', label: 'Runs', reference: 8500, inverse: false },
    { key: 'wickets', label: 'Wickets', reference: 400, inverse: false },
    { key: 'economy', label: 'Economy', reference: 12, inverse: true },
    { key: 'formScore', label: 'Form', reference: 100, inverse: false }
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const toNumber = (value, fallback = 0) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : fallback;
};

const normalizeText = (value) => String(value || '').toLowerCase().trim();

const getPlayerId = (player) => String(player?._id || player?.apiId || '');

const getFormatStats = (player, formatKey) => {
    const overall = player?.stats || {};

    if (formatKey === 'overall') {
        return {
            matches: toNumber(overall.matches),
            runs: toNumber(overall.runs),
            wickets: toNumber(overall.wickets),
            average: toNumber(overall.average),
            strikeRate: toNumber(overall.strikeRate),
            economy: toNumber(overall.economy),
            fifties: 0,
            hundreds: 0
        };
    }

    const detailedKey = formatKey === 't20' ? 't20i' : formatKey;
    const detailed = player?.detailedStats?.[detailedKey] || {};

    return {
        matches: toNumber(detailed.matches),
        runs: toNumber(detailed.runs),
        wickets: toNumber(detailed.wickets),
        average: toNumber(detailed.average),
        strikeRate: toNumber(detailed.strikeRate),
        economy: toNumber(detailed.economy),
        fifties: toNumber(detailed.fifties),
        hundreds: toNumber(detailed.hundreds)
    };
};

const buildComparisonRow = (player, formatKey) => {
    const stats = getFormatStats(player, formatKey);
    const battingQuality = clamp((stats.average / 60) * 0.52 + (stats.strikeRate / 175) * 0.48, 0, 1);
    const bowlingQuality = clamp((stats.wickets / 350) * 0.55 + ((10 - (stats.economy > 0 ? stats.economy : 8)) / 6) * 0.45, 0, 1);
    const outputVolume = clamp((stats.runs / 8000) * 0.45 + (stats.wickets / 280) * 0.3 + (stats.matches / 200) * 0.25, 0, 1);
    const formScore = Number((clamp((battingQuality * 0.45) + (bowlingQuality * 0.35) + (outputVolume * 0.2), 0, 1) * 100).toFixed(1));

    return {
        id: getPlayerId(player),
        name: player?.name || 'Unknown',
        shortName: (player?.name || 'Unknown').split(' ').slice(0, 2).join(' '),
        country: player?.country || 'Unknown',
        role: player?.role || 'Unknown',
        image: player?.image || '',
        matches: stats.matches,
        runs: stats.runs,
        wickets: stats.wickets,
        average: stats.average,
        strikeRate: stats.strikeRate,
        economy: stats.economy,
        fifties: stats.fifties,
        hundreds: stats.hundreds,
        formScore
    };
};

const toCsvValue = (value) => {
    const raw = value === null || value === undefined ? '' : String(value);
    if (raw.includes(',') || raw.includes('"') || raw.includes('\n')) {
        return `"${raw.replace(/"/g, '""')}"`;
    }
    return raw;
};

const downloadFile = (content, fileName, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
};

const loadPresetsFromStorage = () => {
    try {
        const raw = localStorage.getItem(PRESETS_STORAGE_KEY);
        if (!raw) return [];

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];

        const validFormats = new Set(FORMAT_OPTIONS.map((option) => option.key));
        const validMetrics = new Set(METRIC_OPTIONS.map((option) => option.key));

        return parsed
            .filter((entry) => entry && typeof entry === 'object')
            .map((entry) => ({
                id: String(entry.id || `preset-${Date.now()}`),
                name: String(entry.name || 'Untitled Preset').slice(0, 80),
                playerIds: Array.isArray(entry.playerIds)
                    ? entry.playerIds.map((id) => String(id || '').trim()).filter(Boolean).slice(0, MAX_COMPARE_PLAYERS)
                    : [],
                formatFilter: validFormats.has(entry.formatFilter) ? entry.formatFilter : 'overall',
                filters: {
                    roleFilter: String(entry?.filters?.roleFilter || 'all'),
                    countryFilter: String(entry?.filters?.countryFilter || 'all'),
                    minMatches: Math.max(0, Number(entry?.filters?.minMatches) || 0),
                    sortMetric: validMetrics.has(entry?.filters?.sortMetric) ? entry.filters.sortMetric : 'formScore',
                    sortDirection: entry?.filters?.sortDirection === 'asc' ? 'asc' : 'desc'
                },
                createdAt: entry.createdAt || new Date().toISOString(),
                updatedAt: entry.updatedAt || new Date().toISOString()
            }))
            .filter((entry) => entry.playerIds.length > 0)
            .slice(0, MAX_PRESETS);
    } catch {
        return [];
    }
};

const savePresetsToStorage = (presets) => {
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify((presets || []).slice(0, MAX_PRESETS)));
};

const CrickJudge = () => {
    const [playerPool, setPlayerPool] = useState([]);
    const [selectedPlayers, setSelectedPlayers] = useState([]);
    const [hydratedPlayers, setHydratedPlayers] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);

    const [formatFilter, setFormatFilter] = useState('overall');
    const [roleFilter, setRoleFilter] = useState('all');
    const [countryFilter, setCountryFilter] = useState('all');
    const [minMatches, setMinMatches] = useState(1);

    const [sortMetric, setSortMetric] = useState('formScore');
    const [sortDirection, setSortDirection] = useState('desc');

    const [selectionStatus, setSelectionStatus] = useState('');
    const [copyStatus, setCopyStatus] = useState('');
    const [dataNotice, setDataNotice] = useState('');
    const [presets, setPresets] = useState(() => loadPresetsFromStorage());
    const [presetName, setPresetName] = useState('');
    const [presetStatus, setPresetStatus] = useState('');

    const fetchInitialPlayers = useCallback(async () => {
        try {
            const { data } = await axios.get(`${PLAYERS_API}?offset=0`);
            const list = Array.isArray(data?.players) ? data.players : [];
            setPlayerPool(list);
            if (data?._notice) setDataNotice(data._notice);
        } catch {
            setPlayerPool([]);
            setDataNotice('Unable to load initial player list. Use search to fetch players.');
        }
    }, []);

    useEffect(() => {
        fetchInitialPlayers();
    }, [fetchInitialPlayers]);

    useEffect(() => {
        savePresetsToStorage(presets);
    }, [presets]);

    useEffect(() => {
        const onStorage = (event) => {
            if (event.key === PRESETS_STORAGE_KEY) {
                setPresets(loadPresetsFromStorage());
            }
        };

        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    useEffect(() => {
        const query = searchTerm.trim();
        if (query.length < 2) {
            setSearchResults([]);
            setSearching(false);
            return;
        }

        let active = true;
        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const { data } = await axios.get(`${PLAYERS_API}/search?q=${encodeURIComponent(query)}`);
                if (!active) return;
                const list = Array.isArray(data?.players) ? data.players : [];
                setSearchResults(list);
                if (data?._notice) setDataNotice(data._notice);
            } catch {
                if (active) {
                    setSearchResults([]);
                }
            } finally {
                if (active) setSearching(false);
            }
        }, 350);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [searchTerm]);

    const selectedIds = useMemo(() => selectedPlayers.map((player) => getPlayerId(player)).filter(Boolean), [selectedPlayers]);

    useEffect(() => {
        if (!selectedIds.length) {
            setHydratedPlayers([]);
            return;
        }

        let active = true;
        (async () => {
            try {
                const { data } = await axios.get(`${PLAYERS_API}/watchlist?ids=${encodeURIComponent(selectedIds.join(','))}`);
                if (!active) return;
                setHydratedPlayers(Array.isArray(data?.players) ? data.players : []);
            } catch {
                if (active) setHydratedPlayers([]);
            }
        })();

        return () => {
            active = false;
        };
    }, [selectedIds]);

    const hydratedMap = useMemo(() => {
        const map = new Map();
        hydratedPlayers.forEach((player) => {
            const primary = getPlayerId(player);
            if (primary) map.set(primary, player);
            if (player?.apiId) map.set(String(player.apiId), player);
            if (player?._id) map.set(String(player._id), player);
        });
        return map;
    }, [hydratedPlayers]);

    const comparisonPlayers = useMemo(() => {
        return selectedPlayers.map((player) => {
            const direct = hydratedMap.get(getPlayerId(player));
            const byApiId = player?.apiId ? hydratedMap.get(String(player.apiId)) : null;
            return direct || byApiId || player;
        });
    }, [selectedPlayers, hydratedMap]);

    const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);

    const localOptions = useMemo(() => {
        const query = normalizeText(searchTerm);
        return playerPool.filter((player) => {
            if (!query) return true;
            return normalizeText(player?.name).includes(query)
                || normalizeText(player?.role).includes(query)
                || normalizeText(player?.country).includes(query);
        });
    }, [playerPool, searchTerm]);

    const selectionOptions = useMemo(() => {
        const source = searchTerm.trim().length >= 2 ? searchResults : localOptions;
        const seen = new Set();
        return source.filter((player) => {
            const id = getPlayerId(player);
            if (!id || seen.has(id)) return false;
            seen.add(id);
            return true;
        }).slice(0, 50);
    }, [searchTerm, searchResults, localOptions]);

    const addPlayer = useCallback((player) => {
        const id = getPlayerId(player);
        if (!id) return;

        setSelectedPlayers((prev) => {
            if (prev.some((entry) => getPlayerId(entry) === id)) return prev;
            if (prev.length >= MAX_COMPARE_PLAYERS) {
                setSelectionStatus(`You can compare up to ${MAX_COMPARE_PLAYERS} players at once.`);
                return prev;
            }
            setSelectionStatus('');
            return [...prev, player];
        });
    }, []);

    const removePlayer = useCallback((id) => {
        setSelectedPlayers((prev) => prev.filter((player) => getPlayerId(player) !== id));
    }, []);

    const clearSelection = () => {
        setSelectedPlayers([]);
        setSelectionStatus('');
    };

    const autoFillSelection = () => {
        const candidates = [...playerPool]
            .filter((player) => toNumber(player?.stats?.matches) > 0)
            .sort((a, b) => toNumber(b?.stats?.runs) - toNumber(a?.stats?.runs))
            .slice(0, 4);
        setSelectedPlayers(candidates);
        setSelectionStatus(candidates.length ? '' : 'No eligible players available to auto-fill.');
    };

    const saveCurrentPreset = () => {
        if (selectedIds.length < 2) {
            setPresetStatus('Select at least 2 players before saving a preset.');
            return;
        }

        const name = presetName.trim() || `Preset ${presets.length + 1}`;
        const normalizedName = normalizeText(name);
        const existing = presets.find((entry) => normalizeText(entry.name) === normalizedName);
        const now = new Date().toISOString();

        const nextPreset = {
            id: existing?.id || `preset-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            name,
            playerIds: selectedIds.slice(0, MAX_COMPARE_PLAYERS),
            formatFilter,
            filters: {
                roleFilter,
                countryFilter,
                minMatches,
                sortMetric,
                sortDirection
            },
            createdAt: existing?.createdAt || now,
            updatedAt: now
        };

        setPresets((prev) => {
            const replaced = existing
                ? prev.map((entry) => (entry.id === existing.id ? nextPreset : entry))
                : [nextPreset, ...prev];
            return replaced.slice(0, MAX_PRESETS);
        });

        setPresetName('');
        setPresetStatus(existing ? `Preset "${name}" updated.` : `Preset "${name}" saved.`);
    };

    const loadPreset = useCallback(async (preset) => {
        if (!preset?.playerIds?.length) {
            setPresetStatus('Preset is empty.');
            return;
        }

        const playerMap = new Map();
        [...playerPool, ...searchResults, ...selectedPlayers, ...hydratedPlayers].forEach((player) => {
            const primary = getPlayerId(player);
            if (primary) playerMap.set(primary, player);
            if (player?.apiId) playerMap.set(String(player.apiId), player);
            if (player?._id) playerMap.set(String(player._id), player);
        });

        const missingIds = preset.playerIds.filter((id) => !playerMap.has(id));
        if (missingIds.length) {
            try {
                const { data } = await axios.get(`${PLAYERS_API}/watchlist?ids=${encodeURIComponent(missingIds.join(','))}`);
                const remotePlayers = Array.isArray(data?.players) ? data.players : [];
                remotePlayers.forEach((player) => {
                    const primary = getPlayerId(player);
                    if (primary) playerMap.set(primary, player);
                    if (player?.apiId) playerMap.set(String(player.apiId), player);
                    if (player?._id) playerMap.set(String(player._id), player);
                });
            } catch {
                // If hydration fails, we still load what is available locally.
            }
        }

        const orderedPlayers = preset.playerIds
            .map((id) => playerMap.get(id))
            .filter(Boolean)
            .slice(0, MAX_COMPARE_PLAYERS);

        setSelectedPlayers(orderedPlayers);

        if (FORMAT_OPTIONS.some((option) => option.key === preset.formatFilter)) {
            setFormatFilter(preset.formatFilter);
        }

        const filters = preset.filters || {};
        setRoleFilter(String(filters.roleFilter || 'all'));
        setCountryFilter(String(filters.countryFilter || 'all'));
        setMinMatches(Math.max(0, Number(filters.minMatches) || 0));

        const validMetric = METRIC_OPTIONS.some((option) => option.key === filters.sortMetric)
            ? filters.sortMetric
            : 'formScore';
        setSortMetric(validMetric);
        setSortDirection(filters.sortDirection === 'asc' ? 'asc' : 'desc');

        const missingCount = preset.playerIds.length - orderedPlayers.length;
        setPresetStatus(
            missingCount > 0
                ? `Preset loaded with ${missingCount} missing player(s) unavailable in cache.`
                : `Preset "${preset.name}" loaded.`
        );
    }, [playerPool, searchResults, selectedPlayers, hydratedPlayers]);

    const deletePreset = (presetId) => {
        setPresets((prev) => prev.filter((preset) => preset.id !== presetId));
        setPresetStatus('Preset deleted.');
    };

    const clearPresets = () => {
        setPresets([]);
        setPresetStatus('All presets cleared.');
    };

    useEffect(() => {
        const metric = METRIC_OPTIONS.find((entry) => entry.key === sortMetric);
        if (!metric) return;
        setSortDirection(metric.better === 'lower' ? 'asc' : 'desc');
    }, [sortMetric]);

    useEffect(() => {
        if (!presetStatus) return undefined;
        const timer = setTimeout(() => setPresetStatus(''), 2200);
        return () => clearTimeout(timer);
    }, [presetStatus]);

    const comparisonRows = useMemo(() => {
        return comparisonPlayers.map((player) => buildComparisonRow(player, formatFilter));
    }, [comparisonPlayers, formatFilter]);

    const roleOptions = useMemo(() => {
        const roleSet = new Set(comparisonRows.map((row) => row.role).filter(Boolean));
        return ['all', ...Array.from(roleSet).sort((a, b) => a.localeCompare(b))];
    }, [comparisonRows]);

    const countryOptions = useMemo(() => {
        const countrySet = new Set(comparisonRows.map((row) => row.country).filter(Boolean));
        return ['all', ...Array.from(countrySet).sort((a, b) => a.localeCompare(b))];
    }, [comparisonRows]);

    const filteredRows = useMemo(() => {
        return comparisonRows.filter((row) => {
            if (row.matches < minMatches) return false;
            if (roleFilter !== 'all' && row.role !== roleFilter) return false;
            if (countryFilter !== 'all' && row.country !== countryFilter) return false;
            return true;
        });
    }, [comparisonRows, minMatches, roleFilter, countryFilter]);

    const sortMeta = useMemo(
        () => METRIC_OPTIONS.find((entry) => entry.key === sortMetric) || METRIC_OPTIONS[0],
        [sortMetric]
    );

    const sortedRows = useMemo(() => {
        const rows = [...filteredRows];
        rows.sort((a, b) => {
            const aValue = toNumber(a[sortMetric]);
            const bValue = toNumber(b[sortMetric]);

            if (aValue === bValue) {
                return a.name.localeCompare(b.name);
            }

            return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        });
        return rows;
    }, [filteredRows, sortMetric, sortDirection]);

    const chartRows = useMemo(() => sortedRows.slice(0, 6), [sortedRows]);

    const chartSeries = useMemo(() => {
        return chartRows.map((row, index) => ({
            ...row,
            chartKey: `player_${index + 1}`,
            color: COLOR_PALETTE[index % COLOR_PALETTE.length]
        }));
    }, [chartRows]);

    const radarData = useMemo(() => {
        if (!chartSeries.length) return [];

        return RADAR_METRICS.map((metric) => {
            const values = chartSeries.map((row) => {
                let value = toNumber(row[metric.key]);
                if (metric.key === 'economy' && value <= 0) {
                    value = metric.reference;
                }
                return value;
            });
            const peak = Math.max(metric.reference, ...values, 1);

            const point = { metric: metric.label };
            chartSeries.forEach((row) => {
                let raw = toNumber(row[metric.key]);
                if (metric.key === 'economy' && raw <= 0) raw = metric.reference;

                const normalized = metric.inverse
                    ? clamp((1 - (raw / peak)) * 100, 0, 100)
                    : clamp((raw / peak) * 100, 0, 100);

                point[row.chartKey] = Number(normalized.toFixed(1));
            });

            return point;
        });
    }, [chartSeries]);

    const barData = useMemo(() => {
        return sortedRows.slice(0, 8).map((row) => {
            const rawValue = toNumber(row[sortMetric]);
            const normalized = sortMeta.better === 'lower'
                ? Number(clamp((12 - rawValue), 0, 12).toFixed(2))
                : Number(rawValue.toFixed(2));

            return {
                name: row.shortName,
                value: normalized,
                actual: rawValue,
                color: COLOR_PALETTE[sortedRows.findIndex((entry) => entry.id === row.id) % COLOR_PALETTE.length]
            };
        });
    }, [sortedRows, sortMetric, sortMeta.better]);

    const metricLeaders = useMemo(() => {
        if (!sortedRows.length) return [];

        const cards = [
            { title: 'Top Run Scorer', key: 'runs', better: 'higher', formatter: (value) => value.toLocaleString() },
            { title: 'Top Wicket-Taker', key: 'wickets', better: 'higher', formatter: (value) => value.toLocaleString() },
            { title: 'Best Economy', key: 'economy', better: 'lower', formatter: (value) => value.toFixed(2) },
            { title: 'Best Strike Rate', key: 'strikeRate', better: 'higher', formatter: (value) => value.toFixed(1) }
        ];

        return cards.map((card) => {
            const ranked = [...sortedRows].sort((a, b) => {
                const aValue = toNumber(a[card.key]);
                const bValue = toNumber(b[card.key]);
                if (aValue === bValue) return a.name.localeCompare(b.name);
                return card.better === 'lower' ? aValue - bValue : bValue - aValue;
            });
            const leader = ranked[0];
            return {
                ...card,
                name: leader.name,
                value: card.formatter(toNumber(leader[card.key]))
            };
        });
    }, [sortedRows]);

    const matrixPlayers = useMemo(() => sortedRows.slice(0, 6), [sortedRows]);

    const headToHeadMatrix = useMemo(() => {
        if (matrixPlayers.length < 2) return [];

        return matrixPlayers.map((rowPlayer) => {
            const cells = matrixPlayers.map((colPlayer) => {
                if (rowPlayer.id === colPlayer.id) {
                    return { text: '-', tone: 'text-slate-500' };
                }

                let rowWins = 0;
                let colWins = 0;
                let ties = 0;

                H2H_METRICS.forEach((metricKey) => {
                    const rowValue = toNumber(rowPlayer[metricKey]);
                    const colValue = toNumber(colPlayer[metricKey]);

                    if (rowValue === colValue) {
                        ties += 1;
                        return;
                    }

                    const betterIsLower = metricKey === 'economy';
                    const rowBetter = betterIsLower ? rowValue < colValue : rowValue > colValue;
                    if (rowBetter) rowWins += 1;
                    else colWins += 1;
                });

                const tone = rowWins > colWins
                    ? 'text-emerald-300'
                    : rowWins < colWins
                        ? 'text-rose-300'
                        : 'text-amber-300';

                return {
                    text: `${rowWins}-${colWins}${ties ? ` (${ties}T)` : ''}`,
                    tone
                };
            });

            return {
                player: rowPlayer,
                cells
            };
        });
    }, [matrixPlayers]);

    const exportAsCsv = () => {
        const header = ['Rank', 'Player', 'Country', 'Role', 'Matches', 'Runs', 'Wickets', 'Bat Avg', 'Bat SR', 'Economy', '50s', '100s', 'Form Score'];
        const rows = sortedRows.map((row, index) => ([
            index + 1,
            row.name,
            row.country,
            row.role,
            row.matches,
            row.runs,
            row.wickets,
            row.average.toFixed(2),
            row.strikeRate.toFixed(2),
            row.economy.toFixed(2),
            row.fifties,
            row.hundreds,
            row.formScore.toFixed(1)
        ]));

        const csv = [header, ...rows].map((line) => line.map(toCsvValue).join(',')).join('\n');
        downloadFile(csv, `crickjudge-head-to-head-${formatFilter}.csv`, 'text/csv;charset=utf-8;');
    };

    const exportAsJson = () => {
        const payload = {
            generatedAt: new Date().toISOString(),
            format: formatFilter,
            filters: {
                role: roleFilter,
                country: countryFilter,
                minMatches,
                sortMetric,
                sortDirection
            },
            players: sortedRows
        };
        downloadFile(JSON.stringify(payload, null, 2), `crickjudge-head-to-head-${formatFilter}.json`, 'application/json;charset=utf-8;');
    };

    const copySummary = async () => {
        if (!sortedRows.length) return;

        const summary = [
            `CrickJudge Historical Head-to-Head (${formatFilter.toUpperCase()})`,
            `Compared Players: ${sortedRows.length}`,
            `Top Form: ${sortedRows[0].name} (${sortedRows[0].formScore.toFixed(1)})`,
            `Top Runs: ${metricLeaders.find((entry) => entry.key === 'runs')?.name || 'N/A'}`,
            `Top Wickets: ${metricLeaders.find((entry) => entry.key === 'wickets')?.name || 'N/A'}`,
            `Best Economy: ${metricLeaders.find((entry) => entry.key === 'economy')?.name || 'N/A'}`,
            `Best Strike Rate: ${metricLeaders.find((entry) => entry.key === 'strikeRate')?.name || 'N/A'}`
        ].join('\n');

        try {
            await navigator.clipboard.writeText(summary);
            setCopyStatus('Summary copied');
        } catch {
            setCopyStatus('Copy failed');
        }

        setTimeout(() => setCopyStatus(''), 1800);
    };

    const notEnoughPlayers = comparisonPlayers.length < 2;
    const notEnoughAfterFilters = !notEnoughPlayers && sortedRows.length < 2;

    return (
        <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 font-sans text-slate-200">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-20 left-10 w-72 h-72 bg-blue-500/12 rounded-full blur-3xl"></div>
                <div className="absolute top-32 right-10 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl"></div>
            </div>
            <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-white/10 shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex-shrink-0 flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-900/40">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white tracking-tight">CrickJudge Head-to-Head</h1>
                                <p className="text-xs text-cyan-300 font-medium tracking-wide">MULTI-PLAYER HISTORICAL COMPARISON LAB</p>
                            </div>
                        </div>
                        <Link to="/" className="text-sm text-slate-400 hover:text-white transition-colors">Back to Dashboard</Link>
                    </div>
                </div>
            </nav>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <div className="surface-glass rounded-2xl p-4">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Format</span>
                        {FORMAT_OPTIONS.map((option) => (
                            <button
                                key={option.key}
                                onClick={() => setFormatFilter(option.key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${formatFilter === option.key ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300' : 'bg-slate-800/70 border border-slate-700 text-slate-400 hover:text-white'}`}
                            >
                                {option.label}
                            </button>
                        ))}
                        <span className="ml-auto text-xs text-slate-500">Historical comparison built from selected format stats.</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    <div className="xl:col-span-4 space-y-6">
                        <div className="surface-glass rounded-2xl p-5">
                            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3">Add Players ({selectedPlayers.length}/{MAX_COMPARE_PLAYERS})</h2>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder="Search by name, role, country"
                                className="w-full px-3 py-2 rounded-lg bg-slate-900/70 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-400/60"
                            />
                            <div className="app-scroll mt-3 max-h-72 overflow-y-auto space-y-2">
                                {searching && <p className="text-xs text-slate-400">Searching players...</p>}
                                {!searching && selectionOptions.length === 0 && (
                                    <p className="text-xs text-slate-500">No players found for this query.</p>
                                )}
                                {!searching && selectionOptions.map((player) => {
                                    const id = getPlayerId(player);
                                    const alreadySelected = selectedIdSet.has(id);
                                    return (
                                        <div key={id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2">
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-white truncate">{player.name}</p>
                                                <p className="text-[11px] text-slate-500 truncate">{player.role || 'Unknown'} • {player.country || 'Unknown'}</p>
                                            </div>
                                            <button
                                                onClick={() => addPlayer(player)}
                                                disabled={alreadySelected || selectedPlayers.length >= MAX_COMPARE_PLAYERS}
                                                className="px-2.5 py-1.5 rounded-md text-xs font-bold border border-blue-400/40 text-blue-300 hover:bg-blue-500/10 disabled:text-slate-500 disabled:border-slate-700"
                                            >
                                                {alreadySelected ? 'Added' : 'Add'}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                            {selectionStatus && <p className="mt-2 text-xs text-amber-300">{selectionStatus}</p>}
                            {dataNotice && <p className="mt-1 text-xs text-slate-500">{dataNotice}</p>}
                        </div>

                        <div className="surface-glass rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Selected Players</h3>
                                <div className="flex items-center gap-2">
                                    <button onClick={autoFillSelection} className="text-xs px-2 py-1 rounded border border-slate-600 text-slate-300 hover:bg-slate-800">Auto Fill</button>
                                    <button onClick={clearSelection} className="text-xs px-2 py-1 rounded border border-slate-600 text-slate-300 hover:bg-slate-800">Clear</button>
                                </div>
                            </div>
                            {!selectedPlayers.length ? (
                                <p className="text-xs text-slate-500">Add at least two players to begin comparisons.</p>
                            ) : (
                                <div className="space-y-2">
                                    {selectedPlayers.map((player) => {
                                        const id = getPlayerId(player);
                                        return (
                                            <div key={id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-white truncate">{player.name}</p>
                                                    <p className="text-[11px] text-slate-500 truncate">{player.role || 'Unknown'} • {player.country || 'Unknown'}</p>
                                                </div>
                                                <button
                                                    onClick={() => removePlayer(id)}
                                                    className="px-2.5 py-1.5 rounded-md text-xs font-bold border border-rose-400/40 text-rose-300 hover:bg-rose-500/10"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="surface-glass rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Saved Presets</h3>
                                <button
                                    onClick={clearPresets}
                                    disabled={!presets.length}
                                    className="text-xs px-2 py-1 rounded border border-slate-600 text-slate-300 hover:bg-slate-800 disabled:text-slate-500 disabled:border-slate-700"
                                >
                                    Clear All
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={presetName}
                                    onChange={(event) => setPresetName(event.target.value)}
                                    placeholder="Preset name (optional)"
                                    maxLength={80}
                                    className="flex-1 px-3 py-2 rounded-lg bg-slate-900/70 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-400/60"
                                />
                                <button
                                    onClick={saveCurrentPreset}
                                    disabled={selectedPlayers.length < 2}
                                    className="px-3 py-2 rounded-lg text-xs font-bold border border-indigo-400/40 text-indigo-300 hover:bg-indigo-500/10 disabled:text-slate-500 disabled:border-slate-700"
                                >
                                    Save Current
                                </button>
                            </div>

                            {presetStatus && <p className="mt-2 text-xs text-slate-400">{presetStatus}</p>}

                            {!presets.length ? (
                                <p className="mt-3 text-xs text-slate-500">No saved presets yet. Save your current comparison to reuse it later.</p>
                            ) : (
                                <div className="app-scroll mt-3 max-h-56 overflow-y-auto space-y-2">
                                    {presets.map((preset) => (
                                        <div key={preset.id} className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-sm font-semibold text-white truncate">{preset.name}</p>
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={() => loadPreset(preset)}
                                                        className="px-2 py-1 rounded text-[11px] font-bold border border-blue-400/40 text-blue-300 hover:bg-blue-500/10"
                                                    >
                                                        Load
                                                    </button>
                                                    <button
                                                        onClick={() => deletePreset(preset.id)}
                                                        className="px-2 py-1 rounded text-[11px] font-bold border border-rose-400/40 text-rose-300 hover:bg-rose-500/10"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="mt-1 text-[11px] text-slate-500 truncate">
                                                {preset.formatFilter.toUpperCase()} • {preset.playerIds.length} players • Updated {new Date(preset.updatedAt).toLocaleString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="surface-glass rounded-2xl p-5 space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Comparison Controls</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <label className="text-xs text-slate-400">
                                    Min Matches
                                    <input
                                        type="number"
                                        min="0"
                                        value={minMatches}
                                        onChange={(event) => setMinMatches(Math.max(0, Number(event.target.value) || 0))}
                                        className="mt-1 w-full px-2 py-1.5 rounded bg-slate-900/70 border border-slate-700 text-slate-200"
                                    />
                                </label>
                                <label className="text-xs text-slate-400">
                                    Sort Metric
                                    <select
                                        value={sortMetric}
                                        onChange={(event) => setSortMetric(event.target.value)}
                                        className="mt-1 w-full px-2 py-1.5 rounded bg-slate-900/70 border border-slate-700 text-slate-200"
                                    >
                                        {METRIC_OPTIONS.map((metric) => (
                                            <option key={metric.key} value={metric.key}>{metric.label}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="text-xs text-slate-400">
                                    Role Filter
                                    <select
                                        value={roleFilter}
                                        onChange={(event) => setRoleFilter(event.target.value)}
                                        className="mt-1 w-full px-2 py-1.5 rounded bg-slate-900/70 border border-slate-700 text-slate-200"
                                    >
                                        {roleOptions.map((role) => (
                                            <option key={role} value={role}>{role === 'all' ? 'All Roles' : role}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="text-xs text-slate-400">
                                    Country Filter
                                    <select
                                        value={countryFilter}
                                        onChange={(event) => setCountryFilter(event.target.value)}
                                        className="mt-1 w-full px-2 py-1.5 rounded bg-slate-900/70 border border-slate-700 text-slate-200"
                                    >
                                        {countryOptions.map((country) => (
                                            <option key={country} value={country}>{country === 'all' ? 'All Countries' : country}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                                    className="px-3 py-1.5 rounded-md text-xs font-bold border border-slate-600 text-slate-300 hover:bg-slate-800"
                                >
                                    Direction: {sortDirection.toUpperCase()}
                                </button>
                                <button onClick={exportAsCsv} className="px-3 py-1.5 rounded-md text-xs font-bold border border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/10">Export CSV</button>
                                <button onClick={exportAsJson} className="px-3 py-1.5 rounded-md text-xs font-bold border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/10">Export JSON</button>
                                <button onClick={copySummary} className="px-3 py-1.5 rounded-md text-xs font-bold border border-violet-400/40 text-violet-300 hover:bg-violet-500/10">Copy Summary</button>
                            </div>
                            {copyStatus && <p className="text-xs text-slate-400">{copyStatus}</p>}
                        </div>
                    </div>

                    <div className="xl:col-span-8 space-y-6">
                        {notEnoughPlayers && (
                            <div className="surface-glass rounded-2xl p-8 text-center">
                                <p className="text-lg font-semibold text-white">Select at least 2 players to compare.</p>
                                <p className="text-sm text-slate-500 mt-1">You can compare up to 8 players with format-specific historical metrics.</p>
                            </div>
                        )}

                        {notEnoughAfterFilters && (
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                                <p className="text-sm text-amber-300">Current filters removed too many players. Lower min matches or broaden role/country filters.</p>
                            </div>
                        )}

                        {!notEnoughPlayers && !notEnoughAfterFilters && (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                                    {metricLeaders.map((leader) => (
                                        <div key={leader.key} className="surface-glass rounded-xl p-4">
                                            <p className="text-xs uppercase tracking-wider text-slate-500">{leader.title}</p>
                                            <p className="text-lg font-bold text-white mt-1 truncate">{leader.name}</p>
                                            <p className="text-sm text-slate-300 mt-1">{leader.value}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
                                    <div className="surface-glass rounded-2xl p-4">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3">Multi-Player Radar (Top 6 by current sorting)</h3>
                                        <div className="h-[360px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
                                                    <PolarGrid stroke="#334155" />
                                                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} />
                                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                                    {chartSeries.map((series) => (
                                                        <Radar
                                                            key={series.chartKey}
                                                            name={series.shortName}
                                                            dataKey={series.chartKey}
                                                            stroke={series.color}
                                                            fill={series.color}
                                                            fillOpacity={0.2}
                                                            strokeWidth={2}
                                                        />
                                                    ))}
                                                    <Legend wrapperStyle={{ paddingTop: 14 }} />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', color: '#fff' }}
                                                        itemStyle={{ color: '#e2e8f0' }}
                                                    />
                                                </RadarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="surface-glass rounded-2xl p-4">
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3">Leaderboard Bar ({sortMeta.label})</h3>
                                        <div className="h-[360px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} interval={0} angle={-18} textAnchor="end" height={50} />
                                                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                                    <Tooltip
                                                        formatter={(value, name, payload) => [`${payload?.payload?.actual ?? value}`, sortMeta.label]}
                                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', color: '#fff' }}
                                                    />
                                                    <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#38bdf8" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                <div className="surface-glass rounded-2xl p-4 app-scroll overflow-x-auto">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3">Head-to-Head Matrix (Wins-Losses across 6 key metrics)</h3>
                                    <table className="w-full text-sm min-w-[680px]">
                                        <thead>
                                            <tr className="border-b border-white/10 text-slate-400">
                                                <th className="text-left py-2 pr-2">Player</th>
                                                {matrixPlayers.map((player) => (
                                                    <th key={`head-${player.id}`} className="text-center py-2 px-2">{player.shortName}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {headToHeadMatrix.map((entry) => (
                                                <tr key={`row-${entry.player.id}`} className="border-b border-white/5">
                                                    <td className="py-2 pr-2 font-semibold text-white">{entry.player.shortName}</td>
                                                    {entry.cells.map((cell, idx) => (
                                                        <td key={`${entry.player.id}-${idx}`} className={`text-center py-2 px-2 font-mono ${cell.tone}`}>{cell.text}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="surface-glass rounded-2xl p-4 app-scroll overflow-x-auto">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-3">Historical Leaderboard ({formatFilter.toUpperCase()})</h3>
                                    <table className="w-full text-sm min-w-[980px]">
                                        <thead>
                                            <tr className="border-b border-white/10 text-slate-400">
                                                <th className="text-left py-2 pr-2">Rank</th>
                                                <th className="text-left py-2 px-2">Player</th>
                                                <th className="text-left py-2 px-2">Country</th>
                                                <th className="text-left py-2 px-2">Role</th>
                                                <th className="text-right py-2 px-2">M</th>
                                                <th className="text-right py-2 px-2">Runs</th>
                                                <th className="text-right py-2 px-2">Wkts</th>
                                                <th className="text-right py-2 px-2">Avg</th>
                                                <th className="text-right py-2 px-2">SR</th>
                                                <th className="text-right py-2 px-2">Econ</th>
                                                <th className="text-right py-2 px-2">50s</th>
                                                <th className="text-right py-2 px-2">100s</th>
                                                <th className="text-right py-2 pl-2">Form</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortedRows.map((row, index) => (
                                                <tr key={row.id} className="border-b border-white/5 hover:bg-white/5">
                                                    <td className="py-2 pr-2 text-slate-300 font-semibold">#{index + 1}</td>
                                                    <td className="py-2 px-2 text-white font-semibold">{row.name}</td>
                                                    <td className="py-2 px-2 text-slate-400">{row.country}</td>
                                                    <td className="py-2 px-2 text-slate-400">{row.role}</td>
                                                    <td className="py-2 px-2 text-right font-mono text-slate-300">{row.matches}</td>
                                                    <td className="py-2 px-2 text-right font-mono text-slate-300">{row.runs.toLocaleString()}</td>
                                                    <td className="py-2 px-2 text-right font-mono text-slate-300">{row.wickets.toLocaleString()}</td>
                                                    <td className="py-2 px-2 text-right font-mono text-slate-300">{row.average.toFixed(2)}</td>
                                                    <td className="py-2 px-2 text-right font-mono text-slate-300">{row.strikeRate.toFixed(2)}</td>
                                                    <td className="py-2 px-2 text-right font-mono text-slate-300">{row.economy.toFixed(2)}</td>
                                                    <td className="py-2 px-2 text-right font-mono text-slate-300">{row.fifties}</td>
                                                    <td className="py-2 px-2 text-right font-mono text-slate-300">{row.hundreds}</td>
                                                    <td className="py-2 pl-2 text-right font-mono text-emerald-300">{row.formScore.toFixed(1)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CrickJudge;