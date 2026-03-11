import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useNotificationsStore } from './store/notificationsStore';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import FormsListPage from './pages/FormsListPage';
import FormEditorPage from './pages/FormEditorPage';
import FormRespondPage from './pages/FormRespondPage';
import FormResultsPage from './pages/FormResultsPage';
import GroupsPage from './pages/GroupsPage';
import GroupDetailPage from './pages/GroupDetailPage';
import JoinGroupPage from './pages/JoinGroupPage';
import ProfilePage from './pages/ProfilePage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, token, isLoading } = useAuthStore();
  if (isLoading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-uat-blue"></div></div>;
  if (!token || !user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuthStore();
  if (token && user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  const { loadUser, user } = useAuthStore();
  const { connectSocket, fetchNotifications } = useNotificationsStore();

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      connectSocket(user.id);
      fetchNotifications();
    }
  }, [user?.id]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="formularios" element={<FormsListPage />} />
          <Route path="formularios/nuevo" element={<FormEditorPage />} />
          <Route path="formularios/:id/editar" element={<FormEditorPage />} />
          <Route path="formularios/:id/responder" element={<FormRespondPage />} />
          <Route path="formularios/:id/resultados" element={<FormResultsPage />} />
          <Route path="grupos" element={<GroupsPage />} />
          <Route path="grupos/:id" element={<GroupDetailPage />} />
          <Route path="unirse/:codigo" element={<JoinGroupPage />} />
          <Route path="perfil" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
