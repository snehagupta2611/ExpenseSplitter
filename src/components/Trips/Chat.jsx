import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { firestore } from "../../firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { useAuth } from "../../context/AuthContext";

function Chat() {
  const { tripId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tripId) return;

    const messagesRef = collection(firestore, "trips", tripId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const msgs = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const msg = { id: docSnap.id, ...docSnap.data() };

          if (msg.sender) {
            const senderRef = doc(firestore, "users", msg.sender);
            const senderSnap = await getDoc(senderRef);
            if (senderSnap.exists()) {
              msg.senderName = senderSnap.data().name;
              msg.senderEmail = senderSnap.data().email;
            } else {
              msg.senderName = "Unknown";
              msg.senderEmail = "";
            }
          }
          return msg;
        })
      );

      setMessages(msgs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tripId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      const messagesRef = collection(firestore, "trips", tripId, "messages");
      await addDoc(messagesRef, {
        sender: user.uid,
        text: newMessage.trim(),
        createdAt: serverTimestamp(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (loading) return <div>Loading chat...</div>;

  return (
    <div className="pt-24 h-screen flex flex-col max-w-3xl mx-auto p-4">
      <div className="glass-card flex-1 flex flex-col rounded-3xl overflow-hidden mb-4">
        <div className="p-4 border-b border-white/20 bg-white/10">
          <h1 className="text-xl font-bold text-white">Trip Chat</h1>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === user.uid ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl ${
                msg.sender === user.uid 
                ? "bg-blue-600 text-white rounded-tr-none" 
                : "glass-card text-white rounded-tl-none border-white/10"
              }`}>
                <p className="text-[10px] opacity-60 uppercase font-bold mb-1">{msg.senderName}</p>
                <p>{msg.text}</p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSend} className="p-4 border-t border-white/20 flex gap-2">
          <input
            type="text"
            className="flex-1 glass-input rounded-xl px-4 py-2 outline-none"
            placeholder="Message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button type="submit" className="bg-blue-500 text-white px-6 py-2 rounded-xl font-bold">Send</button>
        </form>
      </div>
    </div>
  );
}

export default Chat;
