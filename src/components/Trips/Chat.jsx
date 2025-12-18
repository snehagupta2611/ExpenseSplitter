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

    // Listen for real-time updates
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const msgs = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const msg = { id: docSnap.id, ...docSnap.data() };

          // fetch sender details
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
    <>
      <div className="flex flex-col h-screen max-w-3xl mx-auto border rounded shadow bg-white">
        {/* Header */}
        <div className="p-4 border-b bg-gray-100">
          <h1 className="text-xl font-bold">Trip Chat</h1>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.length === 0 ? (
            <p className="text-gray-500 text-center">No messages yet</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender === user.uid ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs p-3 rounded-lg shadow ${
                    msg.sender === user.uid
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-black"
                  }`}
                >
                  <p className="font-semibold text-sm">
                    {msg.senderName || "Unknown"}
                  </p>
                  <p>{msg.text}</p>
                  <span className="block text-xs mt-1 opacity-70">
                    {msg.createdAt?.toDate
                      ? msg.createdAt.toDate().toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "sending..."}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={handleSend}
          className="p-3 border-t flex items-center bg-gray-50"
        >
          <input
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 border rounded-lg px-4 py-2 mr-2 focus:outline-none"
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Send
          </button>
        </form>
      </div>
    </>
  );
}

export default Chat;
