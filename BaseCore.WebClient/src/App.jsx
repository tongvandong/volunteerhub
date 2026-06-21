import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/layouts/MainLayout';
import PublicLayout from './components/layouts/PublicLayout';
import SharedLayout from './components/layouts/SharedLayout';
import ErrorBoundary from './components/ErrorBoundary';
import { getDefaultRouteByRole } from './utils/navigation';

const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const LandingPage = lazy(() => import('./pages/public/LandingPage'));
const EventList = lazy(() => import('./pages/public/EventList'));
const EventDetail = lazy(() => import('./pages/public/EventDetail'));
const VerifyCertificate = lazy(() => import('./pages/public/VerifyCertificate'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Channel = lazy(() => import('./pages/shared/Channel'));
const PublicProfile = lazy(() => import('./pages/shared/PublicProfile'));
const Profile = lazy(() => import('./pages/volunteer/Profile'));
const Achievements = lazy(() => import('./pages/volunteer/Achievements'));
const Activity = lazy(() => import('./pages/volunteer/Activity'));
const MyEvents = lazy(() => import('./pages/organizer/MyEvents'));
const EventForm = lazy(() => import('./pages/organizer/EventForm'));
const ManageEvent = lazy(() => import('./pages/organizer/ManageEvent/index'));
const OrganizerVerification = lazy(() => import('./pages/organizer/OrganizerVerification'));
const OrganizerInsights = lazy(() => import('./pages/organizer/OrganizerInsights'));
const MySponsorships = lazy(() => import('./pages/sponsor/MySponsorships'));
const SponsorProfile = lazy(() => import('./pages/sponsor/SponsorProfile'));
const AdminEvents = lazy(() => import('./pages/admin/AdminEvents'));
const AdminVerifications = lazy(() => import('./pages/admin/AdminVerifications'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminSkills = lazy(() => import('./pages/admin/AdminSkills'));
const AdminBadges = lazy(() => import('./pages/admin/AdminBadges'));
const AdminCatalog = lazy(() => import('./pages/admin/AdminCatalog'));
const AdminRatings = lazy(() => import('./pages/admin/AdminRatings'));
const AdminFinanceWatch = lazy(() => import('./pages/admin/AdminFinanceWatch'));
const AdminExport = lazy(() => import('./pages/admin/AdminExport'));
const AdminMonitoring = lazy(() => import('./pages/admin/AdminMonitoring'));

const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <PageLoader />;
  if (isAuthenticated) return <Navigate to={getDefaultRouteByRole(user?.role)} replace />;

  return children;
};

const AppPage = ({ children, roles }) => (
  <ProtectedRoute roles={roles}>
    <MainLayout>
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>{children}</Suspense>
      </ErrorBoundary>
    </MainLayout>
  </ProtectedRoute>
);

function AppRoutes() {
  const { loading } = useAuth();
  // Trong khi xác thực token với BE: gate toàn cục để layout không nháy
  // giữa PublicLayout và MainLayout (đặc biệt ở /events qua SharedLayout).
  if (loading) return <PageLoader />;
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<PublicLayout><LandingPage /></PublicLayout>} />
        <Route path="/events" element={<SharedLayout><EventList /></SharedLayout>} />
        <Route path="/events/:id" element={<SharedLayout><EventDetail /></SharedLayout>} />
        <Route path="/verify/:code" element={<PublicLayout><VerifyCertificate /></PublicLayout>} />
        <Route path="/verify/check" element={<PublicLayout><VerifyCertificate /></PublicLayout>} />

        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        <Route path="/dashboard" element={<AppPage><Dashboard /></AppPage>} />
        <Route path="/notifications" element={<AppPage><Notifications /></AppPage>} />
        <Route path="/channels/:id" element={<AppPage><Channel /></AppPage>} />

        <Route path="/profile" element={<AppPage roles={['Volunteer']}><Profile /></AppPage>} />
        <Route path="/profile/passport" element={<Navigate to="/profile?tab=passport" replace />} />
        <Route path="/profile/:userId" element={<AppPage><PublicProfile /></AppPage>} />
        <Route path="/activity" element={<AppPage roles={['Volunteer']}><Activity /></AppPage>} />
        <Route path="/my-registrations" element={<Navigate to="/activity" replace />} />
        <Route path="/my-donations" element={<Navigate to="/activity?tab=donations" replace />} />
        <Route path="/achievements" element={<AppPage roles={['Volunteer']}><Achievements /></AppPage>} />
        <Route path="/my-badges" element={<Navigate to="/achievements" replace />} />
        <Route path="/my-certificates" element={<Navigate to="/achievements?tab=certificates" replace />} />

        <Route path="/my-events" element={<AppPage roles={['Organizer']}><MyEvents /></AppPage>} />
        <Route path="/events/create" element={<AppPage roles={['Organizer']}><EventForm /></AppPage>} />
        <Route path="/events/:id/edit" element={<AppPage roles={['Organizer']}><EventForm /></AppPage>} />
        <Route path="/events/:id/manage" element={<AppPage roles={['Organizer']}><ManageEvent /></AppPage>} />
        <Route path="/organizer/verification" element={<AppPage roles={['Organizer']}><OrganizerVerification /></AppPage>} />
        <Route path="/organizer/insights" element={<AppPage roles={['Organizer']}><OrganizerInsights /></AppPage>} />

        <Route path="/my-sponsorships" element={<AppPage roles={['Sponsor']}><MySponsorships /></AppPage>} />
        <Route path="/sponsor/profile" element={<AppPage roles={['Sponsor']}><SponsorProfile /></AppPage>} />

        <Route path="/admin/events" element={<AppPage roles={['Admin']}><AdminEvents /></AppPage>} />
        <Route path="/admin/users" element={<AppPage roles={['Admin']}><AdminUsers /></AppPage>} />
        <Route path="/admin/organizers" element={<Navigate to="/admin/users?tab=organizers" replace />} />
        <Route path="/admin/volunteers" element={<Navigate to="/admin/users?tab=volunteers" replace />} />
        <Route path="/admin/sponsors" element={<Navigate to="/admin/users?tab=sponsors" replace />} />
        <Route path="/admin/verifications" element={<AppPage roles={['Admin']}><AdminVerifications /></AppPage>} />
        <Route path="/admin/organizer-verifications" element={<Navigate to="/admin/verifications?tab=organizers" replace />} />
        <Route path="/admin/volunteer-verifications" element={<Navigate to="/admin/verifications?tab=volunteers" replace />} />
        <Route path="/admin/catalog" element={<AppPage roles={['Admin']}><AdminCatalog /></AppPage>} />
        <Route path="/admin/categories" element={<Navigate to="/admin/catalog?tab=categories" replace />} />
        <Route path="/admin/skills" element={<Navigate to="/admin/catalog?tab=skills" replace />} />
        <Route path="/admin/badges" element={<Navigate to="/admin/catalog?tab=badges" replace />} />
        <Route path="/admin/ratings" element={<AppPage roles={['Admin']}><AdminRatings /></AppPage>} />
        <Route path="/admin/finance" element={<AppPage roles={['Admin']}><AdminFinanceWatch /></AppPage>} />
        <Route path="/admin/monitoring" element={<AppPage roles={['Admin']}><AdminMonitoring /></AppPage>} />
        <Route path="/admin/export" element={<AppPage roles={['Admin']}><AdminExport /></AppPage>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
