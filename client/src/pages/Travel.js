import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Travel.css";
import { findSimilarItems, isBetterDeal, calculateSavings } from "../utils/comparisonUtils";

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
    const [travelOptions, setTravelOptions] = useState([]);
    const [trips, setTrips] = useState([]);
    const [selectedTravel, setSelectedTravel] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
    const [similarOptions, setSimilarOptions] = useState([]);
    const [selectedTripId, setSelectedTripId] = useState(null);
    const [departureFilter, setDepartureFilter] = useState("");
    const [destinationFilter, setDestinationFilter] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const token = localStorage.getItem('token');
    const navigate = useNavigate();

    // Fetch travel options and trips
    useEffect(() => {
        // Use dummy data for now
        setTravelOptions(dummyTravelItems);
        setIsLoading(false);
        
        // Fetch trips if authenticated
        const fetchTrips = async () => {
            if (token) {
                try {
                    const response = await fetch('/api/trips', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        setTrips(Array.isArray(data) ? data : []);
                    }
                } catch (err) {
                    console.error('Error fetching trips:', err);
                }
            }
        };
        
        fetchTrips();
    }, [token]);

    const handleAddToTrip = (travel) => {
        setSelectedTravel(travel);
        setIsModalOpen(true);
    };

    const confirmAddToTrip = async (tripId) => {
        try {
            // Add to trip API call
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
            alert("Travel added to trip!");
        } catch (err) {
            setError("Failed to add travel to trip");
        }
    };

    const handleCompare = (travel) => {
        setSelectedTravel(travel);
        
        // Find similar travel options for the same route
        const similar = findSimilarItems(travelOptions, travel);
        
        // Sort by price
        const sorted = [...similar].sort((a, b) => a.price - b.price);
        
        setSimilarOptions(sorted);
        setIsCompareModalOpen(true);
    };

    const handleSwap = async (newTravel) => {
        if (!selectedTripId) {
            alert("Please add your original selection to a trip first");
            setIsCompareModalOpen(false);
            return;
        }
        
        try {
            // First remove the old travel option
            const removeResponse = await fetch(`/api/trips/items/${selectedTripId}/travel/${selectedTravel.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Then add the new travel option
            const addResponse = await fetch('/api/trips/add-item', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ tripId: selectedTripId, itemType: 'travel', itemId: newTravel.id })
            });
            
            alert(`Swapped ${selectedTravel.type} with ${newTravel.type}`);
            setIsCompareModalOpen(false);
        } catch (err) {
            setError("Failed to swap travel option");
        }
    };

    const formatDateTime = (dateTimeStr) => {
        const date = new Date(dateTimeStr);
        return date.toLocaleString();
    };

    // Filter travel options based on user input
    const filteredTravelOptions = travelOptions.filter(travel => {
        const matchesDeparture = departureFilter 
            ? travel.departure_location.toLowerCase().includes(departureFilter.toLowerCase()) 
            : true;
        const matchesDestination = destinationFilter 
            ? travel.arrival_location.toLowerCase().includes(destinationFilter.toLowerCase()) 
            : true;
        const matchesType = typeFilter 
            ? travel.type === typeFilter 
            : true;
        
        return matchesDeparture && matchesDestination && matchesType;
    });

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="travel-page">
            <h1>Travel Options</h1>
            
            {/* Filter controls */}
            <div className="filters">
                <input 
                    type="text" 
                    placeholder="Enter departure location" 
                    value={departureFilter}
                    onChange={(e) => setDepartureFilter(e.target.value)}
                />
                <input 
                    type="text" 
                    placeholder="Enter destination" 
                    value={destinationFilter}
                    onChange={(e) => setDestinationFilter(e.target.value)}
                />
                <select 
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                >
                    <option value="">All Types</option>
                    <option value="Flight">Flight</option>
                    <option value="Train">Train</option>
                    <option value="Bus">Bus</option>
                </select>
            </div>
            
            {/* Travel List */}
            <div className="travel-list">
                {filteredTravelOptions.map(travel => (
                    <div key={travel.id} className="travel-item">
                        <div className="travel-header">
                            <h3 className="travel-type">{travel.type}</h3>
                            <p className="travel-price">${travel.price}</p>
                        </div>
                        
                        <div className="travel-details">
                            <div className="travel-route">
                                <p className="from-label">From:</p>
                                <p className="from-value">{travel.departure_location}</p>
                                <p className="to-label">To:</p>
                                <p className="to-value">{travel.arrival_location}</p>
                            </div>
                            
                            <div className="travel-times">
                                <p className="departure-label">Departure:</p>
                                <p className="departure-value">{formatDateTime(travel.departure)}</p>
                                <p className="arrival-label">Arrival:</p>
                                <p className="arrival-value">{formatDateTime(travel.arrival)}</p>
                            </div>
                            
                            {travel.airline && (
                                <p className="travel-airline">Airline: {travel.airline}</p>
                            )}
                            {travel.train_company && (
                                <p className="travel-company">Company: {travel.train_company}</p>
                            )}
                            {travel.bus_company && (
                                <p className="travel-company">Company: {travel.bus_company}</p>
                            )}
                            {travel.duration && (
                                <p className="travel-duration">Duration: {travel.duration}</p>
                            )}
                        </div>
                        
                        <div className="travel-buttons">
                            <button 
                                className="add-trip-btn"
                                onClick={() => handleAddToTrip(travel)}
                            >
                                Add to Trip
                            </button>
                            <button 
                                className="compare-btn"
                                onClick={() => handleCompare(travel)}
                            >
                                Compare Similar
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Add to Trip Modal */}
            {isModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Select a Trip</h2>
                        <div className="trips-list">
                            {trips.length > 0 ? (
                                trips.map(trip => (
                                    <div key={trip.id} className="trip-item">
                                        <p className="trip-name"><strong>{trip.name}</strong></p>
                                        <p className="trip-destination">{trip.destination}</p>
                                        <button 
                                            className="select-trip-btn"
                                            onClick={() => confirmAddToTrip(trip.id)}
                                        >
                                            Select
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="no-trips-message">No trips found. Create a trip first.</p>
                            )}
                        </div>
                        <button 
                            className="close-modal-btn"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
            
            {/* Comparison Modal */}
            {isCompareModalOpen && selectedTravel && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Similar Options</h2>
                        <p className="compare-route">
                            <strong>Route:</strong> {selectedTravel.departure_location} to {selectedTravel.arrival_location}
                        </p>
                        
                        <div className="selected-travel">
                            <h3>Your Selection</h3>
                            <p className="selected-type-price"><strong>{selectedTravel.type}</strong> - ${selectedTravel.price}</p>
                            <p className="selected-departure">Departure: {formatDateTime(selectedTravel.departure)}</p>
                        </div>
                        
                        <div className="similar-options">
                            {similarOptions.length > 0 ? (
                                similarOptions.map(option => {
                                    const betterDeal = isBetterDeal(option, selectedTravel);
                                    const savings = calculateSavings(option, selectedTravel);
                                    
                                    return (
                                        <div 
                                            key={option.id} 
                                            className={`similar-option ${betterDeal ? 'better-deal' : ''}`}
                                        >
                                            <div className="option-info">
                                                <p className="option-type-price"><strong>{option.type}</strong> - ${option.price}</p>
                                                <p className="option-departure">Departure: {formatDateTime(option.departure)}</p>
                                                {betterDeal && (
                                                    <p className="savings">{savings}</p>
                                                )}
                                            </div>
                                            <button 
                                                className="swap-btn"
                                                onClick={() => handleSwap(option)}
                                            >
                                                Swap Selection
                                            </button>
                                        </div>
                                    );
                                })
                            ) : (
                                <p className="no-options-message">No similar options found</p>
                            )}
                        </div>
                        
                        <button 
                            className="close-modal-btn"
                            onClick={() => setIsCompareModalOpen(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Travel;