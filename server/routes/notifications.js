const express = require('express');
const db = require('../config/db');
const router = express.Router();
const auth = require('../middleware/auth');

// Get all notifications for the current user
router.get('/list', auth, async (req, res) => {
  const userId = req.user.id;
  
  try {
    console.log('Fetching notifications for user:', userId);
    const result = await db.query(
      `SELECT *
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );
    console.log('Notifications retrieved:', result.rows.length);
    res.json(result.rows);
  } catch (err) {
    console.log('Error fetching notifications:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark a specific notification as read
router.put('/:id/read', auth, async (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user.id;
  
  try {
    const result = await db.query(
      `UPDATE notifications
       SET is_read = true
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all notifications as read
router.put('/read-all', auth, async (req, res) => {
  const userId = req.user.id;
  
  try {
    await db.query(
      `UPDATE notifications
       SET is_read = true
       WHERE user_id = $1`,
      [userId]
    );
    
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread notification count
router.get('/count', auth, async (req, res) => {
  const userId = req.user.id;
  
  try {
    const result = await db.query(
      `SELECT COUNT(*) 
       FROM notifications 
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );
    
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.error('Error getting notification count:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a notification
router.delete('/:id', auth, async (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user.id;
  
  try {
    const result = await db.query(
      `DELETE FROM notifications
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [notificationId, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;