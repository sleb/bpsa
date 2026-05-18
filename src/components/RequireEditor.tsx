import { Navigate, Outlet } from "react-router";
import { useAuthState } from "@/hooks/useAuthState";

export function RequireEditor() {
  const { userDoc, loading } = useAuthState();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!userDoc) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
