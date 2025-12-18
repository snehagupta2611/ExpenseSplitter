import React, { useEffect, useState } from "react";
import { firestore } from "../../firebase.js";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

const TripList = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrips = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(firestore, "users", user.uid));
        if (!userDoc.exists()) {
          setError("User document not found");
          setLoading(false);
          return;
        }

        const userData = userDoc.data();
        const tripIds = userData.trips || [];

        const tripProfiles = await Promise.all(
          tripIds.map(async (tid) => {
            const tripDoc = await getDoc(doc(firestore, "trips", tid));
            if (!tripDoc.exists()) return null;

            const tripData = tripDoc.data();

            const leaderDoc = await getDoc(doc(firestore, "users", tripData.leader));
            const leader = leaderDoc.exists()
              ? { name: leaderDoc.data().name, email: leaderDoc.data().email }
              : { name: "Unknown", email: "Not available" };

            return {
              id: tid,
              name: tripData.name,
              isActive: tripData.isActive,
              leader,
              members: tripData.members || [],
              createdAt: tripData.createdAt?.toDate?.() || null,
            };
          })
        );

        setTrips(tripProfiles.filter(Boolean));
      } catch (err) {
        console.error("Error fetching trips:", err);
        setError("Failed to load trips.");
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [user]);

  if (loading) return <p>Loading trips...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="max-w-lg mx-auto mt-6 p-6 border rounded shadow bg-white">
      <h2 className="text-xl font-bold mb-4">My Trips</h2>
      {trips.length === 0 ? (
        <p className="text-gray-500">No trips yet</p>
      ) : (
        <div className="grid gap-3">
          {trips.map((t) => (
            <div
              key={t.id}
              className="p-4 border rounded shadow-sm bg-gray-50 cursor-pointer hover:bg-gray-100"
              onClick={() => navigate(`/trips/${t.id}`)}
            >
              <p className="font-semibold">{t.name}</p>
              <p className="text-sm text-gray-600">
                Leader: {t.leader.name} ({t.leader.email})
              </p>
              <p className="text-sm text-gray-500">
                Members: {t.members.length}
              </p>
              <p className="text-sm text-gray-400">
                Status: {t.isActive ? "Active" : "Ended"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TripList;
