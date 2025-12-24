import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 w-full z-50 glass-card bg-opacity-10 px-6 py-4 flex justify-between items-center">
      <div className="text-2xl font-bold text-white tracking-tight cursor-pointer" onClick={() => navigate("/user")}>
        Split<span className="text-blue-300">Ease</span>
      </div>

      {user && (
        <div className="flex items-center gap-4">
          <span className="text-white hidden md:block">Hi, {user.name}</span>
          <button
            onClick={logout}
            className="bg-red-500 bg-opacity-60 hover:bg-opacity-80 text-white px-4 py-1.5 rounded-full transition-all text-sm backdrop-blur-md border border-white/20"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
