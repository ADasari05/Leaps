const express = require('express');
const router = express.Router();
const apiService = require('../services/api-service');
const auth = require('../middleware/auth'); 

router.get('/', (req, res, next) => {
  req.allowGuest = true;
  next();
}, auth, async (req, res) => {
  const { q, location, eventType, startDateTime, endDateTime } = req.query; // Use startDateTime and endDateTime
  console.log('Query parameters:', { q, location, eventType, startDateTime, endDateTime }); // Debugging log

  try {
    const results = { events: [], travel: [], lodging: [] };
    if (q || location || eventType || startDateTime || endDateTime) {
      const externalResults = await apiService.fetchExternalData(q, location, eventType, startDateTime, endDateTime); // Pass startDateTime and endDateTime
      results.events = externalResults.events;
    }
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;