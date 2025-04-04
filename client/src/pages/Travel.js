import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Travel.css";
import { isAuthenticated, isGuest } from "../services/authService";
import AuthPrompt from "../components/AuthPrompt";

const Travel = () => {
    const [travelItems, setTravelItems] = useState([]);
    const [trips, setTrips] = useState([]);
    const [selectedTravel, setSelectedTravel] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDrivingModalOpen, setIsDrivingModalOpen] = useState(false);
    const [method, setMethod] = useState('');
    const [departureLocation, setDepartureLocation] = useState('');
    const [destination, setDestination] = useState('');
    const [newDriving, setNewDriving] = useState({
        type: 'Driving',
        departure_location: '',
        arrival_location: '',
        departure: new Date().toISOString().split('T')[0] + 'T08:00',
        arrival: new Date().toISOString().split('T')[0] + 'T10:00',
        price: 0,
        notes: 'Personal vehicle'
    });
    const token = localStorage.getItem('token');
    const [showAuthPrompt, setShowAuthPrompt] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTravelItems = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('http://localhost:3000/api/travel', {
                    headers: isAuthenticated() ? {
                        'Authorization': `Bearer ${token}`
                    } : {} 
                });

                if (!response.ok) throw new Error('Failed to fetch travel items');

                const data = await response.json();
                setTravelItems(data);
            } catch (err) {
                setError('Error loading travel items. Please try again later.');
                console.error('Error fetching travel items:', err);
            } finally {
                setIsLoading(false);
            }
        };

        const fetchTrips = async () => {
            if (isAuthenticated()) {
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
            }
        };

        fetchTravelItems();
        fetchTrips();
    }, [token]);

    const handleOpenDrivingModal = () => {
        if (!isAuthenticated()) {
            setShowAuthPrompt(true);
        } else {
            setIsDrivingModalOpen(true);
        }
    };

    const handleDrivingInputChange = (e) => {
        const { name, value } = e.target;
        setNewDriving({
            ...newDriving,
            [name]: value
        });
    };

    const handleCreateDriving = async () => {
        if (!newDriving.departure_location || !newDriving.arrival_location) {
          alert('Please enter both departure and arrival locations');
          return;
        }
    
        try {
          const response = await fetch('http://localhost:3000/api/travel', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newDriving)
          });
          if (!response.ok) {
            throw new Error('Failed to create driving option');
          }
    
          const createdDriving = await response.json();
    
          setTravelItems((prev) => [createdDriving, ...prev]);
    
          setIsDrivingModalOpen(false);
          setNewDriving({
            type: 'Driving',
            departure_location: '',
            arrival_location: '',
            departure: new Date().toISOString().split('T')[0] + 'T08:00',
            arrival: new Date().toISOString().split('T')[0] + 'T10:00',
            price: 0,
            notes: 'Personal vehicle'
          });
    
          alert('Driving route added successfully!');
        } catch (err) {
          console.error('Error creating driving option:', err);
          setError('Failed to create driving option. Please try again.');
        }
      };

    const handleAddToTripClick = (travel) => {
        if (!isAuthenticated()) {
            setShowAuthPrompt(true);
        } else {
            setSelectedTravel(travel);
            setIsModalOpen(true);
        }
    };

    const handleAddTravelToTrip = async (tripId) => {
        try {
            const response = await fetch('http://localhost:3000/api/trips/add-item', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ tripId, itemType: 'travel', itemId: selectedTravel.id })
            });

            if (!response.ok) throw new Error('Failed to add travel to trip');

            setIsModalOpen(false);
            setSelectedTravel(null);
        } catch (err) {
            console.error('Error adding travel to trip:', err);
            setError('Error adding travel to trip. Please try again later.');
        }
    };

    const filteredTravelItems = travelItems.filter(travel => {
        const matchesMethod = method ? travel.type.toLowerCase().includes(method.toLowerCase()) : true;
        const matchesDeparture = departureLocation ? travel.departure_location.toLowerCase().includes(departureLocation.toLowerCase()) : true;
        const matchesDestination = destination ? travel.arrival_location.toLowerCase().includes(destination.toLowerCase()) : true;
        return matchesMethod && matchesDeparture && matchesDestination;
    });

    const viewDrivingDetails = (travel) => {
        navigate(`/viewdriving/${travel.id}`);
    };

    if (error) {
        return <div className="travel"><p className="error">{error}</p></div>;
    }

    return (
        <div className="travel">
            {isGuest() && (
                <div className="guest-banner">
                    <p>You're browsing as a guest. <a href="/login">Log in</a> or <a href="/signup">sign up</a> to add travel to trips.</p>
                </div>
            )}
            <h2>All Travel Items</h2>
            <div className="add-driving-section">
                <button className="add-driving-btn" onClick={handleOpenDrivingModal}>
                    + Add Driving Route
                </button>
                <p>Plan a road trip or calculate driving costs for your trip</p>
            </div>
            <div className="filter">
                <label>
                    Transportation Method:
                    <input
                        type="text"
                        value={method}
                        onChange={(e) => setMethod(e.target.value)}
                        placeholder="e.g., flight, train, bus, car rental"
                    />
                </label>
                <label>
                    Departure Location:
                    <input
                        type="text"
                        value={departureLocation}
                        onChange={(e) => setDepartureLocation(e.target.value)}
                        placeholder="Enter departure location"
                    />
                </label>
                <label>
                    Destination:
                    <input
                        type="text"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        placeholder="Enter destination"
                    />
                </label>
            </div>
            <ul>
                {filteredTravelItems.map(travel => (
                    <li key={travel.id}>
                        <h3>{travel.type}</h3>
                        <p>{travel.departure_location} to {travel.arrival_location}</p>
                        <p><strong>Departure:</strong> {new Date(travel.departure).toLocaleDateString()}</p>
                        <p><strong>Arrival:</strong> {new Date(travel.arrival).toLocaleDateString()}</p>
                        <div className="travel-actions">
                            <button onClick={() => { handleAddToTripClick(travel); }}>
                                Add to Trip
                            </button>
                                
                            {travel.type.toLowerCase() === 'driving' ? (
                                <button 
                                    className="view-details-btn"
                                    onClick={() => viewDrivingDetails(travel)}
                                >
                                    View & Calculate Costs
                                </button>
                            ) : (
                                <button onClick={() => window.open('https://www.booking.com', '_blank')}>
                                    Book Travel
                                </button>
                            )}
                        </div>
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
                                    <button onClick={() => handleAddTravelToTrip(trip.id)}>
                                        {trip.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <button onClick={() => setIsModalOpen(false)}>Close</button>
                    </div>
                </div>
            )}

            {isDrivingModalOpen && (
                <div className="modal">
                    <div className="modal-content driving-form">
                        <h3>Add Driving Route</h3>
                        <form onSubmit={(e) => { e.preventDefault(); handleCreateDriving(); }}>
                            <div className="form-group">
                                <label>Departure Location:</label>
                                <input
                                    type="text"
                                    name="departure_location"
                                    value={newDriving.departure_location}
                                    onChange={handleDrivingInputChange}
                                    placeholder="e.g., New York, NY"
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <label>Arrival Location:</label>
                                <input
                                    type="text"
                                    name="arrival_location"
                                    value={newDriving.arrival_location}
                                    onChange={handleDrivingInputChange}
                                    placeholder="e.g., Boston, MA"
                                    required
                                />
                            </div>
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Departure Date/Time:</label>
                                    <input
                                        type="datetime-local"
                                        name="departure"
                                        value={newDriving.departure}
                                        onChange={handleDrivingInputChange}
                                        required
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label>Arrival Date/Time:</label>
                                    <input
                                        type="datetime-local"
                                        name="arrival"
                                        value={newDriving.arrival}
                                        onChange={handleDrivingInputChange}
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label>Notes:</label>
                                <textarea
                                    name="notes"
                                    value={newDriving.notes}
                                    onChange={handleDrivingInputChange}
                                    placeholder="Any additional information about this driving route"
                                ></textarea>
                            </div>
                            
                            <div className="form-actions">
                                <button type="submit" className="submit-btn">Add Driving Route</button>
                                <button 
                                    type="button" 
                                    className="cancel-btn"
                                    onClick={() => setIsDrivingModalOpen(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAuthPrompt && (
                <AuthPrompt 
                    message="Please log in or create an account to add travel to trips."
                    onClose={() => setShowAuthPrompt(false)}
                />
            )}
        </div>
    );
};

export default Travel;
