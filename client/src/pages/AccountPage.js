import React, { useState } from 'react';

function AccountPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isEditing, setIsEditing] = useState(false); // New state to track edit mode
    const [userId, setUserId] = useState('c8d2045d-c9bf-437c-b334-51a5c805f469'); // Placeholder user ID

    const toggleEditMode = () => {
        setIsEditing(!isEditing);
    };

    const handleUpdate = async (field, value) => {
        try {
            const response = await fetch(`/api/users/update/${field}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: userId, [field]: value }),
            });

            if (!response.ok) throw new Error(`Error: ${response.statusText}`);

            const data = await response.json();
            console.log(`${field} updated:`, data);
        } catch (error) {
            console.error(`Error updating ${field}:`, error);
        }
    };

    const handleDelete = async () => {
        try {
            const response = await fetch('/api/users/delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: userId }),
            });

            if (!response.ok) throw new Error(`Error: ${response.statusText}`);

            console.log('Account deleted');
        } catch (error) {
            console.error('Error deleting account:', error);
        }
    };

    return (
        <div className="account-container">
            {/* Profile Section */}
            <div className="profile-section">
                <div className="profile-picture"></div>
                <h2 className="username-title">John Purdue</h2>
    
                {/* Move the Edit button below the name */}
                <button className="edit-btn" onClick={toggleEditMode}>
                    {isEditing ? 'Save' : 'Edit'}
                </button>
            </div>


            {/* Account Information Section */}
            <div className="account-info">
                <div className="account-fields">
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    {isEditing && <button onClick={() => handleUpdate('email', email)}>Update</button>}

                    <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                    {isEditing && <button onClick={() => handleUpdate('username', username)}>Update</button>}

                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                    {isEditing && <button onClick={() => handleUpdate('password', password)}>Update</button>}
                </div>

                {/* Preferences Search Bar */}
                <div className="preferences-section">
                    <label>Preferences</label>
                    <div className="search-bar">
                        <input type="text" placeholder="Search" />
                        <button>🔍</button>
                    </div>
                </div>
            </div>

            {/* Delete Account Button */}
            <button className="delete-btn" onClick={handleDelete}>Delete Account</button>
        </div>
    );
}

export default AccountPage;
