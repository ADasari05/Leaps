import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Lodgings.css";

const Lodgings = () => {
    const [lodgings, setLodgings] = useState([]);
    const [trips, setTrips] = useState([]);
    const [selectedLodging, setSelectedLodging] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const token = localStorage.getItem('token');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchLodgings = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('http://localhost:3000/api/lodgings', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) throw new Error('Failed to fetch lodgings');

                const data = await response.json();
                setLodgings(data);
            } catch (err) {
                setError('Error loading lodgings. Please try again later.');
                console.error('Error fetching lodgings:', err);
            } finally {
                setIsLoading(false);
            }
        };

        const fetchTrips = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/trips', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) throw new Error('Failed to fetch trips');

                const data = await response.json();
                setTrips(data);
            } catch (err) {
                console.error('Error fetching trips:', err);
            }
        };

        fetchLodgings();
        fetchTrips();
    }, [token]);

    const handleAddLodgingToTrip = async (tripId) => {
        try {
            const response = await fetch('http://localhost:3000/api/trips/add-item', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ tripId, itemType: 'lodging', itemId: selectedLodging.id })
            });

            if (!response.ok) throw new Error('Failed to add lodging to trip');

            setIsModalOpen(false);
            setSelectedLodging(null);
        } catch (err) {
            console.error('Error adding lodging to trip:', err);
            setError('Error adding lodging to trip. Please try again later.');
        }
    };

    if (isLoading) {
        return <div className="lodgings"><p className="loading">Loading lodgings...</p></div>;
    }

    if (error) {
        return <div className="lodgings"><p className="error">{error}</p></div>;
    }

    return (
        <div className="lodgings">
            <h2>All Lodgings</h2>
            <ul>
                {lodgings.map(lodging => (
                    <li key={lodging.id}>
                        <h3>{lodging.name}</h3>
                        <p>{lodging.location}</p>
                        <p>{lodging.description}</p>
                        <button onClick={() => { setSelectedLodging(lodging); setIsModalOpen(true); }}>
                            Add to Trip
                        </button>
                    </li>
                ))}
            </ul>

            {isModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Select a Trip</h3>
                        <ul>
                            {trips.map(trip => (
                                <li key={trip.id}>
                                    <button onClick={() => handleAddLodgingToTrip(trip.id)}>
                                        {trip.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <button onClick={() => setIsModalOpen(false)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Lodgings;
