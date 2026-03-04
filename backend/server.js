const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const playerRoutes = require('./routes/playerRoutes');
const venueRoutes = require('./routes/venueRoutes');
const matchRoutes = require('./routes/matchRoutes');
const scrapePlayers = require('./utils/playerScraper');
const scrapeVenues = require('./utils/venueScraper');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/players', playerRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/matches', matchRoutes);

app.get('/', (req, res) => res.send('CrickJudge API is running'));

app.get('/api/scrape', async (req, res) => {
    try {
        console.log('Starting database refresh...');
        await scrapePlayers();
        await scrapeVenues();
        res.json({ message: "All databases (Players & Venues) refreshed successfully!" });
    } catch (error) {
        console.error('Scraping Error:', error);
        res.status(500).json({ message: "Error scraping data", error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
