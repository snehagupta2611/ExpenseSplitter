import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { firestore } from "../../firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

function Split() {
  const { tripId } = useParams();
  const [members, setMembers] = useState({});
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const fetchSplits = async () => {
      try {
        if (!tripId) return;

        const tripRef = doc(firestore, "trips", tripId);
        const tripSnap = await getDoc(tripRef);
        if (!tripSnap.exists()) return;
        const tripData = tripSnap.data();

        const memberDetails = {};
        if (tripData.members) {
          await Promise.all(
            tripData.members.map(async (uid) => {
              const userRef = doc(firestore, "users", uid);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists()) {
                memberDetails[uid] =
                  userSnap.data().name || userSnap.data().email;
              } else {
                memberDetails[uid] = "Unknown User";
              }
            })
          );
        }
        setMembers(memberDetails);

        const expensesRef = collection(firestore, "trips", tripId, "expenses");
        const expenseSnap = await getDocs(expensesRef);

        const approvedExpenses = expenseSnap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((e) => e.approved);

        setExpenses(approvedExpenses);

        const memberSummary = {};
        tripData.members.forEach((uid) => {
          memberSummary[uid] = {
            paidExpenses: [],
            owedExpenses: [],
            totalPaid: 0,
            totalOwed: 0,
          };
        });

        approvedExpenses.forEach((expense) => {

          if (memberSummary[expense.paidBy]) {
            memberSummary[expense.paidBy].paidExpenses.push(expense);
            memberSummary[expense.paidBy].totalPaid += expense.amount;
          }


          expense.splitBetween?.forEach((s) => {
            if (memberSummary[s.uid]) {
              memberSummary[s.uid].owedExpenses.push({
                ...expense,
                owed: s.share,
              });
              memberSummary[s.uid].totalOwed += s.share;
            }
          });
        });

        setSummary(memberSummary);
      } catch (error) {
        console.error("Error fetching splits:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSplits();
  }, [tripId]);

  if (loading) return <p>Loading trip summary...</p>;

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white shadow rounded-lg">
      <h2 className="text-2xl font-bold mb-6">Trip Summary</h2>

      <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">Member</th>
            <th className="p-3 text-right">Total Paid</th>
            <th className="p-3 text-right">Total Owed</th>
            <th className="p-3 text-right">Net Balance</th>
            <th className="p-3 text-center">Details</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(summary).map((uid) => {
            const data = summary[uid];
            const net = data.totalPaid - data.totalOwed;

            return (
              <React.Fragment key={uid}>
                <tr className="border-t">
                  <td className="p-3">{members[uid] || uid}</td>
                  <td className="p-3 text-right">₹{data.totalPaid}</td>
                  <td className="p-3 text-right">₹{data.totalOwed}</td>
                  <td
                    className={`p-3 text-right font-semibold ${
                      net > 0
                        ? "text-green-600"
                        : net < 0
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {net > 0
                      ? `+₹${net} (Receive)`
                      : net < 0
                      ? `-₹${Math.abs(net)} (Pay)`
                      : "Settled"}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() =>
                        setExpanded(expanded === uid ? null : uid)
                      }
                      className="text-blue-500 hover:underline"
                    >
                      {expanded === uid ? "Hide" : "View"}
                    </button>
                  </td>
                </tr>

                {expanded === uid && (
                  <tr className="bg-gray-50">
                    <td colSpan="5" className="p-4">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-2">Paid Expenses</h4>
                          {data.paidExpenses.length === 0 ? (
                            <p className="text-gray-500">None</p>
                          ) : (
                            <ul className="list-disc list-inside text-gray-700">
                              {data.paidExpenses.map((exp) => (
                                <li key={exp.id}>
                                  {exp.title} – ₹{exp.amount}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">Owed Expenses</h4>
                          {data.owedExpenses.length === 0 ? (
                            <p className="text-gray-500">None</p>
                          ) : (
                            <ul className="list-disc list-inside text-gray-700">
                              {data.owedExpenses.map((exp) => (
                                <li key={exp.id}>
                                  {exp.title} – Owes ₹{exp.owed} (Paid by{" "}
                                  {members[exp.paidBy] || exp.paidBy})
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default Split;
