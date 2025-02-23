const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db'); 
const authRoutes = require('./routes/auth');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());          // Enable CORS for all routes
app.use(express.json());  // Parse JSON bodies (for POST requests)

// Routes
app.use('/api/auth', authRoutes);


app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Leaps' });
});

// Database test route
app.get('/db-test', async (req, res) => {
    try {
        const result = await db.query('SELECT NOW()');
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ message: 'Something went wrong!' });
    }
})

// Basic error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});