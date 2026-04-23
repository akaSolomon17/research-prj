import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "@/features/Auth/auth-context";

export const ProtectedRoute = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-600">
        Checking session...
      </div>
    );
  }
  if (!session) {
    return <Navigate replace to="/login" />;
  }
  return <Outlet />;
};
