import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LeapsLogo from '../assets/Leapspng.png';
import AddToTripDialog from '../components/AddToTripDialog';

const ViewEvent = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvent = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/events/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch event');
        const data = await response.json();
        setEvent(data);
      } catch (err) {
        console.error('Error fetching event:', err);
        setError('Error loading event. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvent();
  }, [id, token]);

  if (isLoading) return <p>Loading event details...</p>;
  if (error) return <p>{error}</p>;
  if (!event) return <p>Event not found.</p>;

  return (
    <div className="view-event">
      <img src={LeapsLogo} alt="Leaps Logo" className="logo" />
      <div className="event-header">
        <h2>{event.name}</h2>
        <button onClick={() => setDialogOpen(true)}>Add to Trip</button>
      </div>
      <div className="event-details">
        <h3>{event.location}</h3>
        <h3>{event.date} | {event.time}</h3>
      </div>
      <p>{event.description}</p>
      <h4>Price History</h4>
      <div className="event-actions">
        <h4>Reviews</h4>
        <h4>Price</h4>
        <button onClick={() => window.open(event.url || 'https://www.ticketmaster.com', '_blank')}>
          {event.price || 'Buy Now'}
        </button>
      </div>

      <AddToTripDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        item={{ ...event, type: 'events', id: event.id }}
      />
    </div>
  );
};

export default ViewEvent;