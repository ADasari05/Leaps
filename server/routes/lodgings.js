const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// Get all lodgings
router.get('/', auth, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM lodging');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching lodgings:', err);
        res.status(500).json({ message: 'Server error fetching lodgings' });
    }
});

module.exports = router;
