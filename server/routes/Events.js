const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth');
const fetch = require('node-fetch');
require('dotenv').config();

// Create a new event
router.post('/', auth, async (req, res) => {
    try {
        const { name, description, location, start_time, price, type } = req.body;
        const creatorId = req.user.id; // From auth middleware
        if (!name || !description || !location || !start_time || !price || !type) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        // Insert event data into the database
        const result = await db.query(
            'INSERT INTO events (name, description, location, start_time, price, type) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [name, description, location, start_time, price, type]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creating event:', err);
        res.status(500).json({ message: 'Server error creating event' });
    }
});

// Get a single event by ID
router.get('/:id', (req, res, next) => {
    req.allowGuest = true; 
    next();
}, auth, async (req, res) => {
    try {
        const eventID = req.params.id;
        console.log(`Fetching event with ID: ${eventID}`);

        try {
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