import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import LeapsLogo from "../assets/Leapspng.png";
import "../styles/Trips.css";
import "../components/DeleteTripConfirmation.css"
import ConfirmDelete from "../components/DeleteTripConfirmation";

const Trips = () => {
    const [trips, setTrips] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    /*Setup for the delete trip popup window*/


    useEffect(() => {
        const fetchTrips = async () => {
            setIsLoading(true);

            try {
                const response = await fetch("/api/trips", {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) throw new Error('Failed to fetch trips');

                const data = await response.json();
                setTrips(Array.isArray(data) ? data : []); // Ensure array
            } catch (err) {
                setError('Error loading trips. Please try again later.');
                console.error('Error fetching trips:', err);
                //setTrips(dummyTrips); // Use dummy trips if API call fails
            } finally {
                setIsLoading(false);
            }
        };

        fetchTrips();
    }, [token]);

    return (
        <div className="trips-container">
            <img src={LeapsLogo} alt="Leaps Logo" className="logo" />
            <h2>Your Trips</h2>

            {error && <p className="error">{error}</p>}

            {isLoading ? (
                <p className="loading">Loading trips...</p>
            ) : (
                <div className="trips-list"> 
                    {trips.length > 0 ? (
                        trips.map(trip => (
                            <div key={trip.id} className="trip-item">
                                <Link to={`/trips/${trip.id}`}>
                                    <h3>{trip.name}</h3>
                                </Link>
                                <p>{trip.description}</p>
                                <p><strong>Destination:</strong> {trip.destination}</p>
                                <p><strong>Dates:</strong> {trip.startDate} to {trip.endDate}</p>
                                <ConfirmDelete id={trip.id} token={token}/>
                            </div>
                        ))
                    ) : (
                        <p style={{ color: 'black' }}>No trips found.</p>
                    )}
                </div>
            )}

            <button onClick={() => navigate("/createtrip")} className="create-trip-btn">
                Create New Trip
            </button>
        </div>
    );
};

export default Trips;
