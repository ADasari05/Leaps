import React, { useState } from 'react';

const SearchResults = ({ results, onAddToTrip }) => {
  const [selected, setSelected] = useState(null);

  const renderItem = (item, type) => {
    if (type === 'events') return `${item.name} (${item.eventType}) - ${item.location}`;
    if (type === 'travel') return `${item.type} from ${item.departure_location} to ${item.arrival_location}`;
    if (type === 'lodging') return `${item.name} (${item.type}) - ${item.location}`;
  };

  const hasResults = Object.values(results).some(items => items.length > 0);

  return (
    <div>
      {hasResults ? (
        Object.entries(results).map(([type, items]) => (
          items.length > 0 && (
            <div key={type}>
              <h3>{type.charAt(0).toUpperCase() + type.slice(1)}</h3>
              {items.map(item => (
                <div key={item.id} onClick={() => setSelected(item)}>
                  {renderItem(item, type)}
                  <button onClick={(e) => { e.stopPropagation(); onAddToTrip({ ...item, type }); }}>
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
      {selected && <div>Details: {JSON.stringify(selected)}</div>}
    </div>
  );
};

export default SearchResults;