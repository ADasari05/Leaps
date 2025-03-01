import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css"; // Import styles

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="nav-links">
                    <Link to="/trips" className="nav-item">Trips</Link>
                    <Link to="/events" className="nav-item">Events</Link>
                    <Link to="/lodging" className="nav-item">Lodging</Link>
                </div>

                {/* Search Bar (Centered) */}
                <div className="search-container">
                    <input type="text" placeholder="What's the move?" className="search-input" />
                    <button className="search-button">🔍</button>
                </div>

                <div className="nav-links">
                    <Link to="/travel" className="nav-item">Travel</Link>
                    <Link to="/users" className="nav-item">Users</Link>
                    <Link to="/accountpage" className="nav-item">My Account</Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
