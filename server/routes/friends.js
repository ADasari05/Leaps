const express = require('express');
const db = require('../config/db');
const router = express.Router();
const auth = require('../middleware/auth');


router.post('/add', auth, async (req, res) => {
    try {
        const user_id = req.user.id;
        const { friend_id } = req.body;

        const [smaller_id, larger_id] = [user_id, friend_id].sort();

        const result = await db.query(
            `INSERT INTO friendships (user1_id, user2_id) 
             VALUES ($1, $2) RETURNING *`,
            [smaller_id, larger_id]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while adding friend' });
    }
});

router.get('/list', auth, async (req, res) => {
    try {
        const user_id = req.user.id;

        const friends = await db.query(
            `SELECT u.id, u.username, u.email
             FROM friendships f
             JOIN users u ON (f.user1_id = u.id OR f.user2_id = u.id)
             WHERE (f.user1_id = $1 OR f.user2_id = $1)
             AND u.id != $1`,
            [user_id]
        );

        res.json(friends.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while fetching friends list' });
    }
});

router.delete('/remove', auth, async (req, res) => {
    try {
        const user_id = req.user.id;
        const { friend_id } = req.body;

        const [smaller_id, larger_id] = [user_id, friend_id].sort();

        const result = await db.query(
            `DELETE FROM friendships 
             WHERE user1_id = $1 AND user2_id = $2
             RETURNING *`,
            [smaller_id, larger_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Friendship not found' });
        }

        res.json({ message: 'Friend removed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while removing friend' });
    }
});

router.get('/search', auth, async (req, res) => {
    try {
        const { query } = req.query; // e.g., ?query=nath
        if (!query) return res.status(400).json({ message: 'Search query required' });

        const user_id = req.user.id;
        const searchTerm = `%${query.toLowerCase()}%`;

        const results = await db.query(
            `SELECT id, username, email
             FROM users
             WHERE LOWER(username) LIKE $1
             AND id != $2
             AND id NOT IN (
                 SELECT CASE
                     WHEN user1_id = $2 THEN user2_id
                     WHEN user2_id = $2 THEN user1_id
                 END
                 FROM friendships
                 WHERE user1_id = $2 OR user2_id = $2
             )`,
            [searchTerm, user_id]
        );

        res.json(results.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while searching users' });
    }
});

module.exports = router;