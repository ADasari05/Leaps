// src/pages/Travel.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Travel.css";
import { isAuthenticated, isGuest } from "../services/authService";
import AuthPrompt from "../components/AuthPrompt";
import { findSimilarItems, isBetterDeal, sortByPrice, generateComparisonData } from "../utils/comparisonUtils";

// Dummy travel data
const dummyTravelItems = [
    {
        id: "2001",
        type: "Flight",
        price: 350.00,
        departure: "2025-05-01T08:00:00",
        departure_location: "New York, NY",
        arrival: "2025-05-01T11:30:00",
        arrival_location: "Chicago, IL",
        airline: "Delta Airlines",
        flight_number: "DL1234",
        duration: "3h 30m",
        stops: 0
    },
    {
        id: "2002",
        type: "Flight",
        price: 420.00,
        departure: "2025-05-01T10:00:00",
        departure_location: "New York, NY",
        arrival: "2025-05-01T13:30:00",
        arrival_location: "Chicago, IL",
        airline: "American Airlines",
        flight_number: "AA5678",
        duration: "3h 30m",
        stops: 0
    },
    {
        id: "2003",
        type: "Flight",
        price: 290.00,
        departure: "2025-05-01T06:00:00",
        departure_location: "New York, NY",
        arrival: "2025-05-01T09:30:00",
        arrival_location: "Chicago, IL",
        airline: "United Airlines",
        flight_number: "UA9012",
        duration: "3h 30m",
        stops: 0
    },
    {
        id: "2004",
        type: "Flight",
        price: 380.00,
        departure: "2025-05-01T16:00:00",
        departure_location: "New York, NY",
        arrival: "2025-05-01T19:30:00",
        arrival_location: "Chicago, IL",
        airline: "Southwest Airlines",
        flight_number: "WN3456",
        duration: "3h 30m",
        stops: 0
    },
    {
        id: "2005",
        type: "Train",
        price: 120.00,
        departure: "2025-05-01T09:00:00",
        departure_location: "Boston, MA",
        arrival: "2025-05-01T13:00:00",
        arrival_location: "New York, NY",
        train_company: "Amtrak",
        train_number: "AM7890",
        duration: "4h 00m",
        stops: 2
    },
    {
        id: "2006",
        type: "Bus",
        price: 60.00,
        departure: "2025-05-01T08:00:00",
        departure_location: "Washington DC",
        arrival: "2025-05-01T12:00:00",
        arrival_location: "New York, NY",
        bus_company: "Greyhound",
        bus_number: "GH1234",
        duration: "4h 00m",
        stops: 3
    },
    {
        id: "2007",
        type: "Flight",
        price: 650.00,
        departure: "2025-06-15T10:00:00",
        departure_location: "Los Angeles, CA",
        arrival: "2025-06-15T18:00:00",
        arrival_location: "New York, NY",
        airline: "JetBlue",
        flight_number: "B6789",
        duration: "5h 00m",
        stops: 1
    },
    {
        id: "2008",
        type: "Train",
        price: 90.00,
        departure: "2025-05-01T07:00:00",
        departure_location: "Boston, MA",
        arrival: "2025-05-01T11:00:00",
        arrival_location: "New York, NY",
        train_company: "Amtrak",
        train_number: "AM4567",
        duration: "4h 00m",
        stops: 0
    }
];

