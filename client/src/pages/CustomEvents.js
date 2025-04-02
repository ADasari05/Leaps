import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Events.css";

function CustomEvents() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const token = localStorage.getItem("token");

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await fetch("/api/events", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await response.json();

                if (response.ok) {
                    setEvents(data);
                } else {
                    setError(data.message);
                }
            } catch (err) {
                setError("Failed to load events.");
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    return (
        <div className="events-container">
            <h2>Custom Events</h2>
            <p className="description">
                Create and manage your own custom events easily
            </p>

            <div className="button-container">
                <Link to="/create-event" className="create-event-btn">
                    Create a Custom Event
                </Link>
            </div>

            {loading && <p>Loading events...</p>}
            {error && <p className="error">{error}</p>}

            <div className="events-grid">
                {events.length > 0 ? (
                    events.map((event) => (
                        <div key={event.id} className="event-card">
                            <h3>{event.name}</h3>
                            <p><strong>Location:</strong> {event.location}</p>
                            <p><strong>Date:</strong> {event.date}</p>
                            <p><strong>Time:</strong> {event.time}</p>
                            <p><strong>Price:</strong> {event.price === "N/A" ? "Free" : `$${event.price}`}</p>
                            <p className="event-description">{event.description}</p>
                        </div>
                    ))
                ) : (
                    !loading && <p>No events found.</p>
                )}
            </div>
        </div>
    );
}

export default CustomEvents;
