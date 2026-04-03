import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";

export function ProtectedRoute({ allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-[#09090b] text-white">
        Cargando...
      </div>
    );

  // 1. Si no está autenticado, lo mandamos al Login
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // ==========================================
  // ARREGLO: Normalizamos el rol igual que en Login.jsx
  // ==========================================
  const rolDelUsuario = (user?.role || user?.rol || user?.id_rol || "")
    .toString()
    .toLowerCase();

  // 2. Si la ruta exige roles específicos y el usuario NO lo tiene
  // Nota: asegúrate de que cuando uses <ProtectedRoute allowedRoles={['entrenador']}>
  // en App.jsx, lo escribas en minúsculas.
  if (allowedRoles && !allowedRoles.includes(rolDelUsuario)) {
    // Redirección inteligente corregida con las mismas rutas de tu Login
    if (rolDelUsuario === "cliente" || rolDelUsuario === "3") {
      return <Navigate to="/client/dashboard" replace />;
    }

    if (rolDelUsuario === "entrenador" || rolDelUsuario === "2") {
      // Corregido: antes decía /trainer/dashboard
      return <Navigate to="/entrenador/dashboard" replace />;
    }

    // Si no es ninguno de los anteriores, lo devolvemos al login
    return <Navigate to="/" replace />;
  }

  // 3. Si todo está bien, renderiza la vista
  return <Outlet />;
}
