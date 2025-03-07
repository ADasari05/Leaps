import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LeapsLogo from "../assets/Leapspng.png";

const ViewEvent = () => {
    // Initialized to example event based on design document
    const [name, setName] = useState("Banana Bar Crawl");
    const [location, setLocation] = useState("West Lafayette, IN");
    const [description, setDescription] = useState("Bar crawl event for popular West Lafayette bars");
    const [date, setDate] = useState("4/20/2025");
    const [time, setTime] = useState("7:00pm");
    const [price, setPrice] = useState("$42.00 from TicketMaster"); //Adjust to add variable attribute to price for vendor
    const [isPublic, setIsPublic] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleViewEvent = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch("http://localhost:3000/api/events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, location, description, date, time, isPublic }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess("Event viewed successfully!");
                setTimeout(() => {
                    navigate("/accountpage");
                }, 1000);
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError("Connection error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div style={{marginLeft: "50px"}}>
            <div style={{ display: "flex", alignItems: "center"}}>
                <h2 style={{
                    textAlign: "left",
                    marginTop: "70px",
                    color: "black",
                    fontSize: "60px",
                    fontWeight: "bold",
                    marginRight: "-650px"
                }}>
                    {name}
                </h2>

                <button onClick={() => navigate("/trips")}  // Adjust navigate later
                // Also add condition if event is already part of trip
                    style={{
                        marginTop: "80px",
                        color: "white",
                        backgroundColor: "#007BFF",
                        fontSize: "20px",
                        padding: "10px 20px",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                    }}>
                    Add to Trip
                </button>
            </div>

                <div style={{
                    display: "flex",
                    alignItems: "center",
                    marginTop: "2px",
                }}>
                    <h2 style={{
                        textAlign: "left",
                        color: "black",
                        fontSize: "25px",
                    }}>
                        {location}
                    </h2>

                    <h2 style={{
                        textAlign: "left",
                        marginLeft: "50px",
                        color: "black",
                        fontSize: "25px",
                    }}>
                        {date} | {time}
                    </h2>
                </div>

                
                <h2 style={{ // Adjust so it continues onto next line
                    textAlign: "left",
                    marginTop: "10px",
                    color: "black",
                    fontSize: "15px",
                    fontWeight: "lighter"
                }}>
                    {description}
                </h2>

                <h2 style={{
                    textAlign: "left",
                    marginTop: "15px",
                    color: "black",
                    fontSize: "15px",
                }}>
                    Price History
                </h2>

                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "flex-end",
                    marginTop: "-200px",
                    marginRight: "500px"
                }}>
                    <h2 style={{
                        color: "black",
                        fontSize: "15px",
                    }}>
                        Reviews
                    </h2>
                    <h2 style={{
                        marginRight: "22px",
                        color: "black",
                        fontSize: "15px",
                    }}>
                        Price
                    </h2>

                    <button onClick={() => window.open("https://www.ticketmaster.com", "_blank")} style={{ //Update url later
                        marginRight: "-150px",
                        color: "white",
                        backgroundColor: "#4CAF50",
                        fontSize: "15px",
                        padding: "10px 20px",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                    }}>
                        {price}
                    </button>
                </div>

                {error && <p className="error">{error}</p>}
                {success && <div className="success-message">{success}</div>}
        </div>
    );
};

export default ViewEvent;