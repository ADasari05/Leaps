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
        const userId = req.user.id; // From auth middleware

        const result = await db.query(
            'SELECT * FROM trips WHERE id = $1 AND (creator_id = $2 OR id IN (SELECT trip_id FROM trip_members WHERE user_id = $2))',
            [tripId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Trip not found' });
        }

        const trip = result.rows[0];

        const itemsResult = await db.query(
            'SELECT * FROM trip_items WHERE trip_id = $1 ORDER BY created_at DESC',
            [tripId]
        );
        
        trip.items = itemsResult.rows;

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
  
module.exports = router;
