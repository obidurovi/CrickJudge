const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load Config
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middleware to parse JSON
app.use(express.json());

app.get('/', (req, res) => res.send('CrickJudge API is running with MongoDB'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(\Server running on port \\));
