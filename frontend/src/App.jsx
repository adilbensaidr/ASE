import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard';
import PlayerList from './pages/PlayerList';
import PlayerDetail from './pages/PlayerDetail';
import PlayerCreate from './pages/PlayerCreate';
import PlayerEdit from './pages/PlayerEdit';
import Comparison from './pages/Comparison';
import Reports from './pages/Reports';
import ReportDetail from './pages/ReportDetail';

// Componente para rutas protegidas
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-xl font-bold text-secondary-900">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  // Si el usuario está logeado y accede a /login, redirige a home
  if (user && window.location.pathname === '/login') {
    return <Navigate to="/" replace />;
  }

  if (user && window.location.pathname === '/register') {
    return <Navigate to="/" replace />;
  }

  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Rutas privadas */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="players" element={<PlayerList />} />
        <Route path="players/new" element={<PlayerCreate />} />
        <Route path="players/:id" element={<PlayerDetail />} />
        <Route path="players/:id/edit" element={<PlayerEdit />} />
        <Route path="comparison" element={<Comparison />} />
        <Route path="reports" element={<Reports />} />
        <Route path="reports/:id" element={<ReportDetail />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
