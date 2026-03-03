import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../store/auth";

export default function RequireAuth({ children }) {
  const { token, booting } = useAuth();
  const location = useLocation();

  // while checking /auth/me on refresh
  if (booting) {
    return (
      <div className="min-h-screen grid place-items-center text-white bg-slate-900">
        Loading...
      </div>
    );
  }

  // not logged in -> go login
  if (!token) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
}