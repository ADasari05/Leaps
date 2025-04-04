import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ChatWindow from "../components/ChatWindow";
import "../styles/TripDetails.css";
import EventRecommendationsSearcher from '../components/EventRecommendationsSearcher';
import EventRecommendations from '../components/EventRecommendations';
import AddToTripDialog from '../components/AddToTripDialog';
import AddRecommendationDialog from "../components/AddRecommendationDialog";


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
    const [cancelVotes, setCancelVotes] = useState(0);
    const [hasVotedToCancel, setHasVotedToCancel] = useState(false);
    const [isTripCancelled, setIsTripCancelled] = useState(false);
    const token = localStorage.getItem('token');
    const userId = JSON.parse(atob(token.split('.')[1])).id;
    const [results, setResults] = useState({ events: [], travel: [], lodging: [] });
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);


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

            // Fetch vote counts for trip items
            const votesResponse = await fetch(`/api/trips/items/${id}/votes`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!votesResponse.ok) throw new Error('Failed to fetch vote counts');

            const votesData = await votesResponse.json();

            // Map vote counts to trip 
            const itemsWithVotes = data.items.map(item => {
                // Ensure proper matching of trip_item_id with item.id
                const vote = votesData.find(v => v.trip_item_id === item.id) || {};
                return {
                    ...item,
                    upVotes: vote.upvotes ?? 0, // Correctly use `upvotes` from votesData
                    downVotes: vote.downvotes ?? 0 // Correctly use `downvotes` from votesData
                };
            });

            setTrip({
                ...data,
                items: itemsWithVotes,
                startDate: data.start_date ? new Date(data.start_date).toISOString().split('T')[0] : '',
                endDate: data.end_date ? new Date(data.end_date).toISOString().split('T')[0] : ''
            });
            setEvents(data.events || []); // Assuming events are part of the trip data
            setTripMembers(data.members || []); // Ensure members are stored
            console.log("Trip Members:", data.members); // Debugging log
        } catch (err) {
            setError('Error loading trip. Please try again later.');
            console.error('Error fetching trip:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTrip();

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

        fetchFriends();
    }, [id, token, userId]);

    useEffect(() => {
        const fetchCancelVotes = async () => {
            if (tripMembers.length === 0) return; // Ensure tripMembers is loaded before fetching votes

            try {
                const response = await fetch(`/api/trips/${id}/cancellation-status`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) throw new Error('Failed to fetch cancellation votes');

                const data = await response.json();
                setCancelVotes(data.cancel_votes || 0);

                // Check if the user has already voted to cancel
                const userVoteResponse = await fetch(`/api/trips/${id}/user-vote`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!userVoteResponse.ok) throw new Error('Failed to fetch user vote status');

                const userVoteData = await userVoteResponse.json();
                setHasVotedToCancel(userVoteData.hasVoted);

                // Determine if the trip is cancelled
                const totalMembers = tripMembers.length;
                setIsTripCancelled(data.cancel_votes > totalMembers / 2);
            } catch (err) {
                console.error('Error fetching cancellation votes or user vote status:', err);
            }
        };

        fetchCancelVotes();
    }, [tripMembers]); // Run fetchCancelVotes only after tripMembers is updated

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
            console.log(JSON.stringify(trip));
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
            setTrip({
                ...data,
                startDate: data.start_date ? new Date(data.start_date).toISOString().split('T')[0] : '',
                endDate: data.end_date ? new Date(data.end_date).toISOString().split('T')[0] : ''
            }); setIsEditing(false);
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

    const handleVote = async (itemId, voteType) => {
        try {
            const response = await fetch(`/api/trips/items/${id}/vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ itemId, vote: voteType === 'up' })
            });

            if (!response.ok) throw new Error('Failed to submit vote');

            // Refresh trip data to update vote counts
            await fetchTrip();
        } catch (err) {
            console.error('Error submitting vote:', err);
        }
    };

    const fetchItemDetails = async (type, id) => {
        console.log(`Fetching details for ${type} with ID: ${id}`);
        if (type === 'events' || type == 'custom-event') {
            try {
                navigate(`/viewevent/${id}`);
            } catch (err) {
                console.error('Error fetching event details:', err);
            }
        } else if (type === 'lodging') {
            try {
                // Navigate to lodging page if you have one
                navigate('/lodgings');
                //navigate(`/lodging/${id}`);
            } catch (err) {
                console.error('Error navigating to lodging:', err);
            }
        } else if (type === 'travel') {
            try {
                // Navigate to travel page if you have one
                navigate('/travel');
                //navigate(`/travel/${id}`);
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
                    if (type === 'events' || type === 'custom-event') {
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
        if (type === 'events' || type === 'custom-event') {
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
                                    <div className="vote-buttons">
                                        <button onClick={() => handleVote(item.id, 'up')} className="thumbs-up-btn">
                                            👍 {item.upVotes || 0}
                                        </button>
                                        <button onClick={() => handleVote(item.id, 'down')} className="thumbs-down-btn">
                                            👎 {item.downVotes || 0}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const voteToCancel = async () => {
        try {
            const response = await fetch(`/api/trips/${id}/vote-cancel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) throw new Error('Failed to vote for cancellation');

            setCancelVotes(cancelVotes + 1);
            setHasVotedToCancel(true);
            window.location.reload(); // Force refresh
        } catch (err) {
            console.error('Error voting to cancel trip:', err);
        }
    };

    const handleResults = (data) => {
        console.log('Received results:', data);
        setResults(data);
    };

    const openAddToTrip = (item) => {
        setSelectedItem(item);
        setDialogOpen(true);
    };

    const rescindVote = async () => {
        try {
            const response = await fetch(`/api/trips/${id}/rescind-vote`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to rescind vote');

            setCancelVotes(cancelVotes - 1);
            setHasVotedToCancel(false);
            window.location.reload(); // Force refresh
        } catch (err) {
            console.error('Error rescinding vote:', err);
        }
    };

    const restoreTrip = async () => {
        try {
            const response = await fetch(`/api/trips/${id}/restore`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to restore trip');

            setCancelVotes(0);
            setIsTripCancelled(false);
        } catch (err) {
            console.error('Error restoring trip:', err);
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
            {isTripCancelled && (
                <div className="cancelled-sidebar">
                    <h3>Trip Cancelled</h3>
                    <p>This trip has been cancelled as more than half of the members have voted to cancel.</p>
                    {trip?.creator_id === userId && (
                        <button onClick={restoreTrip} className="restore-trip-btn">
                            Restore Trip
                        </button>
                    )}
                </div>
            )}
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
                            {trip.current && (<button onClick={handleEditTrip} className="edit-trip-btn">Edit Trip</button>)}
                        </>
                    )}
                    {renderTripItems()}

                    <div className="event-recommendations">
                        <h3>Recommended Events</h3>
                        <EventRecommendationsSearcher onResults={handleResults} location={"New York"} />
                        <EventRecommendations results={results} onAddToTrip={openAddToTrip} currentTrip={trip} />
                        {selectedItem && (
                            <AddRecommendationDialog
                                open={dialogOpen}
                                onClose={() => setDialogOpen(false)}
                                item={selectedItem}
                                reload={fetchTrip()}
                            />
                        )}
                    </div>

                    <div className="add-friend">
                        <h3>Trip Members</h3>
                        <ul>
                            {tripMembers.map(member => (
                                <li key={member.id} className={member.id === userId ? "current-user" : ""}>
                                    <img
                                        src={member.profile_pic}
                                        className="profile-pic"
                                    />
                                    {member.username}
                                    {member.id === userId ? "(me)" : ""}
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
                    {trip.current && (<button onClick={handleAddEvent} className="add-event-btn">Add Event</button>)}
                    <button onClick={handleDeleteTrip} className="delete-trip-btn">Delete Trip</button>

                    {trip.current && (<div className="trip-cancellation">
                        <h3>Cancel Votes</h3><p><strong>Cancel Votes:</strong> {cancelVotes}</p>
                        {hasVotedToCancel ? (
                            <button onClick={rescindVote} className="rescind-vote-btn">
                                Rescind Cancellation Vote
                            </button>
                        ) : (
                            <button onClick={voteToCancel} className="cancel-vote-btn">
                                Vote to Cancel Trip
                            </button>
                        )}
                        {trip.isCancelled && (
                            <button onClick={restoreTrip} className="restore-trip-btn">
                                Restore Trip
                            </button>
                        )}
                    </div>)}
                </>
            ) : (
                <p className="error">Trip not found.</p>
            )}
            <ChatWindow tripId={id} userId={userId} />
        </div>
    );
};

export default TripDetails;
