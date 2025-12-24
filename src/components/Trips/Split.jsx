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
    <div className="pt-24 px-6 max-w-5xl mx-auto pb-10">
      <div className="glass-card p-8 rounded-3xl text-white">
        <h2 className="text-3xl font-bold mb-8">Trip Balance Summary</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/20">
                <th className="p-4 font-semibold opacity-70">Member</th>
                <th className="p-4 font-semibold opacity-70 text-right">Paid</th>
                <th className="p-4 font-semibold opacity-70 text-right">Owed</th>
                <th className="p-4 font-semibold opacity-70 text-right">Net Balance</th>
                <th className="p-4 font-semibold opacity-70 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(summary).map((uid) => {
                const data = summary[uid];
                const net = data.totalPaid - data.totalOwed;
                return (
                  <React.Fragment key={uid}>
                    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 font-bold">{members[uid] || uid}</td>
                      <td className="p-4 text-right">₹{data.totalPaid}</td>
                      <td className="p-4 text-right">₹{data.totalOwed}</td>
                      <td className={`p-4 text-right font-bold ${net > 0 ? "text-green-300" : net < 0 ? "text-red-300" : "text-gray-400"}`}>
                        {net > 0 ? `+₹${net}` : net < 0 ? `-₹${Math.abs(net)}` : "Settled"}
                      </td>
                      <td className="p-4 text-center">
                        <button onClick={() => setExpanded(expanded === uid ? null : uid)} className="bg-white/10 px-4 py-1 rounded-full text-xs hover:bg-white/20 transition-all border border-white/10">
                          {expanded === uid ? "Hide" : "Details"}
                        </button>
                      </td>
                    </tr>
                    {expanded === uid && (
                      <tr className="bg-white/5">
                        <td colSpan="5" className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-2">
                            <div className="glass-card bg-green-500/10 p-4 rounded-xl border-green-500/20">
                              <h4 className="text-green-300 font-bold mb-2 text-xs uppercase tracking-tighter">Paid For</h4>
                              {data.paidExpenses.map(exp => <div key={exp.id} className="text-sm py-1 border-b border-white/5">{exp.title} — ₹{exp.amount}</div>)}
                            </div>
                            <div className="glass-card bg-red-500/10 p-4 rounded-xl border-red-500/20">
                              <h4 className="text-red-300 font-bold mb-2 text-xs uppercase tracking-tighter">Owes To Group</h4>
                              {data.owedExpenses.map(exp => <div key={exp.id} className="text-sm py-1 border-b border-white/5">{exp.title} — ₹{exp.owed}</div>)}
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
      </div>
    </div>
  );
}

export default Split;
