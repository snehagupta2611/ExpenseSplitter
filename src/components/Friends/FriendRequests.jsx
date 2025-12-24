import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { firestore } from "../../firebase.js";
import { collection, doc, getDocs, getDoc, updateDoc, deleteDoc } from "firebase/firestore";

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
            return {
              ...request,
              sender: senderSnap.exists() 
                ? { name: senderSnap.data().name, email: senderSnap.data().email }
                : { name: "Unknown", email: "Not available" },
            };
          })
        );
        setRequests(requestsData);
      } catch (err) {
        setError("Failed to load requests.");
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
        await updateDoc(userRef, { friends: [...(user.friends || []), fromUid] });
        const fromSnap = await getDoc(fromRef);
        if (fromSnap.exists()) {
          await updateDoc(fromRef, { friends: [...(fromSnap.data().friends || []), user.uid] });
        }
      }
      await deleteDoc(requestRef);
      setRequests((prev) => prev.filter((req) => req.id !== requestId));
    } catch (err) {
      setError("Failed to process request.");
    }
  };

  if (loading) return <div className="text-white text-center mt-24">Checking for requests...</div>;

  return (
    <div className="pt-24 px-6 max-w-md mx-auto">
      <div className="glass-card p-8 rounded-3xl text-white">
        <h1 className="text-2xl font-bold mb-6">Friend Requests</h1>
        
        {error && <p className="text-red-300 mb-4 bg-red-500/20 p-3 rounded-xl text-sm">{error}</p>}
        
        {requests.length === 0 ? (
          <div className="text-center py-8 opacity-60">
            <p className="text-4xl mb-2">Inbox Zero! 📥</p>
            <p className="text-sm">No pending friend requests.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req.id} className="glass-card bg-white/5 p-4 rounded-2xl border-white/10 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/40 flex items-center justify-center font-bold">
                    {req.sender.name[0]}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold truncate">{req.sender.name}</p>
                    <p className="text-[10px] opacity-60 truncate">{req.sender.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleResponse(req.id, "accept", req.from)}
                    className="flex-1 bg-green-500/60 hover:bg-green-500 py-2 rounded-xl text-xs font-bold transition-all"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleResponse(req.id, "reject", req.from)}
                    className="flex-1 bg-white/10 hover:bg-red-500/60 py-2 rounded-xl text-xs font-bold transition-all border border-white/10"
                  >
                    Ignore
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FriendRequests;