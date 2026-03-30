import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';

export function ProtectedRoute({ allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#09090b] text-white">Cargando...</div>;

  // 1. Si no está autenticado, lo mandamos al Login
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // 2. Si la ruta exige roles específicos y el usuario NO lo tiene
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirección inteligente
    if (user.role === 'cliente') return <Navigate to="/client/dashboard" replace />;
    if (user.role === 'entrenador') return <Navigate to="/trainer/dashboard" replace />;


    return <Navigate to="/" replace />;
  }

  // 3. Si todo está bien, renderiza la vista
  return <Outlet />;
}