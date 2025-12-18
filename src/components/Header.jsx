import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/signin");
  };

  return (
    <header className="w-full h-15 bg-blue-600 text-white shadow-md p-4 flex justify-between items-center relative">
      <div className="absolute left-1/2 transform -translate-x-1/2 text-2xl font-semibold">
        SplitEase
      </div>

      {user && (
        <div className="absolute right-6 flex items-center gap-3">
          <span className="font-medium">{user.name || "User"}</span>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-gray-100 transition cursor-pointer"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
