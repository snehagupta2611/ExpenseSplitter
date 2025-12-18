import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { firestore } from "../../firebase.js";
import {
  collection,
  doc,
  addDoc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function TripForm() {
  const { user } = useAuth();
  const [tripName, setTripName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        if (!user || !user.friends) return;
        const friendsData = await Promise.all(
          user.friends.map(async (friendUid) => {
            const friendRef = doc(firestore, "users", friendUid);
            const friendSnap = await getDoc(friendRef);
            if (friendSnap.exists()) {
              return { uid: friendUid, name: friendSnap.data().name, email: friendSnap.data().email };
            }
            return null;
          })
        );
        setFriends(friendsData.filter(Boolean));
      } catch (err) {
        console.error("Error fetching friends:", err);
        setError("Failed to load friends list.");
      }
    };

    fetchFriends();
  }, [user]);

  const handleMemberToggle = (uid) => {
    if (selectedMembers.includes(uid)) {
      setSelectedMembers(selectedMembers.filter((id) => id !== uid));
    } else {
      setSelectedMembers([...selectedMembers, uid]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tripName) {
      setError("Trip name is required.");
      return;
    }
    if (selectedMembers.length === 0) {
      setError("Select at least one member.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const tripsRef = collection(firestore, "trips");
      const memberUids = [user.uid, ...selectedMembers];

      const newTrip = await addDoc(tripsRef, {
        name: tripName,
        leader: user.uid,
        members: memberUids,
        isActive: true,
        createdAt: serverTimestamp(),
        endedAt: null,
      });

      const tripId = newTrip.id;

      await Promise.all(
        memberUids.map(async (uid) => {
          const userRef = doc(firestore, "users", uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const currentTrips = userSnap.data().trips || [];
            await updateDoc(userRef, {
              trips: [...currentTrips, tripId]
            });
          }
        })
      );

      setSuccess("Trip created successfully!");
      setTripName("");
      setSelectedMembers([]);
      console.log("New trip created:", tripId);
      navigate(`/trips/${tripId}`);
    } catch (err) {
      console.error("Error creating trip:", err);
      setError("Failed to create trip. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Create New Trip</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Trip Name"
          value={tripName}
          onChange={(e) => setTripName(e.target.value)}
          className="w-full p-2 mb-4 border rounded"
        />

        <div className="mb-4">
          <p className="font-semibold mb-2">Select Members:</p>
          {friends.length === 0 ? (
            <p className="text-gray-500 text-sm">No friends available</p>
          ) : (
            friends.map((friend) => (
              <label key={friend.uid} className="flex items-center space-x-2 mb-1">
                <input
                  type="checkbox"
                  checked={selectedMembers.includes(friend.uid)}
                  onChange={() => handleMemberToggle(friend.uid)}
                />
                <span>{friend.name} ({friend.email})</span>
              </label>
            ))
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          {loading ? "Creating..." : "Create Trip"}
        </button>
      </form>
    </div>
  );
}

export default TripForm;
