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
    <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Expenses</h2>
      {expenses.length === 0 ? (
        <p className="text-gray-500">No expenses added yet.</p>
      ) : (
        <ul className="space-y-4">
          {expenses.map((expense) => (
            <li
              key={expense.id}
              className="border rounded-lg p-4 shadow-sm bg-gray-50"
            >
              <h3 className="text-lg font-bold">{expense.title}</h3>
              <p>{expense.description}</p>
              <p className="mt-2">
                <strong>Amount:</strong> ₹{expense.amount}
              </p>
              <p>
                <strong>Paid By:</strong>{" "}
                {members[expense.paidBy] || expense.paidBy}
              </p>
              <p>
                <strong>Split:</strong>
              </p>
              <ul className="ml-4 list-disc">
                {expense.splitBetween?.map((s) => (
                    <li key={s.uid}>
                      {members[s.uid] || s.uid}: ₹{s.share}
                    </li>
                  ))}
              </ul>
              <p className="mt-2">
                <strong>Status:</strong>{" "}
                {expense.approved ? (
                  <span className="text-green-600 font-semibold">Approved</span>
                ) : (
                  <span className="text-yellow-600 font-semibold">
                    Pending
                  </span>
                )}
              </p>

              {!expense.approved && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleApprove(expense.id)}
                    className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(expense.id)}
                    className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600"
                  >
                    Reject
                  </button>
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
