const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors'); // Import CORS
const connectDB = require('./config/db');
const playerRoutes = require('./routes/playerRoutes');

dotenv.config();
connectDB();

const app = express();

app.use(cors()); // Enable CORS for Frontend access
app.use(express.json());

// Mount Routes
app.use('/api/players', playerRoutes);

app.get('/', (req, res) => res.send('CrickJudge API is running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(\Server running on port \\));
