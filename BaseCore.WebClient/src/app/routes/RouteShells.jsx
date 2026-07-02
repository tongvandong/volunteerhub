import React, { Suspense } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import ProtectedRoute from "../../components/ProtectedRoute";
import MainLayout from "../../components/layouts/MainLayout";
import ErrorBoundary from "../../components/ErrorBoundary";
import { getDefaultRouteByRole } from "../../utils/navigation";
import PageLoader from "./PageLoader";

export function PublicRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <PageLoader />;
  if (isAuthenticated) {
    return <Navigate to={getDefaultRouteByRole(user?.role)} replace />;
  }

  return children;
}

export function AppPage({ children, roles }) {
  return (
    <ProtectedRoute roles={roles}>
      <MainLayout>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>{children}</Suspense>
        </ErrorBoundary>
      </MainLayout>
    </ProtectedRoute>
  );
}
