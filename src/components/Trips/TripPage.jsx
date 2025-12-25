import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { firestore } from "../../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";
import ReceiptScanner from "../ReceiptScanner";

function TripPage() {
  const { tripId } = useParams();
  const { user } = useAuth();
  const [trip, setTrip] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ending, setEnding] = useState(false);
  const navigate = useNavigate();

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

  const handleScanComplete = (scannedData) => {
  navigate(`/trips/${tripId}/ai-review`, { 
    state: { 
      scannedAmount: scannedData.amount,
      scannedStore: scannedData.storeName,
      scannedDate: scannedData.date
    } 
  });
};

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
    <div className="pt-24 px-6 max-w-3xl mx-auto pb-10 text-white">
      <div className="glass-card p-8 rounded-3xl mb-6 text-center border-b-4 border-blue-500/30">
        <h1 className="text-4xl font-black mb-2 tracking-tight">{trip.name}</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 glass-card p-5 rounded-3xl">
          <h2 className="text-lg font-bold mb-4 border-b border-white/10 pb-2">Squad</h2>
          <div className="space-y-3">
            {members.map(member => (
              <div key={member.id} className="bg-white/5 p-2 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-linear-to-tr from-blue-400 to-purple-500 flex items-center justify-center font-bold text-xs">
                  {member.name[0]}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold truncate">{member.name}</p>
                  <p className="text-[10px] opacity-50 truncate">{member.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {trip.isActive && (
              <>
                <Link to={`/trips/${tripId}/chat`} className="glass-card p-6 rounded-3xl text-center hover:bg-blue-500/20 transition-all border-blue-500/20">
                  <span className="block text-2xl mb-1">💬</span>
                  <span className="font-bold">Chat</span>
                </Link>
                <div className="glass-card p-6 rounded-3xl text-center hover:bg-yellow-500/20 transition-all border-yellow-500/20 cursor-pointer relative">
                  <span className="block text-2xl mb-1">✨</span>
                  <span className="font-bold">AI Scan</span>
                  <ReceiptScanner onScanComplete={handleScanComplete} />
                </div>
                <Link to={`/trips/${tripId}/add-expense`} className="glass-card p-6 rounded-3xl text-center hover:bg-pink-500/20 transition-all border-pink-500/20">
                  <span className="block text-2xl mb-1">💰</span>
                  <span className="font-bold">Add Expense</span>
                </Link>
              </>
            )}
            <Link to={`/trips/${tripId}/expenses`} className="glass-card p-6 rounded-3xl text-center hover:bg-green-500/20 transition-all border-green-500/20">
              <span className="block text-2xl mb-1">📋</span>
              <span className="font-bold">History</span>
            </Link>
            <Link to={`/trips/${tripId}/split`} className="glass-card p-6 rounded-3xl text-center hover:bg-purple-500/20 transition-all border-purple-500/20">
              <span className="block text-2xl mb-1">⚖️</span>
              <span className="font-bold">Balances</span>
            </Link>
          </div>

          <button
            onClick={handleEndTrip}
            disabled={user.uid !== trip.leader || ending}
            className={`w-full p-4 rounded-3xl font-black uppercase tracking-tighter transition-all shadow-xl ${
              trip.isActive ? "bg-red-500/40 hover:bg-red-600" : "bg-blue-500/40 hover:bg-blue-600"
            } ${user.uid !== trip.leader ? "opacity-30 cursor-not-allowed" : ""}`}
          >
            {ending ? "Processing..." : trip.isActive ? "Finish Trip & Settle" : "Reactivate Journey"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TripPage;
