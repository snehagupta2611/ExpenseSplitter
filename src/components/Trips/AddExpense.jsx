import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { firestore } from "../../firebase";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

function AddExpense() {
  const { tripId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [title, setTitle] = useState(location.state?.scannedStore || "");
  const [amount, setAmount] = useState(location.state?.scannedAmount || "");
  const [description, setDescription] = useState(
    location.state?.scannedDate ? `Date on receipt: ${location.state.scannedDate}` : ""
  );
  
  const [loading, setLoading] = useState(false);
  const [tripMembers, setTripMembers] = useState([]);
  const [splitType, setSplitType] = useState("equal");
  const [customShares, setCustomShares] = useState({});

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const tripRef = doc(firestore, "trips", tripId);
        const tripSnap = await getDoc(tripRef);

        if (tripSnap.exists()) {
          const uids = tripSnap.data().members || [];
          
          const memberDetails = await Promise.all(
            uids.map(async (uid) => {
              const userRef = doc(firestore, "users", uid);
              const userSnap = await getDoc(userRef);
              return userSnap.exists() 
                ? { uid, name: userSnap.data().name || "Unknown" } 
                : { uid, name: "Unknown User" };
            })
          );

          setTripMembers(memberDetails);
          
          const initialShares = {};
          uids.forEach(uid => initialShares[uid] = 0);
          setCustomShares(initialShares);
        }
      } catch (err) {
        console.error("Error fetching member names:", err);
      }
    };
    fetchMembers();
  }, [tripId]);

  const handleShareChange = (uid, value) => {
    setCustomShares(prev => ({ ...prev, [uid]: parseFloat(value) || 0 }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const totalAmount = parseFloat(amount);
    
    if (splitType === "custom") {
      const sumShares = Object.values(customShares).reduce((a, b) => a + b, 0);
      if (Math.abs(sumShares - totalAmount) > 0.01) {
        alert(`Total of custom shares (₹${sumShares}) must equal total amount (₹${totalAmount})`);
        return;
      }
    }

    setLoading(true);
    try {
      const finalSplit = tripMembers.map((uid) => ({
        uid,
        share: splitType === "equal" 
          ? totalAmount / tripMembers.length 
          : customShares[uid],
      }));

      const expenseData = {
        title,
        amount: totalAmount,
        description,
        paidBy: user.uid,
        approved: false,
        splitType,
        createdAt: new Date(),
        splitBetween: finalSplit,
      };

      await addDoc(collection(firestore, "trips", tripId, "expenses"), expenseData);
      alert("Expense added with custom split!");
      navigate(`/trips/${tripId}/expenses`);
    } catch (err) {
      console.error("Error adding expense:", err);
      alert("Failed to save expense.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 px-6 max-w-lg mx-auto text-white">
      <div className="glass-card p-8 rounded-3xl border border-white/10">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          ✨ AI Review & Custom Split
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs opacity-50 mb-1 uppercase">Store</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-white/5 border border-white/10 p-3 rounded-xl" required />
          </div>

          <div>
            <label className="block text-xs opacity-50 mb-1 uppercase">Total Amount (₹)</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-xl font-mono" required />
          </div>

          <div className="flex gap-4 p-1 bg-white/5 rounded-2xl border border-white/10">
            <button 
              type="button"
              onClick={() => setSplitType("equal")}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${splitType === 'equal' ? 'bg-blue-500 shadow-lg' : 'opacity-50'}`}
            >Equal</button>
            <button 
              type="button"
              onClick={() => setSplitType("custom")}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${splitType === 'custom' ? 'bg-blue-500 shadow-lg' : 'opacity-50'}`}
            >Custom</button>
          </div>

          {splitType === "custom" && (
            <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10">
              <p className="text-[10px] uppercase opacity-50 text-center mb-2">Assign Shares Manually</p>
              {tripMembers.map((member) => (
                    <div key={member.uid} className="flex items-center justify-between gap-4">
                        <span className="text-sm truncate opacity-80">
                        {member.name}
                        </span>
                        
                        <div className="relative">
                        <span className="absolute left-2 top-2 text-xs opacity-40">₹</span>
                        <input 
                            type="number" 
                            placeholder="0"
                            className="w-24 bg-white/10 border border-white/10 p-2 pl-5 rounded-lg text-right text-sm outline-none"
                            onChange={(e) => handleShareChange(member.uid, e.target.value)}
                        />
                        </div>
                    </div>
                    ))}
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-600 py-4 rounded-2xl font-black uppercase tracking-widest transition-all">
            {loading ? "Processing..." : "Confirm & Save"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddExpense;