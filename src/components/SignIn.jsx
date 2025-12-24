import { useState, useEffect } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase.js";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/user");
  }, [user, navigate]);

  const handleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("User signed in:", userCredential.user.email);
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
        <h1 className="text-3xl font-bold mb-6 text-center text-white">Welcome Back</h1>
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 rounded-xl glass-input outline-none focus:ring-2 ring-blue-400"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded-xl glass-input outline-none focus:ring-2 ring-blue-400"
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="text-red-300 text-sm">{error}</p>}
          <button
            onClick={handleSignIn}
            className="w-full py-3 bg-white text-blue-700 font-bold rounded-xl hover:bg-opacity-90 transition-all shadow-lg"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>
        <p className="mt-6 text-center text-sm opacity-80">
          New here? <button onClick={() => navigate("/signup")} className="underline font-bold">Create account</button>
        </p>
      </div>
    </div>
  );
}

export default SignIn;
