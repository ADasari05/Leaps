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
const lodgingsRoutes = require('./routes/lodgings');
const travelRoutes = require('./routes/travel');
const eventsRoutes = require('./routes/Events');

const http = require('http'); 
const socketIo = require('socket.io');
const { initializeSocket } = require('./socket');

dotenv.config();


const app = express();

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
      origin: 'http://localhost:3001',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

initializeSocket(io);
const port = process.env.PORT || 3000;


// Middleware
app.use(cors({ origin: 'http://localhost:3001' }));   // Enable CORS for all routes
app.use(express.json());  // Parse JSON bodies (for POST requests)
app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/password-reset', passwordResetRoutes);
app.use('/api/friends', friendsRoutes); 
app.use('/api/search', searchRoutes);
app.use('/api/lodgings', lodgingsRoutes);
app.use('/api/travel', travelRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/messages', require('./routes/messages'));

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

server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});