import { useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
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
import { getCurrentUser, getNotifications, getStoredToken, setStoredToken } from './api';

function RequireAuth({ isAuthenticated, children }) {
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(getStoredToken()));
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(() => {
    const currentUser = getCurrentUser();
    if (!currentUser?.userId) return;
    getNotifications(currentUser.userId)
      .then((data) => setUnreadCount(data.filter((n) => !n.isRead).length))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isAuthenticated) refreshUnreadCount();
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
        <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
