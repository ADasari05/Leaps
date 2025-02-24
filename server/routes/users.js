const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const pool = new Pool();

// Update the user's username
router.put('/update/username', async (req, res) => {
    const { id, username } = req.body;
    try {
        const result = await pool.query(
            'UPDATE users SET username = $1 WHERE id = $2 RETURNING *',
            [username, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update the user's email
router.put('/update/email', async (req, res) => {
    const { id, email } = req.body;
    try {
        const result = await pool.query(
            'UPDATE users SET email = $1 WHERE id = $2 RETURNING *',
            [email, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update the user's password
router.put('/update/password', async (req, res) => {
    const { id, password } = req.body;
    try {
        // Hash the password
        const password_hash = await bcrypt.hash(password, 10);

        const result = await pool.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING *',
            [password_hash, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete the user
router.delete('/delete', async (req, res) => {
    const { id } = req.body;
    try {
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;