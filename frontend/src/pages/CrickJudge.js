import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const CrickJudge = () => {
    const [players, setPlayers] = useState([]);
    const [p1, setP1] = useState(null);
    const [p2, setP2] = useState(null);

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

    // Normalize data for Radar Chart (0-100 scale)
    const getChartData = () => {
        if (!p1 || !p2) return [];
        
        // Helper to normalize stats roughly to 100
        const norm = (val, max) => (val / max) * 100;

        return [
            { subject: 'Batting Avg', A: norm(p1.stats.average, 60), B: norm(p2.stats.average, 60), fullMark: 100 },
            { subject: 'Strike Rate', A: norm(p1.stats.strikeRate, 160), B: norm(p2.stats.strikeRate, 160), fullMark: 100 },
            { subject: 'Wickets', A: norm(p1.stats.wickets, 600), B: norm(p2.stats.wickets, 600), fullMark: 1