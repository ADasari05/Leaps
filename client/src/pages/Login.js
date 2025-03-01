import { useState } from "react";
import { useNavigate } from "react-router-dom";
import LeapsLogo from "../assets/Leapspng.png";

const Login = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch("http://localhost:3000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            if (response.ok) {
                setSuccess("Login successful!");
                localStorage.setItem("token", data.token);
                setTimeout(() => {
                    navigate("/accountpage");
                }, 1000);
                //navigate("/accountpage");  // Change to your main page after login
            } else {
                localStorage.removeItem("token");
                setError(data.message);
            }
        } catch (err) {
            setError("Connection error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <img src={LeapsLogo} alt="Leaps Logo" className="logo" />
            <h2>Login</h2>

            {error && <p className="error">{error}</p>}
            {success && <div className="success-message">{success}</div>}

            <form onSubmit={handleLogin}>
                <input 
                    type="text"
                    placeholder="Username" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    required 
                />
                <input
                    type="password" 
                    placeholder="Password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                />
                <button type="submit" disabled={isLoading}>
                    {isLoading ? "Logging In..." : "Log In"}
                </button>
            </form>
            <p onClick={() => navigate("/signup")}>New User?</p>
        </div>
    );
};

export default Login;