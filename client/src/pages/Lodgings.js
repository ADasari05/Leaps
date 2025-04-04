// src/pages/Lodgings.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Lodgings.css";
import { isAuthenticated, isGuest } from "../services/authService";
import AuthPrompt from "../components/AuthPrompt";
import { findSimilarItems, isBetterDeal, sortByPrice, generateComparisonData } from "../utils/comparisonUtils";

// Dummy lodging data
const dummyLodgings = [
    {
        id: "1001",
        name: "The Ritz Carlton",
        type: "Hotel",
        location: "New York, NY",
        price_per_night: 350.00,
        check_in_date: "2025-05-01",
        check_out_date: "2025-05-07",
        description: "Luxury hotel in the heart of Manhattan",
        rating: 4.8,
        amenities: ["Free WiFi", "Pool", "Spa", "Fitness Center", "Restaurant"]
    },
    {
        id: "1002",
        name: "Hilton Garden Inn",
        type: "Hotel",
        location: "New York, NY",
        price_per_night: 220.00,
        check_in_date: "2025-05-01",
        check_out_date: "2025-05-07",
        description: "Comfortable hotel with great amenities",
        rating: 4.3,
        amenities: ["Free WiFi", "Fitness Center", "Restaurant"]
    },
    {
        id: "1003",
        name: "Cozy Studio Apartment",
        type: "Apartment",
        location: "New York, NY",
        price_per_night: 180.00,
        check_in_date: "2025-05-01",
        check_out_date: "2025-05-07",
        description: "Charming studio apartment in downtown",
        rating: 4.5,
        amenities: ["Free WiFi", "Kitchen", "Laundry"]
    },
    {
        id: "1004",
        name: "Four Seasons Hotel",
        type: "Hotel",
        location: "Los Angeles, CA",
        price_per_night: 400.00,
        check_in_date: "2025-06-10",
        check_out_date: "2025-06-15",
        description: "Luxury hotel in Beverly Hills",
        rating: 4.9,
        amenities: ["Free WiFi", "Pool", "Spa", "Fitness Center", "Restaurant", "Bar"]
    },
    {
        id: "1005",
        name: "Hampton Inn",
        type: "Hotel",
        location: "Chicago, IL",
        price_per_night: 150.00,
        check_in_date: "2025-07-15",
        check_out_date: "2025-07-20",
        description: "Affordable hotel in downtown Chicago",
        rating: 4.0,
        amenities: ["Free WiFi", "Fitness Center", "Free Breakfast"]
    },
    {
        id: "1006",
        name: "Luxury Penthouse",
        type: "Apartment",
        location: "Los Angeles, CA",
        price_per_night: 300.00,
        check_in_date: "2025-06-10",
        check_out_date: "2025-06-15",
        description: "Stunning penthouse with city views",
        rating: 4.7,
        amenities: ["Free WiFi", "Kitchen", "Laundry", "Parking", "Pool"]
    },
    {
        id: "1007",
        name: "Budget Inn Express",
        type: "Hotel",
        location: "New York, NY",
        price_per_night: 120.00,
        check_in_date: "2025-05-01",
        check_out_date: "2025-05-07",
        description: "Affordable option in the city",
        rating: 3.5,
        amenities: ["Free WiFi", "Free Breakfast"]
    },
    {
        id: "1008",
        name: "Luxury Loft",
        type: "Apartment",
        location: "New York, NY",
        price_per_night: 250.00,
        check_in_date: "2025-05-01",
        check_out_date: "2025-05-07",
        description: "Spacious loft in Soho",
        rating: 4.6,
        amenities: ["Free WiFi", "Kitchen", "Laundry", "Parking"]
    }
];

