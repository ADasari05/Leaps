import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import dummyTrips from "../data/dummyTrips.json"; // Import the dummy trips

const TripDetails = () => {
    const { id } = useParams();
    const [trip, setTrip] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
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
            } catch (err) {
                setError('Error loading trip. Please try again later.');
                console.error('Error fetching trip:', err);
                const dummyTrip = dummyTrips.find(trip => trip.id === id); // Use dummy trip if API call fails
                setTrip(dummyTrip);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTrip();
    }, [id, token]);

    if (isLoading) {
        return <p className="loading">Loading trip details...</p>;
    }

    if (error) {
        return <p className="error">{error}</p>;
    }

    return (
        <div className="trip-details">
            {trip ? (
                <>
                    <h2>{trip.name}</h2>
                    <p>{trip.description}</p>
                    <p><strong>Destination:</strong> {trip.destination}</p>
                    <p><strong>Dates:</strong> {trip.startDate} to {trip.endDate}</p>
                    {/* Add form or buttons for editing the trip details here */}
                </>
            ) : (
                <p className="error">Trip not found.</p>
            )}
        </div>
    );
};

export default TripDetails;
