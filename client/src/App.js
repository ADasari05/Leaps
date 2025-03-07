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
import './App.css';
// import AccountPage from "./AccountPage";

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/signup" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/accountpage" element={<AccountPage />} />
        <Route path="/createtrip" element={<CreateTrip />} />
        <Route path="/trips" element={<Trips />} />
        <Route path="/trips/:id" element={<TripDetails />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/users" element={<Users />} />
        <Route path="/viewevent" element={<ViewEvent />} />
        <Route path="/viewlodging" element={<ViewLodging />} />
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

