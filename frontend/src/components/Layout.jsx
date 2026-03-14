import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import logo from '../assets/logo.webp';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/', label: '📊 Dashboard', icon: '📊' },
    { to: '/players', label: '⚽ Jugadores', icon: '⚽' },
    { to: '/comparison', label: '🔄 Comparar', icon: '🔄' },
    { to: '/reports', label: '📋 Reportes', icon: '📋' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          w-64 bg-secondary-800 text-white p-6 transition-transform duration-200 z-40
          fixed inset-y-0 left-0 md:static md:translate-x-0
          ${sidebarOpen ? 'translate-x-0 w-full max-w-none' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <img src={logo} alt="ASE Athletics" className="object-cover" />
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden px-3 py-2 rounded-lg bg-secondary-700 hover:bg-secondary-600"
          >
            Cerrar
          </button>
        </div>

        <nav className="space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="block px-4 py-3 rounded-lg hover:bg-secondary-700 transition font-medium"
              onClick={() => setSidebarOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-secondary-700 mt-8 pt-8">
          <p className="text-sm text-gray-300 mb-2">Logeado como:</p>
          <p className="font-bold text-white mb-4">{user?.name || 'Usuario'}</p>
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition font-medium"
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between md:hidden">
          <div className="flex items-center gap-2">
            <img src={logo} alt="ASE Athletics" className="h-7 w-7 rounded object-cover" />
            <h1 className="text-xl font-bold text-secondary-900">ASE Analytics</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            ☰
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 px-6 py-4 text-center text-sm text-gray-500">
          <p>ASE Athletics © 2026 — Plataforma de Análisis de Fútbol</p>
        </footer>
      </div>
    </div>
  );
}
