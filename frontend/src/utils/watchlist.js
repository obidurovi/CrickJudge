const WATCHLIST_STORAGE_KEY = 'crickjudge.playerWatchlist';
const WATCHLIST_CLIENT_KEY = 'crickjudge.watchlistClientId';
const WATCHLIST_STATE_API = 'http://localhost:5000/api/players/watchlist/state';

const normalizeId = (id) => (id === null || id === undefined ? '' : String(id).trim());

export const getPlayerWatchlistIds = () => {
    try {
        const raw = localStorage.getItem(WATCHLIST_STORAGE_KEY);
        if (!raw) return [];

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];

        return parsed
            .map((id) => normalizeId(id))
            .filter(Boolean)
            .slice(0, 100);
    } catch {
        return [];
    }
};

const createClientId = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 10);
    return `cj-${timestamp}-${random}`;
};

export const getWatchlistClientId = () => {
    try {
        const existing = localStorage.getItem(WATCHLIST_CLIENT_KEY);
        if (existing) return existing;
        const generated = createClientId();
        localStorage.setItem(WATCHLIST_CLIENT_KEY, generated);
        return generated;
    } catch {
        return 'cj-anon';
    }
};

export const savePlayerWatchlistIds = (ids) => {
    const cleaned = Array.from(new Set((ids || []).map((id) => normalizeId(id)).filter(Boolean))).slice(0, 100);
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(cleaned));
    return cleaned;
};

export const togglePlayerWatchlistId = (id) => {
    const normalized = normalizeId(id);
    if (!normalized) return getPlayerWatchlistIds();

    const current = getPlayerWatchlistIds();
    const next = current.includes(normalized)
        ? current.filter((item) => item !== normalized)
        : [normalized, ...current];

    return savePlayerWatchlistIds(next);
};

export const isPlayerInWatchlist = (id, ids) => {
    const normalized = normalizeId(id);
    if (!normalized) return false;
    const list = Array.isArray(ids) ? ids : getPlayerWatchlistIds();
    return list.includes(normalized);
};

export const getPlayerWatchlistId = (player) => {
    if (!player) return '';
    return normalizeId(player.apiId || player._id);
};

export const fetchRemoteWatchlistIds = async () => {
    try {
        const clientId = getWatchlistClientId();
        const response = await fetch(`${WATCHLIST_STATE_API}?clientId=${encodeURIComponent(clientId)}`);
        if (!response.ok) return [];
        const payload = await response.json();
        const ids = Array.isArray(payload?.playerIds) ? payload.playerIds : [];
        return savePlayerWatchlistIds(ids);
    } catch {
        return getPlayerWatchlistIds();
    }
};

export const saveRemoteWatchlistIds = async (ids) => {
    try {
        const cleaned = savePlayerWatchlistIds(ids);
        const clientId = getWatchlistClientId();
        await fetch(WATCHLIST_STATE_API, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId, playerIds: cleaned })
        });
        return cleaned;
    } catch {
        return savePlayerWatchlistIds(ids);
    }
};
