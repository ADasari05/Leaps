const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');

// Get all trips for the authenticated user
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user.id; // From auth middleware

        const result = await db.query(
            'SELECT * FROM trips WHERE creator_id = $1 OR id IN (SELECT trip_id FROM trip_members WHERE user_id = $1)',
            [userId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching trips:', err);
        res.status(500).json({ message: 'Server error fetching trips' });
    }
});

// Get a single trip by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const tripId = req.params.id;
        const userId = req.user.id;

        // Fetch trip details
        const result = await db.query(
            `SELECT * FROM trips WHERE id = $1 
             AND (creator_id = $2 OR id IN (SELECT trip_id FROM trip_members WHERE user_id = $2))`,
            [tripId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Trip not found' });
        }

        const trip = result.rows[0];

        // Fetch trip members, including the creator
        const membersResult = await db.query(
            `SELECT u.id, u.username 
            FROM users u
            WHERE u.id IN (
                SELECT user_id FROM trip_members WHERE trip_id = $1
                UNION
                SELECT creator_id FROM trips WHERE id = $1
            )`,
            [tripId]
        );

        trip.members = membersResult.rows; // Add members to the trip object

        res.json(trip);
    } catch (err) {
        console.error('Error fetching trip:', err);
        res.status(500).json({ message: 'Server error fetching trip' });
    }
});

// Create a new trip
router.post('/', auth, async (req, res) => {
    try {
        const { name, description, destination, startDate, endDate, isPublic } = req.body;
        const creatorId = req.user.id; // From auth middleware

        const result = await db.query(
            'INSERT INTO trips (name, description, creator_id, destination, start_date, end_date, is_public) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [name, description, creatorId, destination, startDate, endDate, isPublic]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating trip:', err);
        res.status(500).json({ message: 'Server error creating trip' });
    }
});

