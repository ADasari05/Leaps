const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

router.get('/trip/:tripId', auth, async (req, res) => {
  try {
    const { tripId } = req.params;
    
    const memberCheck = await db.query(
      'SELECT * FROM trip_members WHERE trip_id = $1 AND user_id = $2',
      [tripId, req.user.id]
    );
    
    if (memberCheck.rows.length === 0) {
      // Return an empty array with a 403 status code
      return res.status(403).json({ error: 'Not authorized to view these messages', messages: [] });
    }
    
    const messagesResult = await db.query(
      `SELECT m.*, u.username as sender_name
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.trip_id = $1
       ORDER BY m.created_at ASC`,
      [tripId]
    );
    
    // Return the messages array
    res.json(messagesResult.rows || []);
  } catch (err) {
    console.error(err.message);
    // Return an empty array with a 500 status code
    res.status(500).json({ error: 'Server error', messages: [] });
  }
});

module.exports = router;