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
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
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

    const filteredLodgings = lodgings.filter(lodging => {
        const checkInDate = new Date(lodging.check_in_date);
        const checkOutDate = new Date(lodging.check_out_date);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        const matchesSearchQuery = lodging.name.toLowerCase().includes(searchQuery.toLowerCase());

        if (start && end) {
            return checkInDate >= start && checkOutDate <= end && matchesSearchQuery;
        } else if (start) {
            return checkInDate >= start && matchesSearchQuery;
        } else if (end) {
            return checkOutDate <= end && matchesSearchQuery;
        } else {
            return matchesSearchQuery;
        }
    });

    if (error) {
        return <div className="lodgings"><p className="error">{error}</p></div>;
    }

    return (
        <div className="lodgings">
            <h2>All Lodgings</h2>
            <div className="filter">
                <label>
                    Start Date:
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </label>
                <label>
                    End Date:
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </label>
                <label>
                    Search:
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name"
                    />
                </label>
            </div>
            <ul>
                {filteredLodgings.map(lodging => (
                    <li key={lodging.id}>
                        <h3>{lodging.name}</h3>
                        <p>{lodging.location}</p>
                        <p>{lodging.description}</p>
                        <p><strong>Check-In:</strong> {new Date(lodging.check_in_date).toLocaleDateString()}</p>
                        <p><strong>Check-Out:</strong> {new Date(lodging.check_out_date).toLocaleDateString()}</p>
                        <button onClick={() => { setSelectedLodging(lodging); setIsModalOpen(true); }}>
                            Add to Trip
                        </button>
                        <button onClick={() => window.open('https://www.booking.com', '_blank')}>
                            Book Lodging
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
