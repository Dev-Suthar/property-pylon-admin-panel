import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { Toaster } from './components/ui/toaster';
import { Loading } from './components/ui/loading';

// Lazy load pages for code splitting
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Companies = lazy(() => import('./pages/Companies'));
const Users = lazy(() => import('./pages/Users'));
const Properties = lazy(() => import('./pages/Properties'));
const Customers = lazy(() => import('./pages/Customers'));
const Subscriptions = lazy(() => import('./pages/Subscriptions'));
const PushNotifications = lazy(() => import('./pages/PushNotifications'));
const NotificationTemplates = lazy(() => import('./pages/NotificationTemplates'));
const Activity = lazy(() => import('./pages/Activity'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const Salesmen = lazy(() => import('./pages/Salesmen'));
const AppVersions = lazy(() => import('./pages/AppVersions'));
const Billing = lazy(() => import('./pages/Billing'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loading />
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Navigate to="/dashboard" replace />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/companies"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Companies />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Users />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/properties"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Properties />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Customers />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/subscriptions"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Subscriptions />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/billing"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Billing />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/notification-templates"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <NotificationTemplates />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/push-notifications"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <PushNotifications />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/activity"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Activity />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Reports />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Settings />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/salesmen"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Salesmen />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/app-versions"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <AppVersions />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
