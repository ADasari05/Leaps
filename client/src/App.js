import "./styles/AccountPage.css";
import "./styles/auth.css";

/////////////////////////////////////////

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import AccountPage from "./pages/AccountPage";
import CreateTrip from "./pages/CreateTrip";
import Trips from "./pages/Trips";
import TripDetails from "./pages/TripDetails";
import ResetPassword from "./pages/ResetPassword";
import Friends from './pages/Friends';
import Users from './pages/Users';
import ViewEvent from "./pages/ViewEvent";
import ViewLodging from "./pages/ViewLodging";
import Events from "./pages/Events";
import CustomEvents from "./pages/CustomEvents";
import CreateNewEvent from "./pages/CreateNewEvent";
import Search from './pages/SearchPage';
import Share from './pages/Share';
import Lodgings from "./pages/Lodgings";
import Travel from "./pages/Travel";
import { isAuthenticated } from "./services/authService"; 
import { useState } from "react";
import './App.css';
// import AccountPage from "./AccountPage";

function App() {
  const [auth, setAuth] = useState(isAuthenticated());

  return (
    <Router>
      <Navbar />
      <Routes>

        <Route path="/" element={<Navigate to="/signup" />} />
        <Route path="/login" element={<Login setAuth={setAuth} />} />
        <Route path="/signup" element={<SignUp setAuth={setAuth} />} />

        {/* Public routes that allow guest access */}
        <Route path="/events" element={<Events />} />
        <Route path="/customevents" element={<CustomEvents />} />
        <Route path="/create-event" element={<CreateNewEvent />} />
        <Route path="/users" element={<Users />} /> 
        <Route path="/search" element={<Search />} />
        <Route path="/lodgings" element={<Lodgings />} />
        <Route path="/search" element={<Search />} />
        <Route path="/travel" element={<Travel />} />
        <Route path="/users" element={<Users />} /> 
        <Route path="/viewevent/:id" element={<ViewEvent />} />

        {/* Protected routes */}
        <Route path="/accountpage" element={
          <AccountPage />
        } />
        <Route path="/createtrip" element={
          auth ? <CreateTrip /> : <Navigate to="/login" />
        } />
        <Route path="/trips" element={
          <Trips />
        } />
        <Route path="/trips/:id" element={
          auth ? <TripDetails /> : <Navigate to="/login" />
        } />
        <Route path="/trips/:id/share" element={
          auth ? <Share /> : <Navigate to="/login" />
        } />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/friends" element={
          auth ? <Friends /> : <Navigate to="/login" />
        } />
      </Routes>
    </Router>
  );
}

export default App;

////////////////////////////////////

// import AccountPage from "./pages/AccountPage"; // Ensure the path is correct
// function App() {
//     return (
//         <div>
//             <AccountPage />
//         </div>
//     );
// }

// export default App;

