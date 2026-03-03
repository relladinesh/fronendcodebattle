import { useAuth } from "../../store/auth";
import { useNavigate } from "react-router-dom";

export default function LogoutButton() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();      // calls backend logout
    navigate("/");  // redirect after logout
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold transition duration-200"
    >
      Logout
    </button>
  );
}