import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';

const AddToTripDialog = ({ open, onClose, item }) => {
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    if (open) {
      fetch('/api/trips')
        .then(res => res.json())
        .then(data => setTrips(data));
    }
  }, [open]);

  const addToTrip = (tripId) => {
    fetch('/api/trips/add-item', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripId, itemType: item.type, itemId: item.id }),
    }).then(() => onClose());
  };

  const createTrip = () => {
    fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Trip with ${item.name || item.type}`,
        destination: item.location || item.arrival_location,
        start_date: item.start_time || item.departure || new Date().toISOString().split('T')[0],
        end_date: item.end_time || item.arrival || new Date().toISOString().split('T')[0],
      }),
    })
      .then(res => res.json())
      .then(trip => addToTrip(trip.id));
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add {item.name || item.type} to Trip</DialogTitle>
      <DialogContent>
        {trips.length === 0 ? (
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