const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const router = express.Router();

router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Email regex from https://www.regular-expressions.info/email.html
        const emailRegex = /^[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,}$/i;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long' });
        }


        // Check if the user exists
        const user = await db.query('SELECT * FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );

        if (user.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const newUser = await db.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
            [username, email, hashedPassword]
        );

        // Generate JWT token
        const token = jwt.sign(
            { id: newUser.rows[0].id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '12h' }
        );

        res.json({ 
            token,
            user: newUser
        });

    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ message: 'Server error during registration!' });
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }
        
        // Email regex from https://www.regular-expressions.info/email.html
        const emailRegex = /^[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,}$/i;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }


        // Check if the user exists
        const user = await db.query(
            'SELECT id, username, email, password_hash FROM users WHERE email = $1', 
            [email]
        );

        if (user.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check if the password is correct
        const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);

        if (!validPassword) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.rows[0].id }, 
            process.env.JWT_SECRET, 
            { expiresIn: '12h' }
        );

        // return the user without the password
        const { password_hash, ...userWithoutPassword } = user.rows[0];
        res.json({ 
            token,
            user: userWithoutPassword 
        });

    } catch (err) {
        console.error(err.stack);
        res.status(500).json({ message: 'Server error during login' });
    }
});

module.exports = router;