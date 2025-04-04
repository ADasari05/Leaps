const express = require('express');
const router = express.Router();
const apiService = require('../services/api-service');
const auth = require('../middleware/auth'); 

router.get('/', (req, res, next) => {
  req.allowGuest = true;
  next();
}, auth, async (req, res) => {
  const { q, location, eventType } = req.query;
  console.log("q = %s", q);
  console.log("location: %s", location);
  console.log("event type %s", eventType);
  try {
    const results = { events: [], travel: [], lodging: [] };
    if (q || location || eventType) {
      const externalResults = await apiService.fetchExternalData(q, location, eventType);
      results.events = externalResults.events;
    }
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;