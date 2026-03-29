import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    hasData: false,
    anchorBatterName: null,
    leadBowlerName: null,
    isPlaying: false,
    gameOver: false,
    runs: 0,
    wickets: 0,
    ballsFaced: 0,
    powerplayRuns: 0,
    powerplayWickets: 0,
    matchLog: [],
    overSummary: [],
    wagonShots: [],
    battingLineup: [],
    bowlingAttack: [],
    currentPair: { striker: null, nonStriker: null },
    nextBatter: null,
    currentOverBowler: null,
    bowlingSpells: [],
    battingStats: [],
    fallOfWickets: [],
    currentPartnership: { runs: 0, balls: 0, batters: '-' },
    bestPartnership: { runs: 0, balls: 0, batters: '-', wicketAt: '-' }
};

const simulationRuntimeSlice = createSlice({
    name: 'simulationRuntime',
    initialState,
    reducers: {
        setRuntimeSnapshot: (state, action) => {
            return {
                ...state,
                ...action.payload,
                hasData: true
            };
        },
        clearRuntimeSnapshot: () => initialState
    }
});

export const { setRuntimeSnapshot, clearRuntimeSnapshot } = simulationRuntimeSlice.actions;
export default simulationRuntimeSlice.reducer;
