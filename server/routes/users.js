const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

// Update the user's username
router.put('/update/username', async (req, res) => {
    try {
        const id = req.user.id; // Get from token
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({ message: 'Username are required' });
        }

        const result = await db.query(
            'UPDATE users SET username = $1 WHERE id = $2 RETURNING *',
            [username, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error during username update:', err.message);
        console.error(err.stack);
        res.status(500).json({ message: 'Server error during username update' });
    }
});

// Update the user's email
router.put('/update/email', async (req, res) => {
    try {
        const id = req.user.id;  // Get from token
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email are required' });
        }

        // Email regex from https://www.regular-expressions.info/email.html
        const emailRegex = /^[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,}$/i;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        const result = await db.query(
            'UPDATE users SET email = $1 WHERE id = $2 RETURNING *',
            [email, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error during email update:', err.message);
        console.error(err.stack);
        res.status(500).json({ message: 'Server error during email update' });
    }
});

// Update the user's password
router.put('/update/password', async (req, res) => {
    try {
        const id = req.user.id;  // Get from token
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: 'Password are required' });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const result = await db.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING *',
            [password_hash, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error during password update:', err.message);
        console.error(err.stack);
        res.status(500).json({ message: 'Server error during password update' });
    }
});

// Delete the user
router.delete('/delete', async (req, res) => {
    try {
        const id = req.user.id;  // Get from token

        const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error during user deletion:', err.message);
        console.error(err.stack);
        res.status(500).json({ message: 'Server error during user deletion' });
    }
});

module.exports = router;