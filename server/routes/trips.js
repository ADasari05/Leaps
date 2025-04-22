const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const fetch = require('node-fetch');

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

        // Fetch trip items with date information
        const itemsResult = await db.query(
            `SELECT ti.*, 
                    e.start_time AS event_start_date, e.end_time AS event_end_date,
                    t.departure AS travel_start_date, t.arrival AS travel_end_date,
                    l.check_in_date AS lodging_start_date, l.check_out_date AS lodging_end_date
             FROM trip_items ti
             LEFT JOIN events e ON ti.item_type = 'event' AND ti.item_id = e.id::TEXT
             LEFT JOIN travel t ON ti.item_type = 'travel' AND ti.item_id = t.id::TEXT
             LEFT JOIN lodging l ON ti.item_type = 'lodging' AND ti.item_id = l.id::TEXT
             WHERE ti.trip_id = $1
             ORDER BY ti.created_at DESC`,
            [tripId]
        );

        // Map date information to items
        trip.items = itemsResult.rows.map(item => ({
            ...item,
            start_date: item.event_start_date || item.travel_start_date || item.lodging_start_date,
            end_date: item.event_end_date || item.travel_end_date || item.lodging_end_date
        }));

        // Fetch trip members, including the creator
        const membersResult = await db.query(
            `SELECT u.id, u.username, u.profile_pic 
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

// Get trip items with associated date information
router.get('/:id/items-with-dates', auth, async (req, res) => {
    try {
        const tripId = req.params.id;
        const userId = req.user.id;

        // Ensure the user has access to the trip
        const tripCheck = await db.query(
            `SELECT 1 FROM trips 
             WHERE id = $1 
             AND (creator_id = $2 OR id IN (SELECT trip_id FROM trip_members WHERE user_id = $2))`,
            [tripId, userId]
        );

        if (tripCheck.rows.length === 0) {
            return res.status(403).json({ message: 'Not authorized to access this trip' });
        }

        // Fetch trip items with date information
        const itemsResult = await db.query(
            `SELECT ti.*, 
                    e.start_time AS event_start_date, e.end_time AS event_end_date,
                    t.departure AS travel_start_date, t.arrival AS travel_end_date,
                    l.check_in_date AS lodging_start_date, l.check_out_date AS lodging_end_date
             FROM trip_items ti
             LEFT JOIN events e ON ti.item_type = 'event' AND ti.item_id = e.id::TEXT
             LEFT JOIN travel t ON ti.item_type = 'travel' AND ti.item_id = t.id::TEXT
             LEFT JOIN lodging l ON ti.item_type = 'lodging' AND ti.item_id = l.id::TEXT
             WHERE ti.trip_id = $1
             ORDER BY ti.created_at DESC`,
            [tripId]
        );

        //console.log("Items result:", itemsResult.rows); // Debugging log
        res.json(itemsResult.rows);
    } catch (err) {
        console.error('Error fetching trip items with dates:', err);
        res.status(500).json({ message: 'Server error fetching trip items with dates' });
    }
});

// Create a new trip
router.post('/', auth, async (req, res) => {
    try {
        const { name, description, destination, startDate, endDate, isPublic, status} = req.body;
        const creatorId = req.user.id; // From auth middleware

        const result = await db.query(
            'INSERT INTO trips (name, description, creator_id, destination, start_date, end_date, is_public, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [name, description, creatorId, destination, startDate, endDate, isPublic, status]
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
        const { name, description, destination, startDate, endDate, isPublic, current } = req.body;
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
            'UPDATE trips SET name = $1, description = $2, destination = $3, start_date = $4, end_date = $5, is_public = $6, current = $7 WHERE id = $8 AND creator_id = $9 RETURNING *',
            [name, description, destination, startDate, endDate, currentIsPublic, current, tripId, userId]
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

router.put('/complete/:id', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const tripId = req.params.id;

        //complete the trip
        const result = await db.query(
            'UPDATE trips SET current = false, status = $1 WHERE id = $2 AND creator_id = $3 RETURNING *',
            ['Past', tripId, userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Trip not found or not authorized to update' });
        }

        res.json(result.rows[0]);

    }
    catch (err) {
        console.error('Error completing trip:', err);
        res.status(500).json({ message: 'Server error completing trip' });
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

// Add an item (event, travel, lodging) to a trip
router.post('/add-item', auth, async (req, res) => {
    const { tripId, itemType, itemId } = req.body;
    console.log("Received:", { tripId, itemType, itemId });
    try {
      const result = await db.query(
        'INSERT INTO trip_items (trip_id, item_type, item_id) VALUES ($1, $2, $3) RETURNING *',
        [tripId, itemType, itemId]
      );
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error adding item to trip:', error);
      res.status(500).json({ error: 'Failed to add item' });
    }
});


router.delete('/items/:tripId/:itemType/:itemId', auth, async (req, res) => {
    const { tripId, itemType, itemId } = req.params;
    console.log("Deleting item:", { tripId, itemType, itemId });
    
    try {
      // First verify the user has access to this trip
      const userId = req.user.id;
      const tripCheck = await db.query(
        'SELECT * FROM trips WHERE id = $1 AND (creator_id = $2 OR id IN (SELECT trip_id FROM trip_members WHERE user_id = $2))',
        [tripId, userId]
      );
      
      if (tripCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Not authorized to modify this trip' });
      }
      
      // Delete the item
      const result = await db.query(
        'DELETE FROM trip_items WHERE trip_id = $1 AND item_type = $2 AND item_id = $3 RETURNING *',
        [tripId, itemType, itemId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Item not found in trip' });
      }
      
      res.json({ message: 'Item deleted successfully', item: result.rows[0] });
    } catch (error) {
      console.error('Error deleting item from trip:', error);
      res.status(500).json({ error: 'Failed to delete item' });
    }
  });

  /*
  // Placeholder for event details (to be replaced with real data source)
router.get('/events/:id', auth, async (req, res) => {
    try {
      const eventId = req.params.id;
      // TODO: Fetch from Ticketmaster or a local events table
      // For now, return a mock event based on trip_items
      const eventResult = await db.query(
        'SELECT * FROM trip_items WHERE item_type = $1 AND item_id = $2',
        ['events', eventId]
      );
      if (eventResult.rows.length === 0) {
        return res.status(404).json({ message: 'Event not found in trips' });
      }
      // Mock event data (replace with real fetch later)
      res.json({
        id: eventId,
        name: `Event ${eventId}`,
        location: 'Unknown',
        date: '2025-03-10',
        time: '19:00',
        description: 'Sample event description',
        price: '$50',
        url: 'https://www.ticketmaster.com',
      });
    } catch (err) {
      console.error('Error fetching event:', err);
      res.status(500).json({ message: 'Server error fetching event' });
    } 
  }); */
  
// Vote on a trip item
router.post('/items/:tripId/vote', auth, async (req, res) => {
    const { tripId } = req.params;
    const { itemId, vote } = req.body;
    const userId = req.user.id;

    try {
        // Ensure the user has access to the trip
        const tripCheck = await db.query(
            'SELECT * FROM trips WHERE id = $1 AND (creator_id = $2 OR id IN (SELECT trip_id FROM trip_members WHERE user_id = $2))',
            [tripId, userId]
        );

        if (tripCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Not authorized to vote on this trip' });
        }

        // Insert or update the vote
        const result = await db.query(
            `INSERT INTO trip_item_votes (trip_item_id, user_id, vote) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (trip_item_id, user_id) 
             DO UPDATE SET vote = $3 RETURNING *`,
            [itemId, userId, vote]
        );

        // Fetch updated vote counts
        const votes = await db.query(
            `SELECT trip_item_id, 
                    COALESCE(SUM(CASE WHEN vote THEN 1 ELSE 0 END), 0) AS upVotes, 
                    COALESCE(SUM(CASE WHEN NOT vote THEN 1 ELSE 0 END), 0) AS downVotes 
             FROM trip_item_votes 
             WHERE trip_item_id = $1
             GROUP BY trip_item_id`,
            [itemId]
        );

        res.json({ message: 'Vote recorded', vote: result.rows[0], counts: votes.rows[0] });
    } catch (error) {
        console.error('Error voting on trip item:', error);
        res.status(500).json({ error: 'Failed to record vote' });
    }
});

// Fetch vote counts for a trip item
router.get('/items/:tripId/votes', auth, async (req, res) => {
    const { tripId } = req.params;

    try {
        const votes = await db.query(
            `SELECT trip_item_id, 
                    COALESCE(SUM(CASE WHEN vote THEN 1 ELSE 0 END), 0)::INTEGER AS upVotes, 
                    COALESCE(SUM(CASE WHEN NOT vote THEN 1 ELSE 0 END), 0)::INTEGER AS downVotes 
             FROM trip_item_votes 
             WHERE trip_item_id IN (SELECT id FROM trip_items WHERE trip_id = $1)
             GROUP BY trip_item_id`,
            [tripId]
        );

        res.json(votes.rows);
    } catch (error) {
        console.error('Error fetching vote counts:', error);
        res.status(500).json({ error: 'Failed to fetch vote counts' });
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

// Assign a role to a trip member
router.put('/:tripId/members/:memberId/role', auth, async (req, res) => {
    try {
        const { tripId, memberId } = req.params;
        const { role } = req.body;
        const userId = req.user.id;

        // Ensure the user is the creator of the trip
        const tripCheck = await db.query(
            'SELECT creator_id FROM trips WHERE id = $1',
            [tripId]
        );

        if (tripCheck.rows.length === 0 || tripCheck.rows[0].creator_id !== userId) {
            return res.status(403).json({ message: 'Only the trip creator can update roles' });
        }

        // Update or insert the member's role
        const result = await db.query(
            `INSERT INTO trip_member_roles (trip_id, user_id, role) 
             VALUES ($1, $2, $3)
             ON CONFLICT (trip_id, user_id) 
             DO UPDATE SET role = $3 RETURNING *`,
            [tripId, memberId, role]
        );

        res.json({ message: 'Role updated successfully', member: result.rows[0] });
    } catch (err) {
        console.error('Error updating member role:', err);
        res.status(500).json({ message: 'Server error updating member role' });
    }
});

// Fetch trip members with roles
router.get('/:tripId/members', auth, async (req, res) => {
    try {
        const { tripId } = req.params;

        const members = await db.query(
            `SELECT u.id, u.username, u.profile_pic, r.role
             FROM users u
             JOIN trip_member_roles r ON u.id = r.user_id
             WHERE r.trip_id = $1`,
            [tripId]
        );
        console.log("Members result:", members.rows);
        res.json(members.rows);
    } catch (err) {
        console.error('Error fetching trip members with roles:', err);
        res.status(500).json({ message: 'Server error fetching trip members' });
    }
});

// Vote to cancel a trip
router.post('/:id/vote-cancel', auth, async (req, res) => {
    try {
        const tripId = req.params.id;
        const userId = req.user.id;

        // Ensure the user is a member of the trip
        const tripCheck = await db.query(
            `SELECT 1 FROM trips 
             WHERE id = $1 
             AND (creator_id = $2 OR id IN (SELECT trip_id FROM trip_members WHERE user_id = $2))`,
            [tripId, userId]
        );

        if (tripCheck.rows.length === 0) {
            return res.status(403).json({ message: 'Not authorized to vote on this trip' });
        }

        // Insert the vote if it doesn't already exist
        const result = await db.query(
            `INSERT INTO trip_cancellation_votes (trip_id, user_id) 
             VALUES ($1, $2) 
             ON CONFLICT DO NOTHING RETURNING *`,
            [tripId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ message: 'You have already voted to cancel this trip' });
        }

        res.json({ message: 'Vote recorded', vote: result.rows[0] });
    } catch (err) {
        console.error('Error voting to cancel trip:', err);
        res.status(500).json({ message: 'Server error voting to cancel trip' });
    }
});

// Check if the user has voted to cancel the trip
router.get('/:id/user-vote', auth, async (req, res) => {
    try {
        const tripId = req.params.id;
        const userId = req.user.id;

        const voteCheck = await db.query(
            `SELECT 1 FROM trip_cancellation_votes 
             WHERE trip_id = $1 AND user_id = $2`,
            [tripId, userId]
        );

        res.json({ hasVoted: voteCheck.rows.length > 0 });
    } catch (err) {
        console.error('Error checking user vote:', err);
        res.status(500).json({ message: 'Server error checking user vote' });
    }
});

// Rescind a vote to cancel a trip
router.delete('/:id/rescind-vote', auth, async (req, res) => {
    try {
        const tripId = req.params.id;
        const userId = req.user.id;

        // Ensure the user has voted to cancel the trip
        const voteCheck = await db.query(
            `SELECT 1 FROM trip_cancellation_votes 
             WHERE trip_id = $1 AND user_id = $2`,
            [tripId, userId]
        );

        if (voteCheck.rows.length === 0) {
            return res.status(400).json({ message: 'You have not voted to cancel this trip' });
        }

        // Delete the user's vote
        await db.query(
            `DELETE FROM trip_cancellation_votes 
             WHERE trip_id = $1 AND user_id = $2`,
            [tripId, userId]
        );

        res.json({ message: 'Vote rescinded successfully' });
    } catch (err) {
        console.error('Error rescinding vote:', err);
        res.status(500).json({ message: 'Server error rescinding vote' });
    }
});

// Check cancellation votes
router.get('/:id/cancellation-status', auth, async (req, res) => {
    try {
        const tripId = req.params.id;

        const votes = await db.query(
            `SELECT COUNT(*) AS cancel_votes 
             FROM trip_cancellation_votes 
             WHERE trip_id = $1`,
            [tripId]
        );

        res.json(votes.rows[0]);
    } catch (err) {
        console.error('Error fetching cancellation votes:', err);
        res.status(500).json({ message: 'Server error fetching cancellation votes' });
    }
});

// Restore a cancelled trip
router.post('/:id/restore', auth, async (req, res) => {
    try {
        const tripId = req.params.id;
        const userId = req.user.id;

        // Ensure the user is the creator of the trip
        const tripCheck = await db.query(
            'SELECT creator_id FROM trips WHERE id = $1',
            [tripId]
        );

        if (tripCheck.rows.length === 0 || tripCheck.rows[0].creator_id !== userId) {
            return res.status(403).json({ message: 'Only the creator can restore the trip' });
        }

        // Restore the trip by deleting all cancellation votes
        await db.query('BEGIN');
        await db.query('DELETE FROM trip_cancellation_votes WHERE trip_id = $1', [tripId]);

        // Update the trip status to 'Upcoming'
        await db.query('UPDATE trips SET status = $1 WHERE id = $2', ['Upcoming', tripId]);
        await db.query('COMMIT');

        res.json({ message: 'Trip restored successfully' });
    } catch (err) {
        console.error('Error restoring trip:', err);
        await db.query("ROLLBACK");
        res.status(500).json({ message: 'Server error restoring trip' });
    }
});

// Mark status of trip as cancelled
router.put('/cancel/:tripId', async (req, res) => {
    const { tripId } = req.params;

    try {
        await db.query('UPDATE trips SET status = $1 WHERE id = $2', ['Cancelled', tripId]);
        res.json({ message: 'Trip cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling trip:', error);
        res.status(500).json({ error: 'Failed to cancel trip' });
    }
});

// Mark status of trip to current
router.put('/mark-as-current/:tripId', auth, async (req, res) => {
    const { tripId } = req.params;

    try {
        const trip = await db.query('SELECT * FROM trips WHERE id = $1', [tripId]);
        if (trip.rows.length === 0) {
            return res.status(404).json({ message: 'Trip not found' });
        }
        // Update the status to 'Current'
        const updateResponse = await db.query(
            'UPDATE trips SET status = $1 WHERE id = $2 RETURNING *',
            ['Current', tripId]
        );
        if (updateResponse.rows.length === 0) {
            return res.status(500).json({ message: 'Failed to update trip status' });
        }

        res.json({ message: 'Trip status updated to Current successfully' });
    } catch (err) {
        console.error('Error marking trip as current:', err);
        res.status(500).json({ message: 'Server error updating trip status' });
    }
});

// Promote a user to Creator
router.put('/:id/promote-to-creator', auth, async (req, res) => {
    try {
        const tripId = req.params.id;
        const { newCreatorId } = req.body;
        const userId = req.user.id;

        // Ensure the user is the current creator of the trip
        const tripCheck = await db.query(
            'SELECT creator_id FROM trips WHERE id = $1',
            [tripId]
        );

        if (tripCheck.rows.length === 0 || tripCheck.rows[0].creator_id !== userId) {
            return res.status(403).json({ message: 'Only the current Creator can promote another user to Creator' });
        }

        // Start a transaction
        await db.query('BEGIN');

        // Add the current creator as a "co-creator" in trip_member_roles
        await db.query(
            `INSERT INTO trip_member_roles (trip_id, user_id, role) 
             VALUES ($1, $2, 'co-creator') 
             ON CONFLICT (trip_id, user_id) 
             DO UPDATE SET role = 'co-creator'`,
            [tripId, userId]
        );

        // Ensure the current creator is in trip_members
        await db.query(
            `INSERT INTO trip_members (trip_id, user_id) 
             VALUES ($1, $2) 
             ON CONFLICT DO NOTHING`,
            [tripId, userId]
        );

        // Remove the new creator from trip_members
        await db.query(
            `DELETE FROM trip_members 
             WHERE trip_id = $1 AND user_id = $2`,
            [tripId, newCreatorId]
        );

        // Remove the new creator from any previous role in trip_member_roles
        await db.query(
            `DELETE FROM trip_member_roles 
             WHERE trip_id = $1 AND user_id = $2`,
            [tripId, newCreatorId]
        );

        // Update the trip's creator_id
        const result = await db.query(
            'UPDATE trips SET creator_id = $1 WHERE id = $2 RETURNING *',
            [newCreatorId, tripId]
        );

        if (result.rows.length === 0) {
            await db.query('ROLLBACK');
            return res.status(404).json({ message: 'Trip not found' });
        }

        // Commit the transaction
        await db.query('COMMIT');

        res.json({ message: 'User promoted to Creator successfully', trip: result.rows[0] });
    } catch (err) {
        console.error('Error promoting user to Creator:', err);
        await db.query('ROLLBACK');
        res.status(500).json({ message: 'Server error promoting user to Creator' });
    }
});

module.exports = router;
