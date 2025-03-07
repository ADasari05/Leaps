const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// Get a single event by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const eventID = req.params.id;

        const result = await db.query(
            'SELECT * FROM events WHERE id = $1',
            [eventID]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Event not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching event:', err);
        res.status(500).json({ message: 'Server error fetching event' });
    }
});


module.exports = router;