const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); // Import CORS
const connectDB = require('./config/db');
const playerRoutes = require('./routes/playerRoutes');
const venueRoutes = require('./routes/venueRoutes'); // Import this
const scrapePlayers = require('./utils/playerScraper');
const scrapeVenues = require('./utils/venueScraper');

dotenv.config();
connectDB();

const app = express();

app.use(cors()); // Enable CORS for Frontend access
app.use(express.json());

// Mount Routes
app.use('/api/players', playerRoutes);
app.use('/api/venues', venueRoutes); // Add this line

app.get('/', (req, res) => res.send('CrickJudge API is running'));

// Scrape Data Endpoint
app.get('/api/scrape', async (req, res) => {
    try {
        console.log('Starting database refresh...');
        
        // Run both scrapers
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
