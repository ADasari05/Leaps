import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/TripDetails.css";
//import dummyTrips from "../data/dummyTrips.json"; // Import the dummy trips

const TripDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [trip, setTrip] = useState(null);
    const [events, setEvents] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchTrip = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`http://localhost:3000/api/trips/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) throw new Error('Failed to fetch trip');

                const data = await response.json();
                setTrip(data);
                setEvents(data.events || []); // Assuming events are part of the trip data
            } catch (err) {
                setError('Error loading trip. Please try again later.');
                console.error('Error fetching trip:', err);
                //const dummyTrip = dummyTrips.find(trip => trip.id === id); // Use dummy trip if API call fails
                //setTrip(dummyTrip);
                //setEvents(dummyTrip ? dummyTrip.events || [] : []); // Use dummy events if available
            } finally {
                setIsLoading(false);
            }
        };

        fetchTrip();
    }, [id, token]);

    const handleAddEvent = () => {
        // TODO Logic to add a new event
        console.log('Add Event button clicked');
    };

    const handleEditTrip = () => {
        setIsEditing(true);
    };

    const handleSaveTrip = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/trips/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(trip)
            });

            if (!response.ok) throw new Error('Failed to save trip');

            const data = await response.json();
            setTrip(data);
            setIsEditing(false);
        } catch (err) {
            console.error('Error saving trip:', err);
            setError('Error saving trip. Please try again later.');
        }
    };

    const handleRemoveEvent = (eventId) => {
        setEvents(events.filter(event => event.id !== eventId));
    };

    const handleDeleteTrip = async () => {
        const confirmed = window.confirm('Are you sure you want to delete this trip?');
        if (confirmed) {
            try {
                const response = await fetch(`http://localhost:3000/api/trips/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) throw new Error('Failed to delete trip');

                console.log('Trip deleted successfully');
                navigate('/trips');
            } catch (err) {
                console.error('Error deleting trip:', err);
                setError('Error deleting trip. Please try again later.');
            }
        }
    };

    if (isLoading) {
        return <div className="trip-details"><p className="loading">Loading trip details...</p></div>;
    }

    if (error) {
        return <div className="trip-details"><p className="error">{error}</p></div>;
    }

    return (
        <div className="trip-details">
            {trip ? (
                <>
                    {isEditing ? (
                        <>
                            <input
                                type="text"
                                value={trip.name}
                                onChange={(e) => setTrip({ ...trip, name: e.target.value })}
                            />
                            <textarea
                                value={trip.description}
                                onChange={(e) => setTrip({ ...trip, description: e.target.value })}
                            />
                            <input
                                type="text"
                                value={trip.destination}
                                onChange={(e) => setTrip({ ...trip, destination: e.target.value })}
                            />
                            <input
                                type="date"
                                value={trip.startDate}
                                onChange={(e) => setTrip({ ...trip, startDate: e.target.value })}
                            />
                            <input
                                type="date"
                                value={trip.endDate}
                                onChange={(e) => setTrip({ ...trip, endDate: e.target.value })}
                            />
                            <button onClick={handleSaveTrip} className="save-trip-btn">Save Trip</button>
                        </>
                    ) : (
                        <>
                            <h2>{trip.name}</h2>
                            <p>{trip.description}</p>
                            <p><strong>Destination:</strong> {trip.destination}</p>
                            <p><strong>Dates:</strong> {trip.startDate} to {trip.endDate}</p>
                            <button onClick={handleEditTrip} className="edit-trip-btn">Edit Trip</button>
                        </>
                    )}
                    <h3>Events</h3>
                    <ul>
                        {events.length > 0 ? (
                            events.map(event => (
                                <li key={event.id}>
                                    <p><strong>{event.name}</strong></p>
                                    <p>{event.description}</p>
                                    <p><strong>Date:</strong> {event.date}</p>
                                    <button onClick={() => handleRemoveEvent(event.id)} className="remove-event-btn">Remove Event</button>
                                </li>
                            ))
                        ) : (
                            <p>No events found.</p>
                        )}
                    </ul>
                    <button onClick={handleAddEvent} className="add-event-btn">Add Event</button>
                    <button onClick={handleDeleteTrip} className="delete-trip-btn">Delete Trip</button>
                </>
            ) : (
                <p className="error">Trip not found.</p>
            )}
        </div>
    );
};

export default TripDetails;
