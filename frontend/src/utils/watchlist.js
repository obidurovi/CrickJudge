const WATCHLIST_STORAGE_KEY = 'crickjudge.playerWatchlist';

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
