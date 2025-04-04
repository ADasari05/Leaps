import React, { useState } from 'react';

const SearchBar = ({ onResults }) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ type: 'events', eventType: '', location: '' });

  const handleSearch = async () => {
    const url = `/api/search?q=${query}&location=${filters.location}${filters.eventType ? `&eventType=${filters.eventType}` : ''}`;
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
      <button onClick={handleSearch}>Search</button>
    </div>
  );
};

export default SearchBar;