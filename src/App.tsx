import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { Toaster } from './components/ui/toaster';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Companies } from './pages/Companies';
import Workspace from './pages/Workspace';
import { Users } from './pages/Users';
import { Properties } from './pages/Properties';
import { Customers } from './pages/Customers';
import { Subscriptions } from './pages/Subscriptions';
import { PushNotifications } from './pages/PushNotifications';
import { NotificationTemplates } from './pages/NotificationTemplates';
import { Activity } from './pages/Activity';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Salesmen } from './pages/Salesmen';
import { AppVersions } from './pages/AppVersions';
import { Billing } from './pages/Billing';
import { AuditLog } from './pages/AuditLog';
import { Permissions } from './pages/config/Permissions';
import { MasterLists } from './pages/config/MasterLists';
import { Notices } from './pages/Notices';
import CompanyWorkspace from './pages/company/CompanyWorkspace';
import { ConfirmProvider } from './components/admin/ConfirmDialog';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const guarded = (el: React.ReactNode) => (
  <ProtectedRoute>
    <MainLayout>{el}</MainLayout>
  </ProtectedRoute>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ConfirmProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={guarded(<Navigate to="/dashboard" replace />)} />
            <Route path="/dashboard" element={guarded(<Dashboard />)} />
            <Route path="/workspace" element={guarded(<Workspace />)} />
            <Route path="/companies" element={guarded(<Companies />)} />
            <Route path="/users" element={guarded(<Users />)} />
            <Route path="/properties" element={guarded(<Properties />)} />
            <Route path="/customers" element={guarded(<Customers />)} />
            <Route path="/subscriptions" element={guarded(<Subscriptions />)} />
            <Route path="/billing" element={guarded(<Billing />)} />
            <Route path="/notification-templates" element={guarded(<NotificationTemplates />)} />
            <Route path="/push-notifications" element={guarded(<PushNotifications />)} />
            <Route path="/activity" element={guarded(<Activity />)} />
            <Route path="/reports" element={guarded(<Reports />)} />
            <Route path="/settings" element={guarded(<Settings />)} />
            <Route path="/salesmen" element={guarded(<Salesmen />)} />
            <Route path="/app-versions" element={guarded(<AppVersions />)} />
            <Route path="/audit-log" element={guarded(<AuditLog />)} />
            <Route path="/permissions" element={guarded(<Permissions />)} />
            <Route path="/master-lists" element={guarded(<MasterLists />)} />
            <Route path="/notices" element={guarded(<Notices />)} />
            <Route path="/c/:companyId" element={guarded(<CompanyWorkspace />)} />
            <Route path="/c/:companyId/:module" element={guarded(<CompanyWorkspace />)} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
        </ConfirmProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
