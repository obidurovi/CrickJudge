const selectBestTeam = (players) => {
    // Helper: Sort by Batting (Runs/Avg)
    const sortBatsmen = (a, b) => b.stats.runs - a.stats.runs;
    
    // Helper: Sort by Bowling (Wickets high, Economy low)
    const sortBowlers = (a, b) => {
        if (b.stats.wickets !== a.stats.wickets) return b.stats.wickets - a.stats.wickets;
        return a.stats.economy - b.stats.economy;
    };

    // 1. Categorize Players
    const batsmen = players.filter(p => p.role === 'Batsman').sort(sortBatsmen);
    const allrounders = players.filter(p => p.role === 'Allrounder').sort((a, b) => b.stats.average - a.stats.average);
    const keepers = players.filter(p => p.role === 'Wicketkeeper').sort(sortBatsmen);
    const bowlers = players.filter(p => p.role === 'Bowler').sort(sortBowlers);

    // 2. Identify Spinners vs Pacers within Bowlers
    // (Simple check on bowlingStyle string)
    const isSpinner = (style) => {
        const s = style.toLowerCase();
        return s.includes('spin') || s.includes('legbreak') || s.includes('orthodox') || s.includes('offbreak');
    };

    const spinBowlers = bowlers.filter(p => isSpinner(p.bowlingStyle));
    const paceBowlers = bowlers.filter(p => !isSpinner(p.bowlingStyle));

    const team = [];

    // --- SELECTION LOGIC (Constraints: 1 WK, 4 Bat, 1 All, 2 Spin, 3 Pace) ---
    
    // 1. Pick 1 Wicketkeeper
    if (keepers.length > 0) team.push(keepers[0]);

    // 2. Pick 4 Batsmen (Top Order)
    team.push(...batsmen.slice(0, 4));

    // 3. Pick 1 Allrounder (Middle Order)
    if (allrounders.length > 0) team.push(allrounders[0]);

    // 4. Pick 2 Spinners
    team.push(...spinBowlers.slice(0, 2));

    // 5. Pick 3 Pacers
    team.push(...paceBowlers.slice(0, 3));

    // Fallback: If we don't have enough specific roles (e.g., not enough spinners),
    // fill the remaining spots with the best available players to reach 11.
    if (team.length < 11) {
        const usedIds = team.map(p => p._id.toString());
        const remaining = players
            .filter(p => !usedIds.includes(p._id.toString()))
            .sort((a, b) => b.stats.matches - a.stats.matches); // Sort by experience
        
        const needed = 11 - team.length;
        team.push(...remaining.slice(0, needed));
    }

    return team;
};

module.exports = { selectBestTeam };
