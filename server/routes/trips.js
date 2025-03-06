const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// Get all trips for the authenticated user
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user.id; // From auth middleware

        const result = await db.query(
            'SELECT * FROM trips WHERE creator_id = $1 OR id IN (SELECT trip_id FROM trip_members WHERE user_id = $1)',
            [userId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching trips:', err);
        res.status(500).json({ message: 'Server error fetching trips' });
    }
});

// Get a single trip by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const tripId = req.params.id;
        const userId = req.user.id; // From auth middleware

        const result = await db.query(
            'SELECT * FROM trips WHERE id = $1 AND (creator_id = $2 OR id IN (SELECT trip_id FROM trip_members WHERE user_id = $2))',
            [tripId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Trip not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching trip:', err);
        res.status(500).json({ message: 'Server error fetching trip' });
    }
});

// Create a new trip
router.post('/', auth, async (req, res) => {
    try {
        const { name, description, destination, startDate, endDate, isPublic } = req.body;
        const creatorId = req.user.id; // From auth middleware

        const result = await db.query(
            'INSERT INTO trips (name, description, creator_id, destination, start_date, end_date, is_public) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [name, description, creatorId, destination, startDate, endDate, isPublic]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating trip:', err);
        res.status(500).json({ message: 'Server error creating trip' });
    }
});

module.exports = router;
