import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { firestore } from "../../firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

function ExpenseList() {
  const { tripId } = useParams();
  const { user } = useAuth();

  const [expenses, setExpenses] = useState([]);
  const [leaderId, setLeaderId] = useState(null);
  const [members, setMembers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTripData = async () => {
      try {
        if (!tripId) return;

        const tripRef = doc(firestore, "trips", tripId);
        const tripSnap = await getDoc(tripRef);

        if (tripSnap.exists()) {
          const tripData = tripSnap.data();
          setLeaderId(tripData.leader);

          if (tripData.members) {
            const memberDetails = {};
            await Promise.all(
              tripData.members.map(async (uid) => {
                const userRef = doc(firestore, "users", uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                  memberDetails[uid] = userSnap.data().name || userSnap.data().email;
                } else {
                  memberDetails[uid] = "Unknown User";
                }
              })
            );
            setMembers(memberDetails);
          }
        }
      } catch (error) {
        console.error("Error fetching trip data:", error);
      }
    };

    fetchTripData();
  }, [tripId]);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        if (!tripId) return;

        const expensesRef = collection(firestore, "trips", tripId, "expenses");
        const expenseSnap = await getDocs(expensesRef);

        const expenseList = expenseSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setExpenses(expenseList);
      } catch (error) {
        console.error("Error fetching expenses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, [tripId]);

  const handleApprove = async (expenseId) => {
    if (user.uid !== leaderId) {
      alert("Only leader can approve or reject expenses.");
      return;
    }

    try {
      const expenseRef = doc(firestore, "trips", tripId, "expenses", expenseId);
      await updateDoc(expenseRef, { approved: true });
      setExpenses((prev) =>
        prev.map((e) => (e.id === expenseId ? { ...e, approved: true } : e))
      );
    } catch (error) {
      console.error("Error approving expense:", error);
    }
  };

  const handleReject = async (expenseId) => {
    if (user.uid !== leaderId) {
      alert("Only leader can approve or reject expenses.");
      return;
    }

    try {
      const expenseRef = doc(firestore, "trips", tripId, "expenses", expenseId);
      await deleteDoc(expenseRef);
      setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    } catch (error) {
      console.error("Error rejecting expense:", error);
    }
  };

  if (loading) return <p>Loading expenses...</p>;

  return (
    <div className="pt-24 px-6 max-w-3xl mx-auto pb-10 text-white">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Expenses</h2>
        <div className="glass-card px-4 py-2 rounded-full text-sm">
          Total Items: {expenses.length}
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="glass-card p-10 rounded-3xl text-center opacity-60 italic">No expenses recorded yet.</div>
      ) : (
        <ul className="space-y-4">
          {expenses.map((expense) => (
            <li key={expense.id} className="glass-card p-6 rounded-3xl border-white/10">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-blue-300">{expense.title}</h3>
                  <p className="opacity-70 text-sm italic">{expense.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-mono font-bold">₹{expense.amount}</p>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-widest ${expense.approved ? 'bg-green-500/30 text-green-300' : 'bg-yellow-500/30 text-yellow-300'}`}>
                    {expense.approved ? "Approved" : "Pending"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm bg-white/5 p-3 rounded-xl">
                <p><span className="opacity-50">Paid By:</span> {members[expense.paidBy]}</p>
                <div>
                   <p className="opacity-50 mb-1">Split Between:</p>
                   <div className="flex flex-wrap gap-1">
                     {expense.splitBetween?.map(s => (
                       <span key={s.uid} className="bg-white/10 px-2 py-0.5 rounded text-[10px]">{members[s.uid]}: ₹{s.share}</span>
                     ))}
                   </div>
                </div>
              </div>

              {(!expense.approved && user.uid === leaderId) && (
                <div className="mt-4 flex gap-2">
                  <button onClick={() => handleApprove(expense.id)} className="flex-1 bg-green-500/40 hover:bg-green-500 py-2 rounded-xl font-bold transition-all">Approve</button>
                  <button onClick={() => handleReject(expense.id)} className="flex-1 bg-red-500/40 hover:bg-red-500 py-2 rounded-xl font-bold transition-all">Reject</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ExpenseList;
