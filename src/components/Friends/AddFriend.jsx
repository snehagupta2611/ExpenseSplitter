import React, { useState } from "react";
import { firestore } from "../../firebase.js";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext.jsx";

function AddFriend() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSendRequest = async () => {
    setMessage("");
    if (!user) return;

    try {
      const q = query(collection(firestore, "users"), where("email", "==", email));
      const querySnap = await getDocs(q);

      if (querySnap.empty) {
        setMessage("User not found.");
        return;
      }

      const targetUserDoc = querySnap.docs[0];
      const targetUid = targetUserDoc.id;
      const targetData = targetUserDoc.data();

      if (user.friends?.includes(targetUid)) {
        setMessage("You are already friends with this user.");
        return;
      }

      const requestsRef = collection(firestore, "users", targetUid, "requests");
      const requestSnap = await getDocs(requestsRef);
      const alreadyRequested = requestSnap.docs.some(
        (doc) => doc.data().from === user.uid && doc.data().status === "pending"
      );

      if (alreadyRequested) {
        setMessage("Friend request already sent.");
        return;
      }

      await addDoc(requestsRef, {
        from: user.uid,
        status: "pending",
        createdAt: new Date(),
      });

      setMessage(`Friend request sent to ${targetData.name}`);
      setEmail("");
    } catch (err) {
      console.error(err);
      setMessage("Failed to send friend request.");
    }
  };

  return (
    <div className="pt-24 px-4 flex items-center justify-center">
      <div className="glass-card w-full max-w-md p-8 rounded-3xl text-white">
        <h1 className="text-2xl font-bold mb-2">Add Friend</h1>
        <p className="opacity-70 mb-6 text-sm">Find your travel buddies by their email.</p>
        
        <input
          type="email"
          placeholder="friend@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-4 glass-input rounded-2xl outline-none mb-4"
        />
        
        <button
          onClick={handleSendRequest}
          className="w-full py-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95"
        >
          Send Friend Request
        </button>
        
        {message && (
          <div className="mt-4 p-3 rounded-xl bg-white/10 text-center text-sm border border-white/10 animate-pulse">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}

export default AddFriend;
