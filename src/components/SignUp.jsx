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
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="glass-card w-full max-w-md p-8 rounded-3xl text-white">
        <h1 className="text-3xl font-bold mb-6 text-center">Create Account</h1>
        <div className="space-y-4">
          <input type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-3 rounded-xl glass-input outline-none" />
          <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 rounded-xl glass-input outline-none" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 rounded-xl glass-input outline-none" />
          
          {error && <p className="text-red-300 text-sm bg-red-500/20 p-2 rounded-lg">{error}</p>}
          
          <button onClick={handleSignUp} disabled={loading} className="w-full py-3 bg-white text-blue-700 font-bold rounded-xl hover:bg-opacity-90 transition-all shadow-lg">
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </div>
        <p className="mt-6 text-center text-sm opacity-80">
          Already have an account? <button onClick={() => navigate("/signin")} className="underline font-bold">Sign In</button>
        </p>
      </div>
    </div>
  );
}

export default SignUp;
