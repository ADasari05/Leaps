import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SearchResults = ({ results, onAddToTrip }) => {
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  const renderItem = (item, type) => {
    if (type === 'events') return `${item.name} (${item.eventType}) - ${item.location}`;
    if (type === 'travel') return `${item.type} from ${item.departure_location} to ${item.arrival_location}`;
    if (type === 'lodging') return `${item.name} (${item.type}) - ${item.location}`;
    return null;
  };

  const hasResults = Object.values(results).some(items => items.length > 0);

  return (
    <div className="search-results">
      {hasResults ? (
        Object.entries(results).map(([type, items]) => (
          items.length > 0 && (
            <div key={type}>
              <h3>{type.charAt(0).toUpperCase() + type.slice(1)}</h3>
              {items.map(item => (
                <div
                  key={item.id}
                  onClick={() => {
                    console.log('Event clicked:', item);
                    setSelected(item);
                    if (type === 'events') navigate(`/event/${item.id}`);
                  }}
                  style={{ cursor: 'pointer', padding: '10px', borderBottom: '1px solid #ddd' }}
                >
                  {renderItem(item, type)}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Add to Trip clicked:', item);
                      onAddToTrip({ ...item, type });
                    }}
                    style={{ marginLeft: '10px' }}
                  >
                    Add to Trip
                  </button>
                </div>
              ))}
            </div>
          )
        ))
      ) : (
        <p>No results found. Try a different query or location.</p>
      )}
      {selected && !navigate.pathname?.includes('/event') && (
        <div style={{ marginTop: '20px' }}>
          Details: {JSON.stringify(selected)}
        </div>
      )}
    </div>
  );
};

export default SearchResults;