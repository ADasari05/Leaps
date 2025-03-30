import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Users.css';

const Users = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [currentUserId, setCurrentUserId] = useState(null);
    // const [users, setUsers] = useState([]);
    const [friends, setFriends] = useState([]); 
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); 
    const [isLoading, setIsLoading] = useState(false);

    const token = localStorage.getItem('token');
    const navigate = useNavigate();


    useEffect(() => {
        if (!token) {
          navigate('/login');
          return;
        }
        const fetchProfile = async () => {
            try {
              const res = await fetch('/api/users/profile', {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (!res.ok) throw new Error('Failed to fetch profile');
              const data = await res.json();
              setCurrentUserId(data.id);
            } catch (err) {
              console.error('Error fetching user profile:', err);
            }
          };
        const fetchFriends = async () => {
          try {
            const response = await fetch('/api/friends/list', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch friends');
            const data = await response.json();
            setFriends(data);
          } catch (err) {
            console.error('Error fetching friends:', err);
          }
        };
        fetchProfile();
        fetchFriends();
    }, [token, navigate]);
    
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!token) {
            navigate('/login');
            return;
        }
        if (!searchQuery.trim()) {
            setSearchResults([]);
            setMessage('Please enter a search term');
            setMessageType('error');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`/api/users/search?query=${encodeURIComponent(searchQuery)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to search users');
            const data = await response.json();
            setSearchResults(data);
            setMessage(data.length === 0 ? 'No users found' : '');
            setMessageType(data.length === 0 ? 'error' : '');
        } catch (err) {
            setMessage('Error searching users');
            setMessageType('error');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddFriend = async (friendId) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/friends/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ friend_id: friendId })
            });
            const data = await response.json();
            setMessage(response.ok ? 'Friend added successfully' : data.message);
            setMessageType(response.ok ? 'success' : 'error');
            if (response.ok) {
                const addedUser = searchResults.find(user => user.id === friendId);
                if (addedUser) setFriends(prev => [...prev, addedUser]);
                // Optionally refresh search to reflect updated friend status
                handleSearch({ preventDefault: () => {} });
            }
        } catch (err) {
            setMessage('Error adding friend');
            setMessageType('error');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveFriend = async (friendId) => {
        setIsLoading(true);
        try {
          const response = await fetch('/api/friends/remove', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ friend_id: friendId })
          });
          const data = await response.json();
          setMessage(response.ok ? 'Friend removed successfully' : data.message);
          setMessageType(response.ok ? 'success' : 'error');
          if (response.ok) {
            setFriends(prev => prev.filter(friend => friend.id !== friendId));
            // Optional: re-search to refresh UI
            if (searchQuery.trim()) handleSearch({ preventDefault: () => {} });
          }
        } catch (err) {
          setMessage('Error removing friend');
          setMessageType('error');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
    };
      

  return (
    <div className="users-container">
      <h2>Friends</h2>

      {/* Search Section */}
      <section>
        <h3>Find New Friends</h3>
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search by username"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Searching..." : "Search"}
          </button>
        </form>
        {message && <p className={messageType === 'success' ? 'success-message' : 'message'}>{message}</p>}
        {searchResults.length > 0 && (
          <ul className="users-list">
            {searchResults.filter(user => user.id !== currentUserId)
            .map(user => (
              <li key={user.id}>
                <span className="user-info">{user.username} ({user.email})</span>
                {friends.some(friend => friend.id === user.id) ? (
                  <span className="friend-status">Friend</span>
                ) : (
                  <button
                    onClick={() => handleAddFriend(user.id)}
                    disabled={isLoading}
                    className="add-btn"
                  >
                    Add Friend
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Friends List Section */}
      <section>
        <h3>Your Friends</h3>
        {friends.length === 0 ? (
          <p>You haven’t added any friends yet.</p>
        ) : (
          <ul className="users-list">
            {friends.map(friend => (
                <li key={friend.id}>
                    <span className="user-info">{friend.username} ({friend.email})</span>
                    <button
                        onClick={() => handleRemoveFriend(friend.id)}
                        disabled={isLoading}
                        className="remove-btn"
                    >
                        Remove
                    </button>
                </li>            
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Users;