import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { Link } from "react-router-dom";
import "./Navbar.css";
import LeapsLogo from "../assets/Leapspng.png";
import { isAuthenticated, isGuest, logout } from '../services/authService';


const Navbar = () => {
    return (
        
        
        <nav className="navbar">
            {/*Home button*/}
            <div className="home">
                <Link to="/signup">
                <img src={LeapsLogo} alt="Home" className="home"/>
                </Link>
            </div>
            <div className="navbar-container">
                


            <div className="nav-links">
                    <Link to="/trips" className="nav-item">Trips</Link>
                    <Link to="/events" className="nav-item">Events</Link>
                    <Link to="/lodgings" className="nav-item">Lodging</Link>
                    <Link to="/search" className="nav-item">Search</Link>
                    <Link to="/travel" className="nav-item">Travel</Link>
                    <Link to="/users" className="nav-item">Users</Link>
                    
                    {isAuthenticated() ? (
                        <>
                            <Link to="/accountpage" className="nav-item">My Account</Link>
                            <button onClick={handleLogout} className="logout-btn nav-item">Logout</button>
                        </>
                    ) : isGuest() ? (
                        <>
                            <span className="guest-label nav-item">Guest Mode</span>
                            <Link to="/login" className="login-link nav-item">Login</Link>
                            <Link to="/signup" className="signup-link nav-item">Sign Up</Link>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="nav-item">Login</Link>
                            <Link to="/signup" className="nav-item">Sign Up</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
