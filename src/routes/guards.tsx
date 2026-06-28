import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loading } from "@/components/loading";
import { useAuth } from "@/hooks/use-auth";

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loading message="Verificando autenticação..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function AdminRoute() {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loading message="Verificando permissões..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = profile?.role === "admin";
  const isLeader = profile?.role === "leader";
  const isMembersPage = location.pathname.startsWith("/admin/membros");

  if (!isAdmin && !isLeader) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLeader && !isMembersPage) {
    return <Navigate to="/admin/membros" replace />;
  }

  return <Outlet />;
}
