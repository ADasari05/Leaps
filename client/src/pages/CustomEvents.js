import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import LeapsLogo from "../assets/Leapspng.png";
import "../styles/Events.css"

function CustomEvents() {

    return (
        <div className="events-container">
            <h2>Custom Events</h2>
            <p className="description">
                Create and manage your own custom events easily
            </p>

            <div className="button-container">
                <Link to="/create-event" className="create-event-btn">
                    Create a Custom Event
                </Link>
            </div>
        </div>
    );

}

export default CustomEvents;