import React from "react";
import { useAuth } from "../context/AuthContext.jsx";
import {Link } from "react-router-dom";

const Dashboard = () => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;


  console.log("Current user:", user);

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow">
      <h1 className="text-2xl mb-4">Hello, {user?.name || "Guest"}</h1>
      <p className="mb-4">Welcome to the dashboard! Choose where to go:</p>

      <div className="space-y-2">
        <Link to="/friends/list" className="block bg-blue-500 text-white px-4 py-2 rounded">Friends List</Link>
        <Link to="/friends/requests" className="block bg-blue-500 text-white px-4 py-2 rounded">Friend Requests</Link>
        <Link to="/friends/add" className="block bg-blue-500 text-white px-4 py-2 rounded">Add Friend</Link>

        <Link to="/trips/list" className="block bg-green-500 text-white px-4 py-2 rounded">Trips List</Link>
        <Link to="/trips/create" className="block bg-green-500 text-white px-4 py-2 rounded">Create Trip</Link>
      </div>
    </div>
  );
};

export default Dashboard;
