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

  if (loading) return <div className="text-white text-center mt-20">Loading trips...</div>;

  return (
    <div className="pt-24 px-6 max-w-2xl mx-auto">
      <div className="glass-card p-6 rounded-3xl text-white">
        <h2 className="text-2xl font-bold mb-6">My Trips</h2>
        {trips.length === 0 ? (
          <p className="opacity-60 italic text-center py-10">No adventures planned yet...</p>
        ) : (
          <div className="grid gap-4">
            {trips.map((t) => (
              <div
                key={t.id}
                className="glass-card bg-white/5 p-5 rounded-2xl cursor-pointer hover:bg-white/10 transition-all border-white/10"
                onClick={() => navigate(`/trips/${t.id}`)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xl font-bold">{t.name}</p>
                    <p className="text-sm opacity-70">Leader: {t.leader.name}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${t.isActive ? 'bg-green-500/40' : 'bg-red-500/40'}`}>
                    {t.isActive ? "ACTIVE" : "ENDED"}
                  </span>
                </div>
                <div className="mt-4 flex gap-4 text-xs opacity-60">
                  <p>Members: {t.members.length}</p>
                  <p>{t.createdAt ? new Date(t.createdAt).toLocaleDateString() : ""}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TripList;
