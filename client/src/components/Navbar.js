import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { Link } from "react-router-dom";
import "./Navbar.css";
import LeapsLogo from "../assets/Leapspng.png";
import { isAuthenticated, isGuest, logout } from '../services/authService';


const Navbar = () => {
    const [hoverEvent, setHoverEvent] = useState(false);

    const navigate = useNavigate();
    const [auth, setAuth] = useState(isAuthenticated());

    useEffect(() => {
        setAuth(isAuthenticated());  
    }, []);

    const handleLogout = () => {
        setAuth(false);
        logout();
        navigate('/login');
    };

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
                    <div className="nav-item dropdown" 
                         onMouseEnter={() => setHoverEvent(true)} 
                         onMouseLeave={() => setHoverEvent(false)}>
                        <span className="dropdown-toggle">Events</span>
                        {hoverEvent && (
                            <div className="dropdown-menu">
                                <Link to="/events" className="dropdown-item">Public Events</Link>
                                <Link to="/customevents" className="dropdown-item">Custom Events</Link>
                            </div>
                        )}
                    </div>
                    <Link to="/lodgings" className="nav-item">Lodging</Link>
                    <Link to="/search" className="nav-item">Events</Link>
                    <Link to="/travel" className="nav-item">Travel</Link>
                    <Link to="/users" className="nav-item">Friends</Link>
                    <Link to="/accountpage" className="nav-item">My Account</Link>
                </div>  

                <div className="auth-links">
                    {isAuthenticated() ? (
                        <>
                            <Link onClick={handleLogout} className="nav-item">Logout</Link>
                        </>
                    ) : (
                        <>
                            <span className="guest-label">Guest Mode</span>
                            <Link to="/login" className="login-link nav-item">Login</Link>
                            <Link to="/signup" className="signup-link nav-item">Sign Up</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
