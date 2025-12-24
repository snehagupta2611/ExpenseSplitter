import React, { useEffect, useState } from "react";
import { firestore } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

const FriendsList = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFriends = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(firestore, "users", user.uid));
        if (userDoc.exists()) {
          const friendIds = userDoc.data().friends || [];
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
      } finally {
        setLoading(false);
      }
    };
    fetchFriends();
  }, [user]);

  if (loading) return <div className="text-white text-center mt-24">Loading your squad...</div>;

  return (
    <div className="pt-24 px-6 max-w-lg mx-auto">
      <div className="glass-card p-8 rounded-3xl text-white">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">My Friends</h2>
          <span className="bg-white/10 px-3 py-1 rounded-full text-xs border border-white/20">
            {friends.length} Total
          </span>
        </div>

        {error && <p className="text-red-300 mb-4 bg-red-500/20 p-3 rounded-xl border border-red-500/20">{error}</p>}

        {friends.length === 0 ? (
          <div className="text-center py-10 opacity-60">
            <p className="text-4xl mb-2">👋</p>
            <p>No friends yet. Time to add some travel buddies!</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {friends.map((f) => (
              <div key={f.id} className="glass-card bg-white/5 p-4 rounded-2xl border-white/10 flex items-center gap-4 transition-transform hover:scale-[1.02]">
                <div className="w-12 h-12 rounded-full bg-linear-to-br from-blue-400 to-indigo-600 flex items-center justify-center font-bold text-lg shadow-lg">
                  {f.name?.[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-lg leading-tight">{f.name}</p>
                  <p className="text-xs opacity-60 italic">{f.email}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsList;