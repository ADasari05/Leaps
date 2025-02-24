import React, { useState } from 'react';

function AccountPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [userId, setUserId] = useState(''); // Assuming for now I will have a way to get the user's ID

    const handleUpdateUsername = async () => {
        const response = await fetch('/api/users/update', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: userId, username }),
        });
        const data = await response.json();
        console.log(data);
    };

    const handleUpdateEmail = async () => {
        const response = await fetch('/api/users/update', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: userId, email }),
        });
        const data = await response.json();
        console.log(data);
    };

    const handleUpdatePassword = async () => {
        const response = await fetch('/api/users/update', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: userId, password }),
        });
        const data = await response.json();
        console.log(data);
    };

    const handleDelete = async () => {
        const response = await fetch('/api/users/delete', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: userId }),
        });
        const data = await response.json();
        console.log(data);
    };

    return (
        <div>
            <h1>Account Page</h1>
            <div>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <button onClick={handleUpdateUsername}>Update Username</button>
            </div>
            <div>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <button onClick={handleUpdateEmail}>Update Email</button>
            </div>
            <div>
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button onClick={handleUpdatePassword}>Update Password</button>
            </div>
            <div>
                <button onClick={handleDelete}>Delete Account</button>
            </div>
        </div>
    );
}

export default AccountPage;