import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { firestore } from "../../firebase.js";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc
} from "firebase/firestore";

function FriendRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        if (!user) return;

        const requestsRef = collection(firestore, "users", user.uid, "requests");
        const querySnap = await getDocs(requestsRef);

        const requestsData = await Promise.all(
          querySnap.docs.map(async (reqDoc) => {
            const request = { id: reqDoc.id, ...reqDoc.data() };

            const senderRef = doc(firestore, "users", request.from);
            const senderSnap = await getDoc(senderRef);

            if (senderSnap.exists()) {
              return {
                ...request,
                sender: {
                  name: senderSnap.data().name,
                  email: senderSnap.data().email,
                },
              };
            } else {
              return {
                ...request,
                sender: { name: "Unknown", email: "Not available" },
              };
            }
          })
        );

        setRequests(requestsData);
      } catch (err) {
        console.error("Error fetching requests:", err);
        setError("Failed to load friend requests.");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [user]);

  const handleResponse = async (requestId, action, fromUid) => {
    try {
      const requestRef = doc(firestore, "users", user.uid, "requests", requestId);

      if (action === "accept") {

        const userRef = doc(firestore, "users", user.uid);
        const fromRef = doc(firestore, "users", fromUid);

        await updateDoc(userRef, {
          friends: [...(user.friends || []), fromUid],
        });

        const fromSnap = await getDoc(fromRef);
        if (fromSnap.exists()) {
          await updateDoc(fromRef, {
            friends: [...(fromSnap.data().friends || []), user.uid],
          });
        }

        await deleteDoc(requestRef);
      } else if (action === "reject") {
        await deleteDoc(requestRef);
      }

      setRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (err) {
      console.error("Error handling request:", err);
      setError("Failed to process request.");
    }
  };

  if (loading) return <p>Loading requests...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow">
      <h1 className="text-xl font-bold mb-4">Friend Requests</h1>
      {requests.length === 0 ? (
        <p>No friend requests.</p>
      ) : (
        requests.map((req) => (
          <div
            key={req.id}
            className="p-4 border rounded mb-3 flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">{req.sender.name}</p>
              <p className="text-sm text-gray-600">{req.sender.email}</p>
            </div>
            <div className="space-x-2">
              <button
                onClick={() => handleResponse(req.id, "accept", req.from)}
                className="px-3 py-1 bg-green-500 text-white rounded"
              >
                Accept
              </button>
              <button
                onClick={() => handleResponse(req.id, "reject", req.from)}
                className="px-3 py-1 bg-red-500 text-white rounded"
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default FriendRequests;
