import React, { useEffect, useState } from "react";
import { firestore } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

const FriendsList = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFriends = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(firestore, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          const friendIds = data.friends || [];

          const friendProfiles = await Promise.all(
            friendIds.map(async (fid) => {
              const fdoc = await getDoc(doc(firestore, "users", fid));
              return fdoc.exists() ? { id: fid, ...fdoc.data() } : null;
            })
          );

          setFriends(friendProfiles.filter((f) => f !== null));
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchFriends();
  }, [user]);

  return (
    <div className="max-w-lg mx-auto mt-6 p-6 border rounded shadow bg-white">
      <h2 className="text-xl font-bold mb-4">My Friends</h2>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      {friends.length === 0 ? (
        <p className="text-gray-500">No friends yet</p>
      ) : (
        <div className="grid gap-3">
          {friends.map((f) => (
            <div key={f.id} className="p-4 border rounded shadow-sm bg-gray-50">
              <p className="font-semibold">{f.name}</p>
              <p className="text-sm text-gray-600">{f.email}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendsList;
