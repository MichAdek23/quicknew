import React from 'react';
import { Route, Switch } from 'wouter';
import { ModalProvider } from './context/ModalContext';
import { AuthProvider } from './context/AuthContext';

import Home from './pages/Home';

// Authentication Suite (Dual-Section Institutional UI)
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyOtpPage from './pages/VerifyOtpPage';

// Executive Admin Workspace
import AdminSignInPage from './pages/AdminSignInPage';
import AdminOverviewPage from './pages/AdminOverviewPage';
import AdminApplicationsPage from './pages/AdminApplicationsPage';
import AdminMaterialsPage from './pages/AdminMaterialsPage';
import AdminQuizzesPage from './pages/AdminQuizzesPage';
import AdminBlogPage from './pages/AdminBlogPage';
import AdminWebsiteSettingsPage from './pages/AdminWebsiteSettingsPage';
import AdminInquiriesPage from './pages/AdminInquiriesPage';
import AdminTeamPage from './pages/AdminTeamPage';
import AdminVideosPage from './pages/AdminVideosPage';
import AdminPaymentsPage from './pages/AdminPaymentsPage';
import AdminPremiumPlansPage from './pages/AdminPremiumPlansPage';

// Public Intelligence & Research Blog
import BlogIndexPage from './pages/BlogIndexPage';
import BlogPostPage from './pages/BlogPostPage';

// Physical Education & Sports Science Academic Portal
import DashboardMaterialsPage from './pages/DashboardMaterialsPage';
import DashboardMaterialDetailPage from './pages/DashboardMaterialDetailPage';
import DashboardExamRunnerPage from './pages/DashboardExamRunnerPage';
import DashboardScoresPage from './pages/DashboardScoresPage';
import DashboardBillingPage from './pages/DashboardBillingPage';
import DashboardProfilePage from './pages/DashboardProfilePage';

import NotFoundPage from './pages/NotFoundPage';
import { useLocation } from 'wouter';
import { useAuth } from './context/AuthContext';

function ProtectedAdminRoute({ component: Component }) {
  const { user, isAdmin, loading } = useAuth();
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    if (!loading) {
      if (!user) {
        setLocation('/admin/sign-in');
      } else if (!isAdmin) {
        setLocation('/admin/sign-in?denied=true');
      }
    }
  }, [user, isAdmin, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#050505] text-[#f0f0f0] flex flex-col items-center justify-center font-sans">
        <div className="flex items-center gap-3 text-white/60 font-mono text-xs uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-[#00873E] animate-ping" />
          <span>Verifying credentials…</span>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return <Component />;
}

function ProtectedStudentRoute({ component: Component }) {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();

  React.useEffect(() => {
    if (!loading && !user) {
      setLocation('/login?redirect=' + encodeURIComponent(location));
    }
  }, [user, loading, location, setLocation]);

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#050505] text-[#f0f0f0] flex flex-col items-center justify-center font-sans">
        <div className="flex items-center gap-3 text-white/60 font-mono text-xs uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-[#00873E] animate-ping" />
          <span>Verifying Academic Access…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <Component />;
}

function AuthVerificationCheck({ children }) {
  const { user, isVerified, loading, isAdmin } = useAuth();
  const [location, setLocation] = useLocation();

  React.useEffect(() => {
    if (!loading && user && !isAdmin && !isVerified) {
      const allowedPaths = ['/verify-otp', '/confirm-otp', '/verify', '/login', '/sign-in', '/signup', '/register'];
      if (!allowedPaths.includes(location) && !location.startsWith('/blog') && location !== '/') {
        setLocation(`/verify-otp?email=${encodeURIComponent(user.email || '')}&reason=unverified`);
      }
    }
  }, [user, isVerified, loading, isAdmin, location, setLocation]);

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <ModalProvider>
        <AuthVerificationCheck>
          <Switch>
          {/* Public Landing */}
          <Route path="/" component={Home} />

          {/* Authentication Suite */}
          <Route path="/login" component={LoginPage} />
          <Route path="/sign-in" component={LoginPage} />
          <Route path="/signup" component={SignupPage} />
          <Route path="/register" component={SignupPage} />
          <Route path="/forgot-password" component={ForgotPasswordPage} />
          <Route path="/reset-password" component={ResetPasswordPage} />
          <Route path="/verify-otp" component={VerifyOtpPage} />
          <Route path="/confirm-otp" component={VerifyOtpPage} />
          <Route path="/verify" component={VerifyOtpPage} />

          {/* Public Intelligence / Research Blog */}
          <Route path="/blog" component={BlogIndexPage} />
          <Route path="/blog/:slug" component={BlogPostPage} />

          {/* Physical Education & Sports Science Portal */}
          <Route path="/dashboard">
            {() => <ProtectedStudentRoute component={DashboardMaterialsPage} />}
          </Route>
          <Route path="/dashboard/materials">
            {() => <ProtectedStudentRoute component={DashboardMaterialsPage} />}
          </Route>
          <Route path="/dashboard/materials/:id">
            {() => <ProtectedStudentRoute component={DashboardMaterialDetailPage} />}
          </Route>
          <Route path="/dashboard/exams/:quizId">
            {() => <ProtectedStudentRoute component={DashboardExamRunnerPage} />}
          </Route>
          <Route path="/dashboard/scores">
            {() => <ProtectedStudentRoute component={DashboardScoresPage} />}
          </Route>
          <Route path="/dashboard/billing">
            {() => <ProtectedStudentRoute component={DashboardBillingPage} />}
          </Route>
          <Route path="/dashboard/profile">
            {() => <ProtectedStudentRoute component={DashboardProfilePage} />}
          </Route>

          {/* Institutional Admin Workspace (Guarded strictly for admins only) */}
          <Route path="/admin/sign-in" component={AdminSignInPage} />
          <Route path="/admin/overview">
            {() => <ProtectedAdminRoute component={AdminOverviewPage} />}
          </Route>
          <Route path="/admin">
            {() => <ProtectedAdminRoute component={AdminOverviewPage} />}
          </Route>
          <Route path="/admin/records">
            {() => <ProtectedAdminRoute component={AdminApplicationsPage} />}
          </Route>
          <Route path="/admin/applications">
            {() => <ProtectedAdminRoute component={AdminApplicationsPage} />}
          </Route>
          <Route path="/admin/applications/:id">
            {() => <ProtectedAdminRoute component={AdminApplicationsPage} />}
          </Route>
          <Route path="/admin/materials">
            {() => <ProtectedAdminRoute component={AdminMaterialsPage} />}
          </Route>
          <Route path="/admin/quizzes">
            {() => <ProtectedAdminRoute component={AdminQuizzesPage} />}
          </Route>
          <Route path="/admin/premium-plans">
            {() => <ProtectedAdminRoute component={AdminPremiumPlansPage} />}
          </Route>
          <Route path="/admin/premium">
            {() => <ProtectedAdminRoute component={AdminPremiumPlansPage} />}
          </Route>
          <Route path="/admin/blog">
            {() => <ProtectedAdminRoute component={AdminBlogPage} />}
          </Route>
          <Route path="/admin/inquiries">
            {() => <ProtectedAdminRoute component={AdminInquiriesPage} />}
          </Route>
          <Route path="/admin/website-settings">
            {() => <ProtectedAdminRoute component={AdminWebsiteSettingsPage} />}
          </Route>
          <Route path="/admin/team">
            {() => <ProtectedAdminRoute component={AdminTeamPage} />}
          </Route>
          <Route path="/admin/videos">
            {() => <ProtectedAdminRoute component={AdminVideosPage} />}
          </Route>
          <Route path="/admin/payments">
            {() => <ProtectedAdminRoute component={AdminPaymentsPage} />}
          </Route>

          {/* Fallback */}
          <Route component={NotFoundPage} />
        </Switch>
        </AuthVerificationCheck>
      </ModalProvider>
    </AuthProvider>
  );
}
