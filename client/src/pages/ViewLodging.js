import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LeapsLogo from "../assets/Leapspng.png";

const ViewLodging = () => {
    // Initialized to example event based on design document
    const [name, setName] = useState("Lonely Lodge");
    const [location, setLocation] = useState("Island, OG");
    const [description, setDescription] = useState("Secluded Lodge on the outskirts of the island");
    const [checkIn, setCheckIn] = useState("");
    const [checkOut, setCheckOut] = useState("");
    const [price, setPrice] = useState("$96.00 from Marriot"); //Adjust to add variable attribute to price for vendor
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
                body: JSON.stringify({ name, location, description, checkIn, checkOut, isPublic }),
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
                

                <div style={{ display: "flex", alignItems: "center", gap: "20px", margin: "20px 0" }}>
                    <label>
                        Check-In:
                        <input 
                            type="date" 
                            value={checkIn} 
                            onChange={(e) => setCheckIn(e.target.value)}
                            style={{ marginLeft: "10px", padding: "5px", fontSize: "16px" }}
                        />
                    </label>

                    <label>
                        Check-Out:
                        <input 
                            type="date" 
                            value={checkOut} 
                            onChange={(e) => setCheckOut(e.target.value)}
                            style={{ marginLeft: "10px", padding: "5px", fontSize: "16px" }}
                        />
                    </label>
                </div>

                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    alignItems: "flex-end",
                    marginTop: "-250px",
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
                        marginRight: "-110px",
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

export default ViewLodging;