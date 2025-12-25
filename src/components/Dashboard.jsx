import React from "react";
import { useAuth } from "../context/AuthContext.jsx";
import {Link } from "react-router-dom";

const Dashboard = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="text-white text-center mt-20">Loading...</div>;

  const cards = [
    { to: "/friends/list", label: "Friends List", color: "bg-blue-500" },
    { to: "/friends/requests", label: "Requests", color: "bg-indigo-500" },
    { to: "/friends/add", label: "Add Friend", color: "bg-cyan-500" },
    { to: "/trips/list", label: "My Trips", color: "bg-emerald-500" },
    { to: "/trips/create", label: "New Trip", color: "bg-purple-500" },
  ];

  return (
    <div className="pt-24 px-6 max-w-4xl mx-auto">
      <div className="glass-card p-8 rounded-3xl text-white mb-8">
        <h1 className="text-3xl font-bold mb-2">Hello, {user?.name || "Traveler"}</h1>
        <p className="opacity-80 text-lg">Manage your expenses and travel groups.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Link 
            key={card.to} 
            to={card.to} 
            className={`glass-card p-6 rounded-2xl hover:scale-105 transition-transform text-white font-semibold text-center`}
          >
            {card.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
