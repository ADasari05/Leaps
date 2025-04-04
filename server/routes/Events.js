const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const fetch = require('node-fetch');
require('dotenv').config();

// Create a new custom event
router.post('/', auth, async (req, res) => {
    try {
        console.log(req.body);
        const { name, description, location, date, start_time, price, type } = req.body;
        const creator_id = req.user.id; // From auth middleware
        if (!name || !location || !start_time || !type) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        // Combine date and time into a full timestamp
        const formattedStartTime = `${date} ${start_time}:00`;
        // Insert event data into the database
        const result = await db.query(
            'INSERT INTO customevents (creator_id, name, description, location, start_time, price, type) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [creator_id, name, description, location, formattedStartTime, price, type]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating custom event:', err);
        res.status(500).json({ message: 'Server error creating custom event!' });
    }
});

// Get all custom events for the authenticated user
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user.id; // From auth middleware

        const result = await db.query(
            'SELECT * FROM customevents WHERE creator_id = $1', [userId]
        );

        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching events:', err);
        res.status(500).json({ message: 'Server error fetching events' });
    }
});


// Delete a custom event by ID
router.delete('/:id', auth, async (req, res) => {
    try {
        const eventId = req.params.id;
        const userId = req.user.id; // From auth middleware

        // Ensure the user is the creator of the event
        const result = await db.query(
            'DELETE FROM customevents WHERE id = $1 AND creator_id = $2 RETURNING *',
            [eventId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Custom event not found or not authorized to delete' });
        }

        res.json({ message: 'Event deleted successfully' });
    } catch (err) {
        console.error('Error deleting custom event:', err);
        res.status(500).json({ message: 'Server error deleting custom event' });
    }
});

// Get a single event by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const eventID = req.params.id;
        console.log(`Fetching event with ID: ${eventID}`);

        let itemType;
        try {
            const tripItemResult = await db.query(
                'SELECT item_type FROM trip_items WHERE item_id = $1',
                [eventID]
            );

            if (tripItemResult.rows.length === 0) {
                return res.status(404).json({ message: 'Trip item not found' });
            }
            itemType = tripItemResult.rows[0].item_type;
            console.log(`Item type found in trip-items table: ${itemType}`);
        } catch (err) {
            console.log("Error fetching item type from trip-items table:", err.message);
            return res.status(500).json({ message: 'Error fetching item type from trip-items table' });
        }

        /*try {
            const result = await db.query(
                'SELECT * FROM events WHERE id = $1',
                [eventID]
            );

            if (result.rows.length > 0) {
                console.log("Found event in database");
                return res.json(result.rows[0]);
            }
        } catch (dbErr) {
            console.log("DB lookup failed, trying Ticketmaster instead:", dbErr.message);
        }*/

        let result;
        if (itemType === 'events') {
            // If item type is 'events', fetch from the 'events' table
            try {
                result = await db.query(
                    'SELECT * FROM events WHERE id = $1',
                    [eventID]
                );

                if (result.rows.length > 0) {
                    console.log("Found regular event in database");
                    return res.json({ ...result.rows[0], type: 'regular-event' });
                }
            } catch (dbErr) {
                console.log("Error fetching event from events table:", dbErr.message);
            }
        } else if (itemType === 'custom-event') {
            // If item type is 'custom-event', fetch from the 'custom-events' table
            try {
                result = await db.query(
                    'SELECT * FROM customevents WHERE id = $1',
                    [eventID]
                );

                if (result.rows.length > 0) {
                    console.log("Found custom event in database");
                    const customEvent = result.rows[0];
                
                    return res.json({
                        id: customEvent.id,
                        name: customEvent.name,
                        location: customEvent.location,
                        date: customEvent.start_time.toISOString().split('T')[0],
                        time: new Date(customEvent.start_time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                        }), 
                        description: customEvent.description || 'No description available',
                        price: customEvent.price || 'Free',
                        image: customEvent.image || null,
                        eventType: customEvent.type
                    });
                }
            } catch (dbErr) {
                console.log("Error fetching event from custom-events table:", dbErr.message);
            }
        } else {
            return res.status(404).json({ message: 'Invalid item type in trip-items table' });
        }

        const tmApiKey = process.env.TICKETMASTER_API_KEY;
        if (!tmApiKey) {
            return res.status(500).json({ message: 'API configuration error' });
        }

        const tmUrl = `https://app.ticketmaster.com/discovery/v2/events/${eventID}.json?apikey=${tmApiKey}`;
        const response = await fetch(tmUrl);

        if (!response.ok) {
            console.log(`Ticketmaster API returned error: ${response.status}`);
            return res.status(404).json({ message: 'Event not found' });
        }

        const eventData = await response.json();
        // Transform the Ticketmaster data to match your application's format
        const formattedEvent = {
            id: eventData.id,
            name: eventData.name,
            eventType: eventData.classifications?.[0]?.segment?.name || 'Unknown',
            location: eventData._embedded?.venues?.[0]?.city?.name || 'Unknown',
            date: eventData.dates?.start?.localDate || 'TBD',
            time: eventData.dates?.start?.localTime ? 
                  new Date(`1970-01-01T${eventData.dates?.start?.localTime}`).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) 
                  : 'TBD',
            description: eventData.info || eventData.pleaseNote || 'No description available',
            price: eventData.priceRanges ? 
                  `$${eventData.priceRanges[0].min} - $${eventData.priceRanges[0].max}` 
                  : 'Price unavailable',
            url: eventData.url || null,
            image: eventData.images?.[0]?.url || null
        };
        console.log("Formatted event data:", formattedEvent.name);
        res.json(formattedEvent);
    } catch (err) {
        console.error('Error fetching event:', err);
        res.status(500).json({ message: 'Server error fetching event' });
    }
});


module.exports = router;