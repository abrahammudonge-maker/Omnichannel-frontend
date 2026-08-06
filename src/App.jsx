import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { App as AntApp } from 'antd';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ConversationsPage } from './pages/ConversationsPage';
import { ConversationDetailPage } from './pages/ConversationDetailPage';
import { CustomersPage } from './pages/CustomersPage';
import { UsersPage } from './pages/UsersPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { TeamsPage } from './pages/TeamsPage';
import { TagsPage } from './pages/TagsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';
import { getCurrentUser, getNotifications, getStoredToken, setStoredToken } from './api';

const NOTIFICATION_POLL_INTERVAL_MS = 30000;

function RequireAuth({ isAuthenticated, children }) {
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  const { notification } = AntApp.useApp();
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getStoredToken()));
  const [unreadCount, setUnreadCount] = useState(0);
  const seenNotificationIds = useRef(new Set());
  const isFirstLoad = useRef(true);

  const refreshUnreadCount = useCallback(() => {
    const currentUser = getCurrentUser();
    if (!currentUser?.userId) return;
    getNotifications(currentUser.userId)
      .then((data) => {
        setUnreadCount(data.filter((n) => !n.isRead).length);

        if (!isFirstLoad.current) {
          const newOnes = data.filter((n) => !seenNotificationIds.current.has(n.id));
          newOnes.forEach((n) => {
            notification.info({ message: n.title, description: n.message, placement: 'topRight' });
          });
        }
        isFirstLoad.current = false;
        data.forEach((n) => seenNotificationIds.current.add(n.id));
      })
      .catch(() => {});
  }, [notification]);

  useEffect(() => {
    if (!isAuthenticated) return;
    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, NOTIFICATION_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isAuthenticated, refreshUnreadCount]);

  const handleSignOut = () => {
    setStoredToken(null);
    setIsAuthenticated(false);
  };

  return (
    <Layout
      isAuthenticated={isAuthenticated}
      onSignOut={handleSignOut}
      unreadCount={unreadCount}
    >
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated
            ? <Navigate to="/dashboard" replace />
            : <LoginPage onSignedIn={() => setIsAuthenticated(true)} />}
        />
        <Route
          path="/register"
          element={isAuthenticated
            ? <Navigate to="/dashboard" replace />
            : <RegisterPage onSignedIn={() => setIsAuthenticated(true)} />}
        />
        <Route path="/dashboard" element={<RequireAuth isAuthenticated={isAuthenticated}><DashboardPage /></RequireAuth>} />
        <Route path="/conversations" element={<RequireAuth isAuthenticated={isAuthenticated}><ConversationsPage /></RequireAuth>} />
        <Route path="/conversations/:id" element={<RequireAuth isAuthenticated={isAuthenticated}><ConversationDetailPage /></RequireAuth>} />
        <Route path="/customers" element={<RequireAuth isAuthenticated={isAuthenticated}><CustomersPage /></RequireAuth>} />
        <Route path="/team/users" element={<RequireAuth isAuthenticated={isAuthenticated}><UsersPage /></RequireAuth>} />
        <Route path="/team/departments" element={<RequireAuth isAuthenticated={isAuthenticated}><DepartmentsPage /></RequireAuth>} />
        <Route path="/team/teams" element={<RequireAuth isAuthenticated={isAuthenticated}><TeamsPage /></RequireAuth>} />
        <Route path="/tags" element={<RequireAuth isAuthenticated={isAuthenticated}><TagsPage /></RequireAuth>} />
        <Route
          path="/notifications"
          element={<RequireAuth isAuthenticated={isAuthenticated}><NotificationsPage onChange={refreshUnreadCount} /></RequireAuth>}
        />
        <Route path="/settings" element={<RequireAuth isAuthenticated={isAuthenticated}><SettingsPage /></RequireAuth>} />
        <Route path="/audit-log" element={<RequireAuth isAuthenticated={isAuthenticated}><AuditLogPage /></RequireAuth>} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/terms-of-service" element={<TermsOfServicePage />} />
        <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
