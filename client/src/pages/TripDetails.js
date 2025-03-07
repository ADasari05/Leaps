import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/TripDetails.css";
//import dummyTrips from "../data/dummyTrips.json"; // Import the dummy trips

const TripDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [trip, setTrip] = useState(null);
    const [events, setEvents] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchTrip = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`/api/trips/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) throw new Error('Failed to fetch trip');

                const data = await response.json();
                setTrip(data);
                setEvents(data.events || []); // Assuming events are part of the trip data
            } catch (err) {
                setError('Error loading trip. Please try again later.');
                console.error('Error fetching trip:', err);
                //const dummyTrip = dummyTrips.find(trip => trip.id === id); // Use dummy trip if API call fails
                //setTrip(dummyTrip);
                //setEvents(dummyTrip ? dummyTrip.events || [] : []); // Use dummy events if available
            } finally {
                setIsLoading(false);
            }
        };

        fetchTrip();
    }, [id, token]);

    const handleAddEvent = () => {
        // TODO Logic to add a new event
        console.log('Add Event button clicked');
    };

    const handleEditTrip = () => {
        setIsEditing(true);
    };

    const handleSaveTrip = async () => {
        try {
            const response = await fetch(`/api/trips/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(trip)
            });

            if (!response.ok) throw new Error('Failed to save trip');

            const data = await response.json();
            setTrip(data);
            setIsEditing(false);
        } catch (err) {
            console.error('Error saving trip:', err);
            setError('Error saving trip. Please try again later.');
        }
    };

    const handleRemoveEvent = (eventId) => {
        setEvents(events.filter(event => event.id !== eventId));
    };

    const handleDeleteTrip = async () => {
        const confirmed = window.confirm('Are you sure you want to delete this trip?');
        if (confirmed) {
            try {
                const response = await fetch(`/api/trips/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) throw new Error('Failed to delete trip');

                console.log('Trip deleted successfully');
                navigate('/trips');
            } catch (err) {
                console.error('Error deleting trip:', err);
                setError('Error deleting trip. Please try again later.');
            }
        }
    };

    const handleDeleteItem = async (tripId, itemType, itemId) => {
        if (window.confirm('Are you sure you want to remove this item from the trip?')) {
          try {
            console.log(`Attempting to delete: tripId=${tripId}, itemType=${itemType}, itemId=${itemId}`);
            
            const url = `/api/trips/items/${tripId}/${itemType}/${itemId}`;
            console.log('Delete request URL:', url);
            
            const response = await fetch(url, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              console.error('Server response:', response.status, errorData);
              throw new Error(`Failed to delete item: ${response.status}`);
            }
            
            // Update local state to reflect the deletion
            setTrip(prevTrip => ({
              ...prevTrip,
              items: prevTrip.items.filter(item => 
                !(item.trip_id === tripId && item.item_type === itemType && item.item_id === itemId)
              )
            }));
            
          } catch (err) {
            console.error('Error deleting item:', err);
            setError('Failed to remove item from trip');
          }
        }
    };


    const fetchItemDetails = async (type, id) => {
        console.log(`Fetching details for ${type} with ID: ${id}`);
        if (type === 'events') {
          try {
            navigate(`/viewevent/${id}`);
          } catch (err) {
            console.error('Error fetching event details:', err);
          }
        } else if (type === 'lodging') {
            try {
              // Navigate to lodging page if you have one
              navigate(`/lodging/${id}`);
            } catch (err) {
              console.error('Error navigating to lodging:', err);
            }
          } else if (type === 'travel') {
            try {
              // Navigate to travel page if you have one
              navigate(`/travel/${id}`);
            } catch (err) {
              console.error('Error navigating to travel:', err);
            }
          } else {
            console.log(`Item type ${type} not supported for viewing details`);
          }
    };

    const ItemPreview = ({ type, id }) => {
        const [preview, setPreview] = useState(null);
        const [loading, setLoading] = useState(true);
        
        useEffect(() => {
          const fetchPreview = async () => {
            setLoading(true);
            try {
              let endpoint;
              if (type === 'events') {
                endpoint = `/api/events/${id}`;
              } else if (type === 'lodging') {
                endpoint = `/api/lodging/${id}`;
              } else if (type === 'travel') {
                endpoint = `/api/travel/${id}`;
              }
              
              if (endpoint) {
                const response = await fetch(endpoint, {
                  headers: { 'Authorization': `Bearer ${token}` },
                });
                
                if (response.ok) {
                  const data = await response.json();
                  setPreview(data);
                }
              }
            } catch (err) {
              console.error(`Error fetching ${type} preview:`, err);
            } finally {
              setLoading(false);
            }
          };
          
          fetchPreview();
        }, [type, id]);
        
        if (loading) return <p>Loading...</p>;
        
        if (!preview) return (
          <div className="preview-placeholder">
            <p>{type.charAt(0).toUpperCase() + type.slice(1)} item</p>
            <p className="preview-id">ID: {id.slice(0, 8)}...</p>
          </div>
        );
        
        // Render different previews based on item type
        if (type === 'events') {
          return (
            <div className="event-preview">
              {preview.image && (
                <img src={preview.image} alt={preview.name} className="preview-image" />
              )}
              <h5>{preview.name}</h5>
              <p>{preview.date} | {preview.location}</p>
            </div>
          );
        } else if (type === 'lodging') {
          return (
            <div className="lodging-preview">
              <h5>{preview.name}</h5>
              <p>{preview.location}</p>
            </div>
          );
        } else if (type === 'travel') {
          return (
            <div className="travel-preview">
              <h5>{preview.type}</h5>
              <p>{preview.departure_location} → {preview.arrival_location}</p>
            </div>
          );
        }
        
        return <p>Unknown item type</p>;
    };

    
    const renderTripItems = () => {
        if (!trip.items || trip.items.length === 0) {
          return <p>No items added to this trip yet.</p>;
        }
      
        // Group items by type
        const groupedItems = trip.items.reduce((acc, item) => {
          const type = item.item_type;
          if (!acc[type]) {
            acc[type] = [];
          }
          acc[type].push(item);
          return acc;
        }, {});
      
        return (
          <div className="trip-items">
            <h3>Trip Items</h3>
            
            {Object.entries(groupedItems).map(([type, items]) => (
              <div key={type} className="item-type-section">
                <h4>{type.charAt(0).toUpperCase() + type.slice(1)}</h4>
                <div className="items-grid">
                  {items.map((item) => (
                    <div key={item.id} className="trip-item-card">
                      <ItemPreview type={item.item_type} id={item.item_id} />
                      <button 
                        onClick={() => fetchItemDetails(item.item_type, item.item_id)}
                        className="view-details-btn"
                      >
                        View Details
                      </button>
                      <button 
                        onClick={() => handleDeleteItem(trip.id, item.item_type, item.item_id)}
                        className="delete-item-btn"
                      >
                        Remove
                        </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      };

    if (isLoading) {
        return <div className="trip-details"><p className="loading">Loading trip details...</p></div>;
    }

    if (error) {
        return <div className="trip-details"><p className="error">{error}</p></div>;
    }

    return (
        <div className="trip-details">
            {trip ? (
                <>
                    {isEditing ? (
                        <>
                            <input
                                type="text"
                                value={trip.name}
                                onChange={(e) => setTrip({ ...trip, name: e.target.value })}
                            />
                            <textarea
                                value={trip.description}
                                onChange={(e) => setTrip({ ...trip, description: e.target.value })}
                            />
                            <input
                                type="text"
                                value={trip.destination}
                                onChange={(e) => setTrip({ ...trip, destination: e.target.value })}
                            />
                            <input
                                type="date"
                                value={trip.startDate}
                                onChange={(e) => setTrip({ ...trip, startDate: e.target.value })}
                            />
                            <input
                                type="date"
                                value={trip.endDate}
                                onChange={(e) => setTrip({ ...trip, endDate: e.target.value })}
                            />
                            <button onClick={handleSaveTrip} className="save-trip-btn">Save Trip</button>
                        </>
                    ) : (
                        <>
                            <h2>{trip.name}</h2>
                            <p>{trip.description}</p>
                            <p><strong>Destination:</strong> {trip.destination}</p>
                            <p><strong>Dates:</strong> {trip.startDate} to {trip.endDate}</p>
                            <button onClick={handleEditTrip} className="edit-trip-btn">Edit Trip</button>
                        </>
                    )}
                    {renderTripItems()}
                    <button onClick={handleAddEvent} className="add-event-btn">Add Event</button>
                    <button onClick={handleDeleteTrip} className="delete-trip-btn">Delete Trip</button>
                </>
            ) : (
                <p className="error">Trip not found.</p>
            )}
        </div>
    );
};

export default TripDetails;
