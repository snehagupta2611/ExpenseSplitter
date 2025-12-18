import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, firestore } from "../firebase.js";
import { useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";

function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async () => {
    setError("");
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      await setDoc(doc(firestore, "users", uid), {
        uid,
        name,
        email,
        createdAt: new Date(),
        friends: []
      });

      console.log("User signed up:", uid);

      navigate("/user");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Sign Up</h1>
      <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 mb-4 border rounded" />
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 mb-4 border rounded" />
      <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 mb-4 border rounded" />
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <button onClick={handleSignUp} disabled={loading} className="bg-blue-500 text-white px-4 py-2 rounded w-full">
        {loading ? "Signing up..." : "Sign Up"}
      </button>
    </div>
    <button
        onClick={() => navigate("/signin")}
        disabled={loading}
        className="max-w-md mx-auto border shadow bg-red-500 text-white px-4 py-2 rounded flex justify-center items-center mt-5 cursor-pointer"
        >
        Sign In
    </button>
    </>
  );
}

export default SignUp;
