import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";

import Dashboard from "./components/Dashboard.jsx";
import SignIn from "./components/SignIn.jsx";
import SignUp from "./components/SignUp.jsx";
import FriendsList from "./components/Friends/FriendsList.jsx";
import FriendRequests from "./components/Friends/FriendRequests.jsx";
import AddFriend from "./components/Friends/AddFriend.jsx";
import TripList from "./components/Trips/TripList.jsx";
import TripForm from "./components/Trips/TripForm.jsx";
import TripPage from "./components/Trips/TripPage.jsx";
import Chat from "./components/Trips/Chat.jsx";
import ExpenseList from "./components/Trips/ExpenseList.jsx";
import ExpenseForm from "./components/Trips/ExpenseForm.jsx";
import Split from "./components/Trips/Split.jsx";
import Header from "./components/Header.jsx"

function App() {
  const { user } = useAuth();

  const PrivateRoute = ({ children }) => user ? children : <Navigate to="/signin" />;

  return (
    <Router>
      <Header/>
      <Routes>
        <Route path="/" element={<Navigate to={user ? "/user" : "/signin"} />} />

        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />

        <Route path="/user" element={<PrivateRoute><Dashboard /></PrivateRoute>} />

        <Route path="/friends/list" element={<PrivateRoute><FriendsList /></PrivateRoute>} />
        <Route path="/friends/requests" element={<PrivateRoute><FriendRequests /></PrivateRoute>} />
        <Route path="/friends/add" element={<PrivateRoute><AddFriend /></PrivateRoute>} />

        <Route path="/trips/list" element={<PrivateRoute><TripList /></PrivateRoute>} />
        <Route path="/trips/create" element={<PrivateRoute><TripForm /></PrivateRoute>} />
        <Route path="/trips/:tripId" element={<PrivateRoute><TripPage /></PrivateRoute>} />
        <Route path="/trips/:tripId/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
        <Route path="/trips/:tripId/expenses" element={<PrivateRoute><ExpenseList /></PrivateRoute>} />
        <Route path="/trips/:tripId/add-expense" element={<PrivateRoute><ExpenseForm /></PrivateRoute>} />
        <Route path="/trips/:tripId/split" element={<PrivateRoute><Split /></PrivateRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
