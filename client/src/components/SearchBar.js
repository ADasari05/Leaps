import React, { useState } from 'react';

const SearchBar = ({ onResults }) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ type: 'events', eventType: '', location: '', startDateTime: '', endDateTime: '' });

  const handleSearch = async () => {
    console.log('Filters before formatting:', filters); // Debugging log to verify filters

    // Format startDateTime and endDateTime to include full ISO 8601 timestamps
    const formattedStartDateTime = filters.startDateTime
      ? `${filters.startDateTime}:00Z` // Add seconds and Z timezone
      : '';
    const formattedEndDateTime = filters.endDateTime
      ? `${filters.endDateTime}:59Z` // Add seconds and Z timezone
      : '';

    const url = `/api/search?q=${query}&location=${filters.location}${filters.eventType ? `&eventType=${filters.eventType}` : ''}${formattedStartDateTime ? `&startDateTime=${encodeURIComponent(formattedStartDateTime)}` : ''}${formattedEndDateTime ? `&endDateTime=${encodeURIComponent(formattedEndDateTime)}` : ''}`;
    console.log('Constructed URL:', url); // Debugging log to verify URL

    console.log(url);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Fetch failed with status: ${res.status}`);
      const data = await res.json();
      console.log('Search results:', data);
      onResults(data);
    } catch (error) {
      console.error('Search fetch error:', error);
      onResults({ events: [], travel: [], lodging: [] });
    }
  };

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search events (e.g., concert)"
      />
      <input
        placeholder="Location (e.g., New York)"
        onChange={(e) => setFilters({ ...filters, location: e.target.value })}
      />
      <input
        placeholder="Event Type (optional, e.g., music)"
        onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
      />
      <input
        type="datetime-local"
        placeholder="Start Date"
        onChange={(e) => setFilters({ ...filters, startDateTime: e.target.value })}
      />
      <input
        type="datetime-local"
        placeholder="End Date"
        onChange={(e) => setFilters({ ...filters, endDateTime: e.target.value })}
      />
      <button onClick={handleSearch}>Search</button>
    </div>
  );
};

export default SearchBar;