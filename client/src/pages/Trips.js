import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import LeapsLogo from "../assets/Leapspng.png";
import "../styles/Trips.css";
import "../components/DeleteTripConfirmation.css"
import ConfirmDelete from "../components/DeleteTripConfirmation";

const Trips = () => {
    const [refresh, setRefresh] = useState(false);
    const [trips, setTrips] = useState([]);
    const [pastTrips, setPastTrips] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    /*Setup for the delete trip popup window*/

    const handleComplete = async (trip) => {
        try {
            const response = await fetch(`/api/trips/complete/${trip.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(trip)
            });

            if (!response.ok) throw new Error('Failed to save trip');

            const data = await response.json();
            setRefresh(prev => !prev); // This will trigger a re-render

        } catch (err) {
            console.error('Error saving trip:', err);
            setError('Error saving trip. Please try again later.');
        }
    }

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
                console.log(data);
                if (data.length === 0) {
                    console.log("data is empty");
                    console.log(data);
                }
                console.log("is array? %b", Array.isArray(data));
                setTrips(Array.isArray(data) ? data : []); // Ensure array
                if (trips.length === 0) {
                    console.log("trips array is empty");
                    console.log(trips);
                }
            } catch (err) {
                setError('Error loading trips. Please try again later.');
                console.error('Error fetching trips:', err);
                //setTrips(dummyTrips); // Use dummy trips if API call fails
            } finally {
                setIsLoading(false);
            }
        };

        fetchTrips();
    }, [token, refresh]);

    if (!token) {
        return <div className="text-container">Please login to view your trips.</div>;
    }
    return (
        <div className="trips-container">
            <img src={LeapsLogo} alt="Leaps Logo" className="logo" />
            <h1>Your Trips</h1>

            {error && <p className="error">{error}</p>}

            {isLoading ? (
                <p className="loading">Loading trips...</p>
            ) : (
                <div className="trips-list">
                    <h2>Upcoming Trips</h2>
                    {trips.length > 0 ? (
                        trips.map(trip => (
                            trip.current && (<div key={trip.id} className="trip-item">
                                <Link to={`/trips/${trip.id}`}>
                                    <h3>{trip.name}</h3>
                                </Link>
                                <p>{trip.description}</p>
                                <p><strong>Destination:</strong> {trip.destination}</p>
                                <p><strong>Dates:</strong> 
                                    {trip.start_date ? new Date(trip.start_date).toISOString().split('T')[0] : ''} to 
                                    {trip.end_date ? new Date(trip.end_date).toISOString().split('T')[0] : ''}
                                </p>
                                <ConfirmDelete id={trip.id} token={token}/>
                                <button
                                    onClick={() => handleComplete(trip)}
                                >
                                    Complete
                                </button>
                            </div>)
                        ))
                    ) : (
                        <p style={{ color: 'black' }}>No trips found.</p>
                    )}
                </div>
            )}

            <button onClick={() => navigate("/createtrip")} className="create-trip-btn">
                Create New Trip
            </button>
            <div className="trips-list">
                <h2> Past Trips </h2>
                {trips.length > 0 ? (
                        trips.map(trip => (
                            !trip.current && (<div key={trip.id} className="trip-item">
                                <Link to={`/trips/${trip.id}`}>
                                    <h3>{trip.name}</h3>
                                </Link>
                                <p>{trip.description}</p>
                                <p><strong>Destination:</strong> {trip.destination}</p>
                                <p><strong>Dates:</strong> 
                                    {trip.start_date ? new Date(trip.start_date).toISOString().split('T')[0] : ''} to 
                                    {trip.end_date ? new Date(trip.end_date).toISOString().split('T')[0] : ''}
                                </p>
                                <ConfirmDelete id={trip.id} token={token}/>
                            </div>)
                        ))
                    ) : (
                        <p style={{ color: 'black' }}>No trips found.</p>
                    )}
            </div>
        </div>
    );
};

export default Trips;
