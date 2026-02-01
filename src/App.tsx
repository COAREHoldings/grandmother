import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import OnboardingPage from '@/pages/OnboardingPage';
import DashboardPage from '@/pages/DashboardPage';
import EntryPage from '@/pages/EntryPage';
import ProjectEditorPage from '@/pages/ProjectEditorPage';
import ReviewSimulationPage from '@/pages/ReviewSimulationPage';
import OpportunitiesPage from '@/pages/OpportunitiesPage';
import ResubmissionWizardPage from '@/pages/ResubmissionWizardPage';
import ManuscriptPage from '@/pages/ManuscriptPage';
import PricingPage from '@/pages/PricingPage';
import AdminDashboardPage from '@/pages/AdminDashboardPage';
import DocumentsPage from '@/pages/DocumentsPage';
import ResearchPage from '@/pages/ResearchPage';
import { Loader2 } from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/entry"
        element={
          <ProtectedRoute>
            <EntryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:id/edit"
        element={
          <ProtectedRoute>
            <ProjectEditorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:id/review"
        element={
          <ProtectedRoute>
            <ReviewSimulationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resubmission/:id"
        element={
          <ProtectedRoute>
            <ResubmissionWizardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/opportunities"
        element={
          <ProtectedRoute>
            <OpportunitiesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manuscript/:id"
        element={
          <ProtectedRoute>
            <ManuscriptPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pricing"
        element={<PricingPage />}
      />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents"
        element={
          <ProtectedRoute>
            <DocumentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects/:id/research"
        element={
          <ProtectedRoute>
            <ResearchPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#f8fafc',
              borderRadius: '12px',
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
