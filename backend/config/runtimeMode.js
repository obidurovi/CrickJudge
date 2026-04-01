const fs = require('fs');
const path = require('path');

const MODE_FILE = path.join(__dirname, 'runtime-mode.json');

const defaultMode = {
    freeTierMode: process.env.FREE_TIER_MODE !== 'false'
};

const readMode = () => {
    try {
        if (!fs.existsSync(MODE_FILE)) {
            return { ...defaultMode };
        }

        const raw = fs.readFileSync(MODE_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
            freeTierMode: typeof parsed?.freeTierMode === 'boolean' ? parsed.freeTierMode : defaultMode.freeTierMode
        };
    } catch {
        return { ...defaultMode };
    }
};

const writeMode = (mode) => {
    fs.writeFileSync(MODE_FILE, JSON.stringify(mode, null, 2));
};

let runtimeMode = readMode();

const getRuntimeMode = () => ({ ...runtimeMode });

const setFreeTierMode = (enabled) => {
    runtimeMode = { ...runtimeMode, freeTierMode: !!enabled };
    writeMode(runtimeMode);
    return getRuntimeMode();
};

module.exports = { getRuntimeMode, setFreeTierMode };
