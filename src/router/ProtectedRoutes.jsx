// ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProtectedRoute() {
  const token = localStorage.getItem("token");
  const location = useLocation();

  if (!token) {
    // redirect to login, remembering where the user was headed
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