const Lodgings = () => {
    const [lodgings, setLodgings] = useState([]);
    const [trips, setTrips] = useState([]);
    const [selectedLodging, setSelectedLodging] = useState(null);
    const [selectedTripId, setSelectedTripId] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('price_asc');
    const [selectedType, setSelectedType] = useState('');
    const [similarLodgings, setSimilarLodgings] = useState([]);
    const token = localStorage.getItem('token');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchLodgings = async () => {
            setIsLoading(true);
            try {
                // For now use the dummy data instead of API call
                setLodgings(dummyLodgings);
            } catch (err) {
                setError('Error loading lodgings. Please try again later.');
                console.error('Error fetching lodgings:', err);
            } finally {
                setIsLoading(false);
            }
        };

        const fetchTrips = async () => {
            try {
                if (!isAuthenticated()) return;
                
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
        };

        fetchLodgings();
        fetchTrips();
    }, [token]);

    const handleAddLodgingToTrip = async (tripId) => {
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
                body: JSON.stringify({ tripId, itemType: 'lodging', itemId: selectedLodging.id })
            });

            if (!response.ok) throw new Error('Failed to add lodging to trip');

            setIsModalOpen(false);
            setSelectedLodging(null);
            alert('Lodging added to trip successfully!');
        } catch (err) {
            console.error('Error adding lodging to trip:', err);
            setError('Error adding lodging to trip. Please try again later.');
        }
    };

    const handleCompare = (lodging) => {
        setSelectedLodging(lodging);
        
        // Find similar lodgings
        const similar = findSimilarItems(lodgings, lodging);
        const sortedSimilar = sortByPrice(similar, 'lodging');
        
        setSimilarLodgings(sortedSimilar);
        setIsComparisonModalOpen(true);
    };

    const handleSwapLodging = async (newLodging) => {
        if (!selectedTripId) {
            setError('Please select a trip first');
            return;
        }

        try {
            if (!isAuthenticated()) return;

            // First remove the old lodging
            const removeResponse = await fetch(`/api/trips/items/${selectedTripId}/lodging/${selectedLodging.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!removeResponse.ok) throw new Error('Failed to remove current lodging');

            // Then add the new lodging
            const addResponse = await fetch('/api/trips/add-item', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ tripId: selectedTripId, itemType: 'lodging', itemId: newLodging.id })
            });

            if (!addResponse.ok) throw new Error('Failed to add new lodging');

            setIsComparisonModalOpen(false);
            setSelectedLodging(null);
            alert('Lodging swapped successfully!');
        } catch (err) {
            console.error('Error swapping lodging:', err);
            setError('Error swapping lodging. Please try again later.');
        }
    };

    const filteredLodgings = lodgings.filter(lodging => {
        const checkInDate = new Date(lodging.check_in_date);
        const checkOutDate = new Date(lodging.check_out_date);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        const matchesSearchQuery = lodging.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                   lodging.location.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = selectedType ? lodging.type === selectedType : true;

        if (start && end) {
            return checkInDate >= start && checkOutDate <= end && matchesSearchQuery && matchesType;
        } else if (start) {
            return checkInDate >= start && matchesSearchQuery && matchesType;
        } else if (end) {
            return checkOutDate <= end && matchesSearchQuery && matchesType;
        } else {
            return matchesSearchQuery && matchesType;
        }
    });

    const sortedLodgings = [...filteredLodgings].sort((a, b) => {
        switch (sortOrder) {
            case 'price_asc':
                return a.price_per_night - b.price_per_night;
            case 'price_desc':
                return b.price_per_night - a.price_per_night;
            case 'rating_desc':
                return b.rating - a.rating;
            default:
                return 0;
        }
    });

    if (error) {
        return <div className="lodgings"><p className="error">{error}</p></div>;
    }

    return (
        <div className="lodgings">
            <h2>Lodging Options</h2>
            
            <div className="filter-container">
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
                        Type:
                        <select 
                            value={selectedType} 
                            onChange={(e) => setSelectedType(e.target.value)}
                        >
                            <option value="">All Types</option>
                            <option value="Hotel">Hotel</option>
                            <option value="Apartment">Apartment</option>
                        </select>
                    </label>
                    <label>
                        Search:
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name or location"
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
                            <option value="rating_desc">Highest Rated</option>
                        </select>
                    </label>
                </div>
            </div>

            {isLoading ? (
                <p className="loading">Loading lodgings...</p>
            ) : (
                <div className="lodgings-grid">
                    {sortedLodgings.map(lodging => (
                        <div key={lodging.id} className="lodging-card">
                            <h3>{lodging.name}</h3>
                            <div className="lodging-type">{lodging.type}</div>
                            <div className="lodging-location">{lodging.location}</div>
                            <div className="lodging-price">${lodging.price_per_night} per night</div>
                            <div className="lodging-rating">★ {lodging.rating}</div>
                            <p className="lodging-description">{lodging.description}</p>
                            <div className="date-range">
                                <span><strong>Check-In:</strong> {new Date(lodging.check_in_date).toLocaleDateString()}</span>
                                <span><strong>Check-Out:</strong> {new Date(lodging.check_out_date).toLocaleDateString()}</span>
                            </div>
                            <div className="lodging-amenities">
                                {lodging.amenities && lodging.amenities.map((amenity, index) => (
                                    <span key={index} className="amenity-tag">{amenity}</span>
                                ))}
                            </div>
                            <div className="lodging-actions">
                                <button 
                                    onClick={() => { 
                                        setSelectedLodging(lodging); 
                                        setIsModalOpen(true); 
                                    }}
                                    className="add-to-trip-btn"
                                >
                                    Add to Trip
                                </button>
                                <button 
                                    onClick={() => handleCompare(lodging)}
                                    className="compare-btn"
                                >
                                    Compare Options
                                </button>
                                <button 
                                    onClick={() => window.open('https://www.booking.com', '_blank')}
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
                                                handleAddLodgingToTrip(trip.id);
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
            {isComparisonModalOpen && selectedLodging && (
                <div className="modal comparison-modal">
                    <div className="modal-content">
                        <h3>Compare Lodging Options</h3>
                        
                        <div className="selected-item">
                            <h4>Your Selected Lodging</h4>
                            <div className="item-details">
                                <h5>{selectedLodging.name}</h5>
                                <p className="item-type">{selectedLodging.type}</p>
                                <p className="item-location">{selectedLodging.location}</p>
                                <p className="item-price">${selectedLodging.price_per_night} per night</p>
                                <p className="item-rating">★ {selectedLodging.rating}</p>
                            </div>
                        </div>
                        
                        <h4>Similar Options in {selectedLodging.location.split(',')[0]}</h4>
                        
                        {similarLodgings.length > 0 ? (
                            <div className="similar-items">
                                {similarLodgings.map(lodging => {
                                    const comparison = generateComparisonData(lodging, selectedLodging);
                                    const isBetter = isBetterDeal(lodging, selectedLodging);
                                    
                                    return (
                                        <div 
                                            key={lodging.id} 
                                            className={`comparison-item ${isBetter ? 'better-deal' : ''}`}
                                        >
                                            <div className="item-details">
                                                <h5>{lodging.name}</h5>
                                                <p className="item-type">{lodging.type}</p>
                                                <p className="item-location">{lodging.location}</p>
                                                <p className="item-price">${lodging.price_per_night} per night</p>
                                                <p className="item-rating">★ {lodging.rating}</p>
                                                
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
                                                            setError('Please add the original lodging to a trip first');
                                                            setIsComparisonModalOpen(false);
                                                            return;
                                                        }
                                                        handleSwapLodging(lodging);
                                                    }}
                                                    className="swap-btn"
                                                >
                                                    Swap Selection
                                                </button>
                                                <button 
                                                    onClick={() => window.open('https://www.booking.com', '_blank')}
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
                            <p>No similar lodging options found in this area.</p>
                        )}
                        
                        <button onClick={() => setIsComparisonModalOpen(false)} className="cancel-btn">Close</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Lodgings;