const express = require('express');
const router = express.Router();
const apiService = require('../services/api-service');
const auth = require('../middleware/auth'); 
const db = require('../config/db');      

router.get('/', (req, res, next) => {
  req.allowGuest = true;
  next();
}, auth, async (req, res) => {
  const { q, location, eventType, startDateTime, endDateTime, priceSort, locationSort, latitude, longitude} = req.query; // Use startDateTime and endDateTime
  console.log('Query parameters:', { q, location, eventType, startDateTime, endDateTime, priceSort, locationSort, latitude, longitude }); // Debugging log

  console.log("q = %s", q);
  console.log("location: %s", location);
  console.log("event type %s", eventType);
  try {
    const results = { events: [], travel: [], lodging: [] };
    if (q || location || eventType || startDateTime || endDateTime || priceSort || locationSort || latitude || longitude) {
      const externalResults = await apiService.fetchExternalData(q, location, eventType, startDateTime, endDateTime, priceSort, locationSort, latitude, longitude); // Pass startDateTime and endDateTime
      results.events = externalResults.events;
    }

    const searchTerm = `%${q || ''}%`;
    const customRes = await db.query(
      `SELECT id, name, description, location, start_time, price, type
         FROM customevents
        WHERE public = TRUE
          AND (name ILIKE $1 OR location ILIKE $1)`,
      [searchTerm]
    );

    // 3) Transform them into your front-end shape and append
    const customEvents = customRes.rows.map(e => ({
      id:          e.id,
      name:        e.name,
      description: e.description,
      location:    e.location,
      date:        e.start_time.toISOString().split('T')[0],
      time:        new Date(e.start_time)
                     .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      price:       e.price === 'N/A' ? 'Free' : `$${e.price}`,
      image:       null,           // or store a custom image URL if you add that column
      url:         null,
      eventType:   e.type
    }));

    results.events.push(...customEvents);
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;