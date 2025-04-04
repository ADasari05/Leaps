const fetch = require('node-fetch');
require('dotenv').config();

// Haversine formula to calculate distance between two points in kilometers
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

const fetchExternalData = async (query, location, eventType, startDateTime, endDateTime, priceSort, locationSort, latitude, longitude) => {
  console.log('Received parameters:', { query, location, eventType, startDateTime, endDateTime, priceSort, locationSort, latitude, longitude }); // Debugging log
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
      results.events = data._embedded.events.map(event => {
        const price = event.priceRanges?.[0]?.min || null;
        const venue = event._embedded?.venues?.[0];
        const eventLocation = venue ? venue.location : {};
        const eventLat = eventLocation.latitude || 0;
        const eventLon = eventLocation.longitude || 0;

        // Calculate the distance from the user's location
        const distance = getDistance(latitude, longitude, eventLat, eventLon);

        return {
          id: event.id,
          type: 'event',
          name: event.name,
          eventType: event.classifications?.[0]?.segment?.name || 'unknown',
          location: venue?.city?.name || normalizedLocation || 'Unknown',
          start_time: event.dates?.start?.dateTime || null,
          price: price,
          distance: distance
        };
      });

      if (priceSort) {
        results.events = results.events.sort((a, b) => {
          if (priceSort === 'ascending') {
            return (a.price || 0) - (b.price || 0);
          } else if (priceSort === 'descending') {
            return (b.price || 0) - (a.price || 0);
          }
          return 0;
        });
      }

      if (locationSort) {
        results.events = results.events.sort((a, b) => {
          if (locationSort === 'ascending') {
            return (a.distance || 0) - (b.distance || 0);
          } else if (locationSort === 'descending') {
            return (b.distance || 0) - (a.distance || 0);
          }
          return 0;
        });
      }

    }
  } catch (error) {
    console.error('Ticketmaster API fetch failed:', error.message);
  }
  return results;
};

module.exports = { fetchExternalData };