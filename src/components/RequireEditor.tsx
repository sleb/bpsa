import { Navigate, Outlet } from "react-router";
import { useAuthState } from "@/hooks/useAuthState";
import { PageSpinner } from "@/components/Spinner";

export function RequireEditor() {
  const { userDoc, loading } = useAuthState();

  if (loading) {
    return <PageSpinner />;
  }

  if (!userDoc) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
