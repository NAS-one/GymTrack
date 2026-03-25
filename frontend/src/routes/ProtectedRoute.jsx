import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';

// Recibimos un array de roles permitidos (ej: ['administrador', 'entrenador'])
export function ProtectedRoute({ allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#09090b] text-white">Cargando...</div>;

  // 1. Si no está autenticado, lo mandamos al Login (ruta "/")
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // 2. Si definimos roles permitidos y el usuario NO tiene uno de ellos...
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirección inteligente según el rol que SÍ tiene:
    if (user.role === 'cliente') return <Navigate to="/client/dashboard" replace />;
    if (user.role === 'entrenador') return <Navigate to="/trainer/dashboard" replace />;
    return <Navigate to="/dashboard" replace />; // Fallback para admin
  }

  // 3. Si tiene permiso, renderiza la ruta
  return <Outlet />;
}