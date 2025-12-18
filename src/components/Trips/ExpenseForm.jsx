import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { firestore } from "../../firebase";
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
                if (userSnap.exists()) {
                  return { uid, ...userSnap.data() };
                } else {
                  return { uid, name: "Unknown User" };
                }
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
    if (splitType === "equal") {
      setSplitBetween((prev) =>
        prev.find((m) => m.uid === uid)
          ? prev.filter((m) => m.uid !== uid)
          : [...prev, { uid, name: members.find((m) => m.uid === uid)?.name, share: 0 }]
      );
    } else {
      setSplitBetween((prev) =>
        prev.find((m) => m.uid === uid)
          ? prev.filter((m) => m.uid !== uid)
          : [...prev, { uid, name: members.find((m) => m.uid === uid)?.name, share: 0 }]
      );
    }
  };

  const updateCustomShare = (uid, value) => {
    setSplitBetween((prev) =>
      prev.map((m) => (m.uid === uid ? { ...m, share: parseFloat(value) || 0 } : m))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !amount || !paidBy || splitBetween.length === 0) {
      alert("Please fill all required fields!");
      return;
    }

    let finalSplit = [];

    if (splitType === "equal") {
      const share = parseFloat(amount) / splitBetween.length;
      finalSplit = splitBetween.map((m) => ({ ...m, share }));
    } else {
      const totalCustom = splitBetween.reduce((sum, m) => sum + (m.share || 0), 0);
      if (totalCustom !== parseFloat(amount)) {
        alert("Custom split does not add up to total amount!");
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

  if (loading) return <p>Loading members...</p>;

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Add Expense</h2>
      <form onSubmit={handleSubmit} className="space-y-4">

        <div>
          <label className="block font-medium">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block font-medium">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block font-medium">Paid By</label>
          <select
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select member</option>
            {members.map((member) => (
              <option key={member.uid} value={member.uid}>
                {member.name || member.email || member.uid}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-medium">Split Type</label>
          <div className="flex gap-4">
            <label>
              <input
                type="radio"
                name="splitType"
                value="equal"
                checked={splitType === "equal"}
                onChange={(e) => {
                  setSplitType(e.target.value);
                  setSplitBetween([]);
                }}
              />
              Equal
            </label>
            <label>
              <input
                type="radio"
                name="splitType"
                value="custom"
                checked={splitType === "custom"}
                onChange={(e) => {
                  setSplitType(e.target.value);
                  setSplitBetween([]);
                }}
              />
              Custom
            </label>
          </div>
        </div>

        <div>
          <label className="block font-medium">Split Between</label>
          <div className="space-y-2">
            {members.map((member) => {
              const selected = splitBetween.find((m) => m.uid === member.uid);
              return (
                <div key={member.uid} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!selected}
                    onChange={() => handleSplitChange(member.uid)}
                  />
                  <span>{member.name || member.email || member.uid}</span>
                  {splitType === "custom" && selected && (
                    <input
                      type="number"
                      placeholder="Share"
                      value={selected.share || ""}
                      onChange={(e) =>
                        updateCustomShare(member.uid, e.target.value)
                      }
                      className="w-24 p-1 border rounded"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
        >
          Add Expense
        </button>
      </form>
    </div>
  );
}

export default ExpenseForm;
