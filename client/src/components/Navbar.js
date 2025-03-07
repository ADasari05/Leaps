import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { Link } from "react-router-dom";
import "./Navbar.css"; // Import styles
import LeapsLogo from "../assets/Leapspng.png";

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
                    <Link to="/accountpage" className="nav-item">My Account</Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
