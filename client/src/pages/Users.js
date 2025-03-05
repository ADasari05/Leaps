import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Users.css';

const Users = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [friends, setFriends] = useState([]); 
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); 
    const [isLoading, setIsLoading] = useState(false);
    const token = localStorage.getItem('token');
    const navigate = useNavigate();

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!token) {
            navigate('/login');
            return;
        }
        if (!searchQuery.trim()) {
            setUsers([]);
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
            setUsers(data);
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
                const addedUser = users.find(user => user.id === friendId);
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

    return (
        <div className="users-container">
            <h2>Find Users</h2>
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
            {message && (
                <p className={messageType === 'success' ? 'success-message' : 'message'}>
                    {message}
                </p>
            )}
            {isLoading ? (
                <p className="loading">Loading...</p>
            ) : users.length > 0 ? (
                <ul className="users-list">
                    {users.map(user => (
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
            ) : null}
        </div>
    );
};

export default Users;