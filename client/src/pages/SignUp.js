import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LeapsLogo from "../assets/Leapspng.png";

<img src={LeapsLogo} alt="Leaps Logo" className="logo" />

const SignUp = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSignUp = async (e) => {
        e.preventDefault();
        const response = await fetch("http://localhost:3000/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (response.ok) {
            navigate("/login");
        } else {
            setError(data.message);
        }
    };

    return (
        <div className="auth-container">
            <img src="/images/Leapspng.png" alt="Leaps Logo" className="logo" />
            <h2>Create Account</h2>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSignUp}>
                <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="submit">Sign Up</button>
            </form>
            <p onClick={() => navigate("/login")}>Existing User?</p>
        </div>
    );
};

export default SignUp;
