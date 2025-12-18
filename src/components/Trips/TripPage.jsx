import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { firestore } from "../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

function TripPage() {
  const { tripId } = useParams();
  const { user } = useAuth();
  const [trip, setTrip] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ending, setEnding] = useState(false);

  useEffect(() => {
    if (!tripId) return;

    const fetchTrip = async () => {
      try {
        const tripRef = doc(firestore, "trips", tripId);
        const tripSnap = await getDoc(tripRef);

        if (tripSnap.exists()) {
          const tripData = tripSnap.data();
          setTrip(tripData);

          if (tripData.members && tripData.members.length > 0) {
            const memberDocs = await Promise.all(
              tripData.members.map(async (uid) => {
                try {
                  const userRef = doc(firestore, "users", uid);
                  const userSnap = await getDoc(userRef);
                  if (userSnap.exists()) {
                    return { id: uid, ...userSnap.data() };
                  }
                  return null;
                } catch (err) {
                  console.error("Error fetching member:", err);
                  return null;
                }
              })
            );
            setMembers(memberDocs.filter((m) => m !== null));
          }
        } else {
          setError("No such trip found");
        }
      } catch (err) {
        console.error("Error fetching trip:", err);
        setError("Failed to load trip");
      } finally {
        setLoading(false);
      }
    };

    fetchTrip();
  }, [tripId]);

  const handleEndTrip = async () => {
    setEnding(true);
    if (trip?.isActive) {
      try {
        const tripRef = doc(firestore, "trips", tripId);
        await updateDoc(tripRef, { isActive: false });

        setTrip((prev) => ({ ...prev, isActive: false }));
      } catch (err) {
        console.error("Error ending trip:", err);
      } finally {
        setEnding(false);
      }
    } else {
      try {
        const tripRef = doc(firestore, "trips", tripId);
        await updateDoc(tripRef, { isActive: true });
        setTrip((prev) => ({ ...prev, isActive: true }));
      } catch (err) {
        console.error("Error reactivating trip:", err);
      } finally {
        setEnding(false);
      }
    }
  };

  if (loading) return <div>Loading trip details...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!trip) return <div>Trip not found.</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">{trip.name}</h1>
      <h2 className="text-xl font-semibold mb-2">Members:</h2>
      {members.length === 0 ? (
        <p className="text-gray-500">No members added yet</p>
      ) : (
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.id}
              className="p-2 border rounded-md bg-gray-50 hover:bg-gray-100"
            >
              <p className="font-medium">{member.name || "Unnamed User"}</p>
              <p className="text-sm text-gray-600">{member.email}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mt-6">

        {trip.isActive && (
          <>
            <Link
              to={`/trips/${tripId}/chat`}
              className="p-4 bg-blue-500 text-white rounded-lg text-center hover:bg-blue-700"
            >
              Chat
            </Link>

            <Link
              to={`/trips/${tripId}/add-expense`}
              className="p-4 bg-pink-600 text-white rounded-lg text-center hover:bg-pink-900"
            >
              Add Expense
            </Link>
          </>
        )}

        <Link
          to={`/trips/${tripId}/expenses`}
          className="p-4 bg-green-600 text-white rounded-lg text-center hover:bg-green-900"
        >
          Expenses
        </Link>

        <Link
          to={`/trips/${tripId}/split`}
          className="p-4 bg-purple-700 text-white rounded-lg text-center hover:bg-purple-900"
        >
          Splits
        </Link>
      </div>

      {trip && (
        <button
          onClick={handleEndTrip}
          className={`mt-6 mx-auto p-4 rounded-lg text-white ${
            ending
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-800"
          }`}
          disabled={user.uid !== trip.leader || ending}
        >
          {ending
            ? "Loading..."
            : trip.isActive
            ? "End Trip"
            : "Trip Ended - Reactivate"}
        </button>
      )}
    </div>
  );
}

export default TripPage;
