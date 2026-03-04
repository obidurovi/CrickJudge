const selectBestTeam = (players) => {
    const sortBatsmen = (a, b) => b.stats.runs - a.stats.runs;

    const sortBowlers = (a, b) => {
        if (b.stats.wickets !== a.stats.wickets) return b.stats.wickets - a.stats.wickets;
        return a.stats.economy - b.stats.economy;
    };

    const batsmen = players.filter(p => p.role === 'Batsman').sort(sortBatsmen);
    const allrounders = players.filter(p => p.role === 'Allrounder').sort((a, b) => b.stats.average - a.stats.average);
    const keepers = players.filter(p => p.role === 'Wicketkeeper').sort(sortBatsmen);
    const bowlers = players.filter(p => p.role === 'Bowler').sort(sortBowlers);

    const isSpinner = (style) => {
        const s = style.toLowerCase();
        return s.includes('spin') || s.includes('legbreak') || s.includes('orthodox') || s.includes('offbreak');
    };

    const spinBowlers = bowlers.filter(p => isSpinner(p.bowlingStyle));
    const paceBowlers = bowlers.filter(p => !isSpinner(p.bowlingStyle));

    const team = [];

    if (keepers.length > 0) team.push(keepers[0]);
    team.push(...batsmen.slice(0, 4));
    if (allrounders.length > 0) team.push(allrounders[0]);
    team.push(...spinBowlers.slice(0, 2));
    team.push(...paceBowlers.slice(0, 3));

    if (team.length < 11) {
        const usedIds = team.map(p => p._id.toString());
        const remaining = players
            .filter(p => !usedIds.includes(p._id.toString()))
            .sort((a, b) => b.stats.matches - a.stats.matches);

        const needed = 11 - team.length;
        team.push(...remaining.slice(0, needed));
    }

    return team;
};

module.exports = { selectBestTeam };
