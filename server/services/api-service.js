const fetch = require('node-fetch');
require('dotenv').config();

const fetchExternalData = async (query, location, eventType) => {
  const results = { events: [], travel: [], lodging: [] };
  const tmApiKey = process.env.TICKETMASTER_API_KEY;
  if (!tmApiKey) {
    console.error('Ticketmaster API key not set in .env');
    return results;
  }

  // Normalize location (e.g., 'NY' to 'New York')
  const normalizedLocation = location === 'NY' ? 'New York' : location || '';

  // Build URL with optional eventType
  let tmUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${tmApiKey}&keyword=${encodeURIComponent(query || '')}`;
  if (normalizedLocation) {
    tmUrl += `&city=${encodeURIComponent(normalizedLocation)}`;
  }
  if (eventType) {
    tmUrl += `&classificationName=${encodeURIComponent(eventType)}`;
  }

  try {
    const response = await fetch(tmUrl);
    console.log('Ticketmaster URL:', tmUrl);
    if (!response.ok) throw new Error(`Ticketmaster API error: ${response.status}`);
    const data = await response.json();
    if (data._embedded?.events) {
      results.events = data._embedded.events.map(event => ({
        id: event.id,
        type: 'event',
        name: event.name,
        eventType: event.classifications?.[0]?.segment?.name || 'unknown',
        location: event._embedded?.venues?.[0]?.city?.name || normalizedLocation || 'Unknown',
        start_time: event.dates?.start?.dateTime || null,
        price: event.priceRanges?.[0]?.min || null,
      }));
    }
  } catch (error) {
    console.error('Ticketmaster API fetch failed:', error.message);
  }
  return results;
};

module.exports = { fetchExternalData };