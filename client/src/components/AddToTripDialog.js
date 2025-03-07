import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';

const AddToTripDialog = ({ open, onClose, item }) => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch('/api/trips', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
        .then(res => {
          if (!res.ok) throw new Error(`Failed to fetch trips: ${res.status}`);
          return res.json();
        })
        .then(data => {
          console.log('Trips fetched:', data);
          setTrips(Array.isArray(data) ? data : []);
          setError(null);
        })
        .catch(err => {
          console.error('Fetch error:', err);
          setTrips([]);
          setError('Could not load trips. Are you logged in?');
        })
        .finally(() => setLoading(false));
    }
  }, [open, token]);

  const addToTrip = (tripId) => {
    fetch('/api/trips/add-item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripId, itemType: item.type, itemId: item.id }),
    }).then(res => {
      if (!res.ok) throw new Error('Failed to add item');
      console.log('Item added to trip:', tripId);
      onClose();
    })
    .catch(err => {
      console.error('Add item error:', err);
      setError('Failed to add item to trip.');
    });
};

  const createTrip = () => {
    fetch('/api/trips', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
        body: JSON.stringify({
        name: `Trip with ${item.name || item.type}`,
        description: 'Auto-generated trip',
        destination: item.location || item.arrival_location || 'Unknown',
        start_date: item.start_time || item.departure || new Date().toISOString().split('T')[0],
        end_date: item.end_time || item.arrival || new Date().toISOString().split('T')[0],
        is_public: false,
      }),
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to create trip');
      return res.json();
    })
    .then(trip => {
      console.log('Trip created:', trip);
      addToTrip(trip.id);
    })
    .catch(err => {
      console.error('Create trip error:', err);
      setError('Failed to create trip.');
    });
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add {item?.name || item?.type || 'Item'} to Trip</DialogTitle>
      <DialogContent>
        {loading ? (
          <p>Loading trips...</p>
        ) : error ? (
          <p>{error}</p>
        ) : trips.length === 0 ? (
          <div>
            No trips yet. <button onClick={createTrip}>Create one now</button>
          </div>
        ) : (
          <ul>
            {trips.map(trip => (
              <li key={trip.id}>
                {trip.name} <button onClick={() => addToTrip(trip.id)}>Add</button>
              </li>
            ))}
            <li><button onClick={createTrip}>Create New Trip</button></li>
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddToTripDialog;