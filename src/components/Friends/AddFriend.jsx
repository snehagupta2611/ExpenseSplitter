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
    <div className="max-w-md mx-auto mt-10 p-6 border rounded shadow">
      <h1 className="text-xl font-bold mb-4">Add Friend</h1>
      <input
        type="email"
        placeholder="Enter friend's email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-2 mb-4 border rounded"
      />
      <button
        onClick={handleSendRequest}
        className="bg-blue-500 text-white px-4 py-2 rounded w-full"
      >
        Send Request
      </button>
      {message && <p className="mt-4 text-gray-700">{message}</p>}
    </div>
  );
}

export default AddFriend;
