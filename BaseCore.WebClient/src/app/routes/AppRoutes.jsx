import React, { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import PageLoader from "./PageLoader";
import { appRoutes } from "./routeConfig";

const renderRoute = ({ path, element }) => (
  <Route key={path} path={path} element={element} />
);

export default function AppRoutes() {
  const { loading } = useAuth();

  if (loading) return <PageLoader />;

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>{appRoutes.map(renderRoute)}</Routes>
    </Suspense>
  );
}
