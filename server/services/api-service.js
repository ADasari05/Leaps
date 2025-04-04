const fetch = require('node-fetch');
require('dotenv').config();

const fetchExternalData = async (query, location, eventType, startDateTime, endDateTime) => {
  console.log('Received parameters:', { query, location, eventType, startDateTime, endDateTime }); // Debugging log
  const results = { events: [], travel: [], lodging: [] };
  const tmApiKey = process.env.TICKETMASTER_API_KEY;
  if (!tmApiKey) {
    console.error('Ticketmaster API key not set in .env');
    return results;
  }

  // Normalize location (e.g., 'NY' to 'New York')
  const normalizedLocation = location === 'NY' ? 'New York' : location || '';

  // Ensure startDateTime and endDateTime are in full ISO 8601 format
  const formattedStartDateTime = startDateTime || null;
  const formattedEndDateTime = endDateTime || null;

  // Build URL with optional eventType, startDateTime, and endDateTime
  let tmUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${tmApiKey}&keyword=${encodeURIComponent(query || '')}`;
  if (normalizedLocation) {
    tmUrl += `&city=${encodeURIComponent(normalizedLocation)}`;
  }
  if (eventType) {
    tmUrl += `&classificationName=${encodeURIComponent(eventType)}`;
  }
  if (formattedStartDateTime) {
    tmUrl += `&startDateTime=${formattedStartDateTime}`;
  }
  if (formattedEndDateTime) {
    tmUrl += `&endDateTime=${formattedEndDateTime}`;
  }

  console.log('Constructed Ticketmaster URL:', tmUrl); // Debugging log

  try {
    const response = await fetch(tmUrl);
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