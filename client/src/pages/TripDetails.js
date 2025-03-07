import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../styles/TripDetails.css";
//import dummyTrips from "../data/dummyTrips.json"; // Import the dummy trips

const TripDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [friends, setFriends] = useState([]);
    const [selectedFriend, setSelectedFriend] = useState("");
    const [trip, setTrip] = useState(null);
    const [events, setEvents] = useState([]);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [tripMembers, setTripMembers] = useState([]);
    const token = localStorage.getItem('token');
    const userId = JSON.parse(atob(token.split('.')[1])).id;

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
                setTripMembers(data.members || []); // Ensure members are stored
                console.log("Trip Members:", data.members); // Debugging log
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

        const fetchFriends = async () => {
            try {
                const response = await fetch(`http://localhost:3000/api/friends/list`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
        
                if (!response.ok) throw new Error("Failed to fetch friends");
        
                const data = await response.json();
                setFriends(data);
            } catch (err) {
                console.error("Error fetching friends:", err);
            }
        };
        fetchTrip();
        fetchFriends();    
    }, [id, token]);

    const fetchTripMembers = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/trips/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
    
            if (!response.ok) throw new Error("Failed to fetch trip members");
    
            const data = await response.json();
            setTripMembers(data.members || []);
        } catch (err) {
            console.error("Error fetching trip members:", err);
        }
    };
    

    const handleRemoveMember = async (memberId) => {
        if (memberId === userId) {
            alert("You cannot remove yourself from the trip.");
            return;
        }
        try {
            const response = await fetch(`http://localhost:3000/api/trips/${id}/remove-member/${memberId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
    
            if (!response.ok) {
                throw new Error('Failed to remove member');
            }
    
            alert('Member removed successfully');
            setTripMembers(tripMembers.filter(member => member.id !== memberId));
        } catch (err) {
            console.error('Error removing member:', err);
            alert('Failed to remove member');
        }
    };

    const handleAddFriend = async () => {
        if (!selectedFriend) {
            console.error("No friend selected");
            return;
        }
    
        try {
            const response = await fetch(`http://localhost:3000/api/trips/${id}/add-friend`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ friendId: selectedFriend }),
            });
    
            const data = await response.json();
            console.log("Add Friend Response:", data);
    
            if (!response.ok) {
                throw new Error(data.message || "Failed to add friend");
            }
    
            alert("Friend added successfully!");
            setFriends(friends.filter(friend => friend.id !== selectedFriend));

            // Remove added friend from the dropdown list
            setFriends(friends.filter(friend => friend.id !== selectedFriend));

            // Fetch updated trip members after adding a new friend
            fetchTripMembers();

            // Reset selection
            setSelectedFriend("");
        } catch (err) {
            console.error("Error adding friend:", err);
            alert("Failed to add friend.");
        }
    };    

    const handleAddEvent = () => {
        // TODO Logic to add a new event
        console.log('Add Event button clicked');
    };

    const handleEditTrip = () => {
        setIsEditing(true);
    };

    const handleSaveTrip = async () => {
        try {
            const response = await fetch(`http://localhost:3000/api/trips/${id}`, {
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
                    
                    <div className="add-friend">
                        <h3>Trip Members</h3>
                        {/* <ul>
                            {tripMembers.length > 0 ? (
                                tripMembers.map(member => (
                                    <li key={member.id}>
                                        {member.username} 
                                    </li>
                                ))
                            ) : (
                                <p>No members in this trip.</p>
                            )}
                        </ul> */}

                        <ul>
                        {tripMembers.map(member => (
                            <li key={member.id} className={member.id === userId ? "current-user" : ""}>
                            {member.username} {member.id === userId ? "(me)" : ""}
                            {trip.creator_id === userId && member.id !== userId && (
                                <button onClick={() => handleRemoveMember(member.id)}>Remove</button>
                            )}
                            </li>
                        ))}
                        </ul>

                        <h3>Add a Friend</h3>
                        <select onChange={(e) => setSelectedFriend(e.target.value)} value={selectedFriend}>
                            <option value="">Select a friend</option>
                            {friends.map((friend) => (
                                <option key={friend.id} value={friend.id}>
                                    {friend.username}
                                </option>
                            ))}
                        </select>
                        <button onClick={handleAddFriend} className="add-friend-btn" disabled={!selectedFriend}>Add Friend</button>
                    </div>

                    <div>
                        <h3>Share by Link</h3>
                        <p>Link: http://localhost:3001/trips/{id}/share</p>
                    </div>

                    <h3>Events</h3>
                    <ul>
                        {events.length > 0 ? (
                            events.map(event => (
                                <li key={event.id}>
                                    <p><strong>{event.name}</strong></p>
                                    <p>{event.description}</p>
                                    <p><strong>Date:</strong> {event.date}</p>
                                    <button onClick={() => handleRemoveEvent(event.id)} className="remove-event-btn">Remove Event</button>
                                </li>
                            ))
                        ) : (
                            <p>No events found.</p>
                        )}
                    </ul>
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
