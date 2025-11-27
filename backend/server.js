const express = require('express');
const app = express();

app.get('/', (req, res) => res.send('CrickJudge Backend is Running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(\Server running on port \\));
