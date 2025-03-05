const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const auth = require('../middleware/auth');

// Get user profile - New route
router.get('/profile', auth, async (req, res) => {
    try {
        const id = req.user.id; // From auth middleware

        const result = await db.query(
            'SELECT id, username, email FROM users WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching user profile:', err);
        res.status(500).json({ message: 'Server error fetching profile' });
    }
});

// Unified update route 
router.put('/update', auth, async (req, res) => {
    try {
        const id = req.user.id; // From auth middleware
        const { username, email, password } = req.body;
        
        // Start building the query
        let updateFields = [];
        let queryParams = [];
        let paramCounter = 1;
        
        // Add each field that was provided
        if (username) {
            updateFields.push(`username = $${paramCounter}`);
            queryParams.push(username);
            paramCounter++;
        }
        
        if (email) {
            // Email validation
            const emailRegex = /^[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,}$/i;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ message: 'Invalid email format' });
            }
            
            updateFields.push(`email = $${paramCounter}`);
            queryParams.push(email);
            paramCounter++;
        }
        
        if (password) {
            // Password validation
            if (password.length < 8) {
                return res.status(400).json({ message: 'Password must be at least 8 characters long' });
            }
            
            // Hash the password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            
            updateFields.push(`password_hash = $${paramCounter}`);
            queryParams.push(hashedPassword);
            paramCounter++;
        }
        
        // If no fields to update
        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }
        
        // Build the query
        const query = `
            UPDATE users 
            SET ${updateFields.join(', ')} 
            WHERE id = $${paramCounter} 
            RETURNING id, username, email
        `;
        
        // Add the user ID as the last parameter
        queryParams.push(id);
        
        // Execute the query
        const result = await db.query(query, queryParams);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ message: 'Server error updating user information' });
    }
});

// Delete the user
router.delete('/delete', auth, async (req, res) => {
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

router.get('/search', auth, async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) return res.status(400).json({ message: 'Search query required' });

        const searchTerm = `%${query.toLowerCase()}%`;

        const results = await db.query(
            `SELECT id, username, email
             FROM users
             WHERE LOWER(username) LIKE $1`,
            [searchTerm]
        );

        res.json(results.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while searching users' });
    }
});

module.exports = router;