const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// Get all travel items
router.get('/', auth, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM travel');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching travel items:', err);
        res.status(500).json({ message: 'Server error fetching travel items' });
    }
});

module.exports = router;
