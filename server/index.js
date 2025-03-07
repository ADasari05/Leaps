const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/db'); 
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const tripRoutes = require('./routes/trips');
const passwordResetRoutes = require('./routes/password-reset');
const friendsRoutes = require('./routes/friends');
const searchRoutes = require('./routes/search');


dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: 'http://localhost:3001' }));   // Enable CORS for all routes
app.use(express.json());  // Parse JSON bodies (for POST requests)

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/friends', friendsRoutes); 
app.use('/api/search', searchRoutes);

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