const Travel = () => {
    const [travelItems, setTravelItems] = useState([]);
    const [trips, setTrips] = useState([]);
    const [selectedTravel, setSelectedTravel] = useState(null);
    const [selectedTripId, setSelectedTripId] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
    const [method, setMethod] = useState('');
    const [departureLocation, setDepartureLocation] = useState('');
    const [destination, setDestination] = useState('');
    const [sortOrder, setSortOrder] = useState('price_asc');
    const [similarTravelOptions, setSimilarTravelOptions] = useState([]);
    const [showAuthPrompt, setShowAuthPrompt] = useState(false);
    const token = localStorage.getItem('token');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTravelItems = async () => {
            setIsLoading(true);
            try {
                // Using dummy data instead of API call
                setTravelItems(dummyTravelItems);
            } catch (err) {
                setError('Error loading travel options. Please try again later.');
                console.error('Error fetching travel items:', err);
            } finally {
                setIsLoading(false);
            }
        };

        const fetchTrips = async () => {
            if (isAuthenticated()) {
                try {
                    const response = await fetch('/api/trips', {
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
            if (!isAuthenticated()) {
                setIsModalOpen(false);
                return;
            }

            const response = await fetch('/api/trips/add-item', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ tripId, itemType: 'travel', itemId: selectedTravel.id })
            });

            if (!response.ok) throw new Error('Failed to add travel to trip');

            setSelectedTripId(tripId);
            setIsModalOpen(false);
            alert('Travel option added to trip successfully!');
        } catch (err) {
            console.error('Error adding travel to trip:', err);
            setError('Error adding travel to trip. Please try again later.');
        }
    };

    const handleCompare = (travel) => {
        setSelectedTravel(travel);
        
        // Find similar travel options
        const similar = findSimilarItems(travelItems, travel);
        const sortedSimilar = sortByPrice(similar, 'travel');
        
        setSimilarTravelOptions(sortedSimilar);
        setIsComparisonModalOpen(true);
    };

    const handleSwapTravel = async (newTravel) => {
        if (!selectedTripId) {
            setError('Please select a trip first');
            return;
        }

        try {
            if (!isAuthenticated()) return;

            // First remove the old travel option
            const removeResponse = await fetch(`/api/trips/items/${selectedTripId}/travel/${selectedTravel.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!removeResponse.ok) throw new Error('Failed to remove current travel option');

            // Then add the new travel option
            const addResponse = await fetch('/api/trips/add-item', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ tripId: selectedTripId, itemType: 'travel', itemId: newTravel.id })
            });

            if (!addResponse.ok) throw new Error('Failed to add new travel option');

            setIsComparisonModalOpen(false);
            setSelectedTravel(null);
            alert('Travel option swapped successfully!');
        } catch (err) {
            console.error('Error swapping travel option:', err);
            setError('Error swapping travel option. Please try again later.');
        }
    };
    
    const filteredTravelItems = travelItems.filter(travel => {
        const matchesMethod = method ? travel.type.toLowerCase().includes(method.toLowerCase()) : true;
        const matchesDeparture = departureLocation ? 
            travel.departure_location.toLowerCase().includes(departureLocation.toLowerCase()) : true;
        const matchesDestination = destination ? 
            travel.arrival_location.toLowerCase().includes(destination.toLowerCase()) : true;
        return matchesMethod && matchesDeparture && matchesDestination;
    });

    const sortedTravelItems = [...filteredTravelItems].sort((a, b) => {
        switch (sortOrder) {
            case 'price_asc':
                return a.price - b.price;
            case 'price_desc':
                return b.price - a.price;
            case 'duration_asc':
                return (a.duration || '').localeCompare(b.duration || '');
            case 'departure_asc':
                return new Date(a.departure) - new Date(b.departure);
            default:
                return 0;
        }
    });

    const formatDateTime = (dateTimeStr) => {
        const date = new Date(dateTimeStr);
        return date.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short', 
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
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
            
            <h2>Travel Options</h2>
            
            <div className="filter-container">
                <div className="filter">
                    <label>
                        Transportation Method:
                        <input
                            type="text"
                            value={method}
                            onChange={(e) => setMethod(e.target.value)}
                            placeholder="e.g., flight, train, bus"
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
                <div className="sort-options">
                    <label>
                        Sort by:
                        <select 
                            value={sortOrder} 
                            onChange={(e) => setSortOrder(e.target.value)}
                        >
                            <option value="price_asc">Price: Low to High</option>
                            <option value="price_desc">Price: High to Low</option>
                            <option value="duration_asc">Duration: Shortest First</option>
                            <option value="departure_asc">Departure: Earliest First</option>
                        </select>
                    </label>
                </div>
            </div>

            {isLoading ? (
                <p className="loading">Loading travel options...</p>
            ) : (
                <div className="travel-grid">
                    {sortedTravelItems.map(travel => (
                        <div key={travel.id} className="travel-card">
                            <div className="travel-header">
                                <h3>{travel.type}</h3>
                                <span className="travel-price">${travel.price}</span>
                            </div>
                            
                            <div className="travel-route">
                                <div className="travel-locations">
                                    <span className="from">{travel.departure_location}</span>
                                    <span className="arrow">→</span>
                                    <span className="to">{travel.arrival_location}</span>
                                </div>
                                
                                <div className="travel-times">
                                    <div className="departure">
                                        <span className="label">Departure:</span>
                                        <span className="time">{formatDateTime(travel.departure)}</span>
                                    </div>
                                    <div className="arrival">
                                        <span className="label">Arrival:</span>
                                        <span className="time">{formatDateTime(travel.arrival)}</span>
                                    </div>
                                </div>
                                
                                <div className="travel-details">
                                    {travel.airline && <span className="detail-item">Airline: {travel.airline}</span>}
                                    {travel.flight_number && <span className="detail-item">Flight: {travel.flight_number}</span>}
                                    {travel.train_company && <span className="detail-item">Company: {travel.train_company}</span>}
                                    {travel.train_number && <span className="detail-item">Train: {travel.train_number}</span>}
                                    {travel.bus_company && <span className="detail-item">Company: {travel.bus_company}</span>}
                                    {travel.bus_number && <span className="detail-item">Bus: {travel.bus_number}</span>}
                                    {travel.duration && <span className="detail-item">Duration: {travel.duration}</span>}
                                    <span className="detail-item">Stops: {travel.stops || 0}</span>
                                </div>
                            </div>
                            
                            <div className="travel-actions">
                                <button 
                                    onClick={() => handleAddToTripClick(travel)}
                                    className="add-to-trip-btn"
                                >
                                    Add to Trip
                                </button>
                                <button 
                                    onClick={() => handleCompare(travel)}
                                    className="compare-btn"
                                >
                                    Compare Options
                                </button>
                                <button 
                                    onClick={() => window.open('https://www.expedia.com', '_blank')}
                                    className="book-btn"
                                >
                                    Book Now
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add to Trip Modal */}
            {isModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <h3>Select a Trip</h3>
                        {trips.length > 0 ? (
                            <div className="trip-list">
                                {trips.map(trip => (
                                    <div key={trip.id} className="trip-option">
                                        <div className="trip-details">
                                            <h4>{trip.name}</h4>
                                            <p>{trip.destination}</p>
                                            <p>{new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}</p>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setSelectedTripId(trip.id);
                                                handleAddTravelToTrip(trip.id);
                                            }}
                                        >
                                            Select
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>No trips available. Create a trip first.</p>
                        )}
                        <button onClick={() => setIsModalOpen(false)} className="cancel-btn">Close</button>
                    </div>
                </div>
            )}

            {/* Comparison Modal */}
            {isComparisonModalOpen && selectedTravel && (
                <div className="modal comparison-modal">
                    <div className="modal-content">
                        <h3>Compare Travel Options</h3>
                        
                        <div className="selected-item">
                            <h4>Your Selected Option</h4>
                            <div className="item-details">
                                <h5>{selectedTravel.type} - {selectedTravel.departure_location} to {selectedTravel.arrival_location}</h5>
                                <p className="item-price">${selectedTravel.price}</p>
                                <p className="item-time">Departure: {formatDateTime(selectedTravel.departure)}</p>
                                <p className="item-time">Arrival: {formatDateTime(selectedTravel.arrival)}</p>
                                {selectedTravel.duration && <p className="item-duration">Duration: {selectedTravel.duration}</p>}
                            </div>
                        </div>
                        
                        <h4>Similar Options</h4>
                        
                        {similarTravelOptions.length > 0 ? (
                            <div className="similar-items">
                                {similarTravelOptions.map(travel => {
                                    const comparison = generateComparisonData(travel, selectedTravel);
                                    const isBetter = isBetterDeal(travel, selectedTravel);
                                    
                                    return (
                                        <div 
                                            key={travel.id} 
                                            className={`comparison-item ${isBetter ? 'better-deal' : ''}`}
                                        >
                                            <div className="item-details">
                                                <h5>{travel.type} - {travel.airline || travel.train_company || travel.bus_company}</h5>
                                                <p className="item-price">${travel.price}</p>
                                                <p className="item-time">Departure: {formatDateTime(travel.departure)}</p>
                                                <p className="item-time">Arrival: {formatDateTime(travel.arrival)}</p>
                                                {travel.duration && <p className="item-duration">Duration: {travel.duration}</p>}
                                                
                                                {isBetter && (
                                                    <div className="savings-badge">
                                                        {comparison.savings}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="comparison-actions">
                                                <button 
                                                    onClick={() => {
                                                        if (!selectedTripId) {
                                                            setError('Please add the original option to a trip first');
                                                            setIsComparisonModalOpen(false);
                                                            return;
                                                        }
                                                        handleSwapTravel(travel);
                                                    }}
                                                    className="swap-btn"
                                                >
                                                    Swap Selection
                                                </button>
                                                <button 
                                                    onClick={() => window.open('https://www.expedia.com', '_blank')}
                                                    className="book-btn"
                                                >
                                                    Book Instead
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p>No similar travel options found for this route.</p>
                        )}
                        
                        <button onClick={() => setIsComparisonModalOpen(false)} className="cancel-btn">Close</button>
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