// Update a trip by ID
router.put('/:id', auth, async (req, res) => {
    try {
        const tripId = req.params.id;
        const userId = req.user.id; // From auth middleware
        const { name, description, destination, startDate, endDate, isPublic } = req.body;

        // Fetch the current value of is_public if not provided
        let currentIsPublic = isPublic;
        if (currentIsPublic === undefined) {
            const currentTrip = await db.query(
                'SELECT is_public FROM trips WHERE id = $1 AND creator_id = $2',
                [tripId, userId]
            );
            if (currentTrip.rows.length === 0) {
                return res.status(404).json({ message: 'Trip not found or not authorized to update' });
            }
            currentIsPublic = currentTrip.rows[0].is_public;
        }

        // Ensure the user is the creator of the trip
        const result = await db.query(
            'UPDATE trips SET name = $1, description = $2, destination = $3, start_date = $4, end_date = $5, is_public = $6 WHERE id = $7 AND creator_id = $8 RETURNING *',
            [name, description, destination, startDate, endDate, currentIsPublic, tripId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Trip not found or not authorized to update' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error updating trip:', err);
        res.status(500).json({ message: 'Server error updating trip' });
    }
});

// Delete a trip by ID
router.delete('/:id', auth, async (req, res) => {
    try {
        const tripId = req.params.id;
        const userId = req.user.id; // From auth middleware

        // Ensure the user is the creator of the trip
        const result = await db.query(
            'DELETE FROM trips WHERE id = $1 AND creator_id = $2 RETURNING *',
            [tripId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Trip not found or not authorized to delete' });
        }

        res.json({ message: 'Trip deleted successfully' });
    } catch (err) {
        console.error('Error deleting trip:', err);
        res.status(500).json({ message: 'Server error deleting trip' });
    }
});

// fully delete an event
// TODO - fix when event is implemented
router.delete('/:tripId/events/:eventId', auth, async (req, res) => {
    try {
        const { tripId, eventId } = req.params;
        const userId = req.user.id; // From auth middleware

        // Ensure the user is the creator of the trip
        const result = await db.query(
            'DELETE FROM events WHERE id = $1 AND trip_id = $2 AND creator_id = $3 RETURNING *',
            [eventId, tripId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Event not found or not authorized to delete' });
        }

        res.json({ message: 'Event deleted successfully' });
    } catch (err) {
        console.error('Error deleting event:', err);
        res.status(500).json({ message: 'Server error deleting event' });
    }
});

router.post('/add-item', async (req, res) => {
    const { tripId, itemType, itemId } = req.body;
    try {
      const result = await pool.query(
        'INSERT INTO trip_items (trip_id, item_type, item_id) VALUES ($1, $2, $3) RETURNING *',
        [tripId, itemType, itemId]
      );
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to add item' });
    }
});

router.get('/friends', auth, async (req, res) => {
    try {
        const userId = req.user.id;

        const friends = await db.query(
            `SELECT u.id, u.username FROM users u
             JOIN friends f ON (f.user_id1 = $1 AND f.user_id2 = u.id)
             OR (f.user_id2 = $1 AND f.user_id1 = u.id)`,
            [userId]
        );

        res.json(friends.rows);
    } catch (err) {
        console.error('Error fetching friends:', err);
        res.status(500).json({ message: 'Server error fetching friends' });
    }
});

// Add a friend to a trip
router.post('/:id/add-friend', auth, async (req, res) => {
    try {
        const { friendId } = req.body;
        const tripId = req.params.id;
        const userId = req.user.id; // The authenticated user
        console.log("add friend");

        // Check if the friend is in the user's friends list
        const friendCheck = await db.query(
            `SELECT 1 FROM friendships 
             WHERE (user1_id = $1 AND user2_id = $2) 
                OR (user1_id = $2 AND user2_id = $1)`,
            [userId, friendId]
        );

        if (friendCheck.rows.length === 0) {
            return res.status(403).json({ message: 'User is not your friend' });
        }

        // Ensure the trip exists and the user has access to it
        const tripCheck = await db.query(
            `SELECT 1 FROM trips 
             WHERE id = $1 
             AND (creator_id = $2 OR id IN (SELECT trip_id FROM trip_members WHERE user_id = $2))`,
            [tripId, userId]
        );

        if (tripCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Trip not found or access denied' });
        }

        // Add friend to the trip if not already in it
        const insertResult = await db.query(
            `INSERT INTO trip_members (trip_id, user_id) 
             VALUES ($1, $2) 
             ON CONFLICT DO NOTHING RETURNING *`,
            [tripId, friendId]
        );

        if (insertResult.rows.length === 0) {
            return res.status(400).json({ message: 'Friend is already in the trip' });
        }

        res.status(200).json({ message: 'Friend added successfully to the trip' });
    } catch (err) {
        console.error('Error adding friend to trip:', err);
        res.status(500).json({ message: 'Server error adding friend to trip' });
    }
});

//add a friend to a trip by link
router.post('/:id/share', auth, async (req, res) => {
    console.log("in route");
    try {
        //check if the user is logged in
        const userId = req.user.id;
        const tripId = req.params.id;
        console.log("user: ", userId);
        console.log("trip: ", tripId)

        const insertResult = await db.query(
            `INSERT INTO trip_members (trip_id, user_id) 
             VALUES ($1, $2) 
             ON CONFLICT DO NOTHING RETURNING *`,
            [tripId, userId]
        );

        if (insertResult.rows.length === 0) {
            return res.status(400).json({ message: 'Link has expired' });
        }

        res.status(200).json({ message: 'friend added successfully by link' });

    } catch (err) {
        console.error('Error adding friend to trip by link');
        res.status(500).json({ message: 'Server error adding friend to trip by link' });
router.delete('/:tripId/remove-member/:memberId', auth, async (req, res) => {
    // if (memberId == userId) {
    //     return res.status(403).json({ message: 'You cannot remove yourself from the trip.' });
    // }
    
    try {
        const { tripId, memberId } = req.params;
        const userId = req.user.id; // Authenticated user

        // Check if the user is the creator of the trip
        const tripCheck = await db.query(
            'SELECT creator_id FROM trips WHERE id = $1',
            [tripId]
        );

        if (tripCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Trip not found' });
        }

        if (tripCheck.rows[0].creator_id !== userId) {
            return res.status(403).json({ message: 'Only the trip creator can remove members' });
        }

        // Remove the member from the trip
        await db.query(
            'DELETE FROM trip_members WHERE trip_id = $1 AND user_id = $2',
            [tripId, memberId]
        );

        res.json({ message: 'Member removed successfully' });
    } catch (err) {
        console.error('Error removing member:', err);
        res.status(500).json({ message: 'Server error removing member' });
    }
});

router.delete('/:tripId/remove-member/:memberId', auth, async (req, res) => {
    // if (memberId == userId) {
    //     return res.status(403).json({ message: 'You cannot remove yourself from the trip.' });
    // }
    
    try {
        const { tripId, memberId } = req.params;
        const userId = req.user.id; // Authenticated user

        // Check if the user is the creator of the trip
        const tripCheck = await db.query(
            'SELECT creator_id FROM trips WHERE id = $1',
            [tripId]
        );

        if (tripCheck.rows.length === 0) {
            return res.status(404).json({ message: 'Trip not found' });
        }

        if (tripCheck.rows[0].creator_id !== userId) {
            return res.status(403).json({ message: 'Only the trip creator can remove members' });
        }

        // Remove the member from the trip
        await db.query(
            'DELETE FROM trip_members WHERE trip_id = $1 AND user_id = $2',
            [tripId, memberId]
        );

        res.json({ message: 'Member removed successfully' });
    } catch (err) {
        console.error('Error removing member:', err);
        res.status(500).json({ message: 'Server error removing member' });
    }
});

module.exports = router;
