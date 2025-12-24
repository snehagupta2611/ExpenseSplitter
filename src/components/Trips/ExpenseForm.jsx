import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { firestore, firebaseConfig } from "../../firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

function ExpenseForm() {
  const { tripId } = useParams();
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [splitType, setSplitType] = useState("equal");
  const [splitBetween, setSplitBetween] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        if (!tripId) return;
        const tripRef = doc(firestore, "trips", tripId);
        const tripSnap = await getDoc(tripRef);

        if (tripSnap.exists()) {
          const tripData = tripSnap.data();
          if (tripData.members && Array.isArray(tripData.members)) {
            const uids = tripData.members;
            const membersData = await Promise.all(
              uids.map(async (uid) => {
                const userRef = doc(firestore, "users", uid);
                const userSnap = await getDoc(userRef);
                return userSnap.exists()
                  ? { uid, ...userSnap.data() }
                  : { uid, name: "Unknown User" };
              })
            );
            setMembers(membersData);
          }
        }
      } catch (error) {
        console.error("Error fetching members:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, [tripId]);

  const handleSplitChange = (uid) => {
    setSplitBetween((prev) =>
      prev.find((m) => m.uid === uid)
        ? prev.filter((m) => m.uid !== uid)
        : [...prev, { uid, name: members.find((m) => m.uid === uid)?.name, share: 0 }]
    );
  };

  const updateCustomShare = (uid, value) => {
    setSplitBetween((prev) =>
      prev.map((m) => (m.uid === uid ? { ...m, share: parseFloat(value) || 0 } : m))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !amount || !paidBy || splitBetween.length === 0) {
      alert("Please select at least one person to split with!");
      return;
    }

    let finalSplit = [];
    if (splitType === "equal") {
      const share = parseFloat(amount) / splitBetween.length;
      finalSplit = splitBetween.map((m) => ({ ...m, share }));
    } else {
      const totalCustom = splitBetween.reduce((sum, m) => sum + (m.share || 0), 0);
      if (Math.abs(totalCustom - parseFloat(amount)) > 0.01) {
        alert(`Custom split total (₹${totalCustom}) must equal total amount (₹${amount})`);
        return;
      }
      finalSplit = splitBetween;
    }

    try {
      const expensesRef = collection(firestore, "trips", tripId, "expenses");
      await addDoc(expensesRef, {
        title,
        description,
        amount: parseFloat(amount),
        paidBy,
        splitType,
        splitBetween: finalSplit,
        approved: false,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      });

      setTitle("");
      setDescription("");
      setAmount("");
      setPaidBy("");
      setSplitType("equal");
      setSplitBetween([]);
      alert("Expense added successfully!");
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  };

  if (loading) return <div className="text-white text-center mt-20">Loading members...</div>;

  return (
    <div className="pt-24 px-4 pb-10">
      <div className="glass-card max-w-lg mx-auto p-8 rounded-3xl text-white">
        <h2 className="text-2xl font-bold mb-6">Add Expense</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-sm font-medium opacity-80 ml-1">Expense Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 glass-input rounded-xl outline-none" required placeholder="Dinner at Grand Central" />
          </div>

          {/* Amount and Paid By */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium opacity-80 ml-1">Amount</label>
              <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full p-3 glass-input rounded-xl outline-none font-mono" required placeholder="0.00" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium opacity-80 ml-1">Paid By</label>
              <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)} className="w-full p-3 glass-input rounded-xl outline-none appearance-none" required>
                <option value="" className="text-black">Who paid?</option>
                {members.map((m) => (<option key={m.uid} value={m.uid} className="text-black">{m.name}</option>))}
              </select>
            </div>
          </div>

          {/* Split Type Selector */}
          <div className="p-4 glass-card bg-white/5 rounded-2xl border-white/5">
            <label className="block text-sm font-bold mb-3 uppercase tracking-wider opacity-60 text-center">Split Method</label>
            <div className="flex justify-center gap-8">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="equal" checked={splitType === "equal"} onChange={(e) => setSplitType(e.target.value)} className="accent-blue-400 w-4 h-4" /> 
                Equal
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="custom" checked={splitType === "custom"} onChange={(e) => setSplitType(e.target.value)} className="accent-blue-400 w-4 h-4" /> 
                Custom
              </label>
            </div>
          </div>

          {/* Split Between Members (THE FIX) */}
          <div className="space-y-3">
            <label className="text-sm font-medium opacity-80 ml-1">Split Between</label>
            <div className="glass-card bg-white/5 p-4 rounded-2xl space-y-3 border-white/10">
              {members.map((member) => {
                const selected = splitBetween.find((m) => m.uid === member.uid);
                return (
                  <div key={member.uid} className="flex items-center justify-between gap-3 p-1">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={!!selected}
                        onChange={() => handleSplitChange(member.uid)}
                        className="w-5 h-5 accent-blue-500 rounded-md"
                      />
                      <span className="text-sm font-medium">{member.name}</span>
                    </div>

                    {/* Show custom input only if 'Custom' is selected and user is checked */}
                    {splitType === "custom" && selected && (
                      <div className="relative">
                        <span className="absolute left-2 top-1.5 text-xs opacity-50">₹</span>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={selected.share || ""}
                          onChange={(e) => updateCustomShare(member.uid, e.target.value)}
                          className="w-24 p-1.5 pl-5 glass-input rounded-lg text-sm text-right outline-none border-blue-500/30 focus:border-blue-500"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-xl transition-all transform active:scale-95 mt-4">
            Add Expense
          </button>
        </form>
      </div>
    </div>
  );
}

export default ExpenseForm;