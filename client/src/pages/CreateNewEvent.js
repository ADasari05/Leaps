import { useNavigate } from "react-router-dom";
import "../styles/CreateNewEvent.css";

function CreateNewEvent() {
    const navigate = useNavigate();

    return (
        <div className="create-event-container">
            <h2>Create a New Event</h2>
            <p>Fill in the details below to add your event.</p>
            <button onClick={() => navigate(-1)} className="back-btn">Go Back</button>
        </div>
    );
}

export default CreateNewEvent;