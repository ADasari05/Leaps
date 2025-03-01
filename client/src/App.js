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

