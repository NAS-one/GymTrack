import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { ConfirmProvider } from "./contexts/ConfirmContext";
import { AuthProvider } from "./contexts/AuthProvider";

// Guardián y Layouts
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { AdminLayout } from "./layouts/AdminLayout";
import { ClientLayout } from "./layouts/ClientLayout";
import { EntrenadorLayout } from "./layouts/EntrenadorLayout";

// Páginas (Estructura actualizada de master)
import { Login } from "./pages/auth/Login";
import { Register } from "./pages/auth/Register";
import { ActivateAccount } from "./pages/auth/ActivateAccount";
import { Dashboard as AdminDashboard } from "./pages/admin/Dashboard";
import { ClientDashboard } from "./pages/client/Dashboard";
import { Rutina } from "./pages/client/Rutina";
import { Progreso } from "./pages/client/Progreso";
import { Acceso as ClientAcceso } from "./pages/client/Acceso";
import { Perfil } from "./pages/client/Perfil";
import { Clientes } from "./pages/admin/Clientes";
import { Planes } from "./pages/admin/Planes";
import { Finanzas } from "./pages/admin/Finanzas";
import { Inventario } from "./pages/admin/Inventario";
import { Ejercicios } from "./pages/admin/Ejercicios";
import { Acceso } from "./pages/admin/Acceso";
import { Asistencia } from "./pages/admin/Asistencia";
import { Equipo } from "./pages/admin/Equipo";
import { Reportes } from "./pages/admin/Reportes";

// Páginas de Entrenador
import { EntrenadorDashboard } from "./pages/trainer/EntrenadorDashboard";
import { MisAlumnos } from "./pages/trainer/MisAlumnos";
import { AgendaDiaria } from "./components/admin/Entrenadores/AgendaDiaria";
import { EntrenadorPlanes } from "./pages/trainer/EntrenadorPlanes";
import { EntrenadorFinanzas } from "./pages/trainer/EntrenadorFinanzas";
import { PerfilEntrenador } from "./pages/trainer/PerfilEntrenador";

// Páginas de Cliente (extras)
import { PagoRenovacion } from "./pages/client/PagoRenovacion";

function App() {
  return (
    <ConfirmProvider>
      <Toaster theme="dark" position="top-right" richColors />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* 1. RUTA PÚBLICA */}
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/activate" element={<ActivateAccount />} />

            {/* ====================================================
                        2. ZONA EXCLUSIVA DEL ADMINISTRADOR
                        ==================================================== */}
            <Route
              element={<ProtectedRoute allowedRoles={["administrador", "1"]} />}
            >
              <Route element={<AdminLayout />}>
                <Route path="/dashboard" element={<AdminDashboard />} />
                <Route path="/clientes" element={<Clientes />} />
                <Route path="/staff" element={<Equipo />} />
                <Route path="/planes" element={<Planes />} />
                <Route path="/asistencia-historial" element={<Asistencia />} />
                <Route path="/finanzas" element={<Finanzas />} />
                <Route path="/inventario" element={<Inventario />} />
                <Route path="/reportes" element={<Reportes />} />
                <Route path="/ejercicios" element={<Ejercicios />} />
                <Route path="/acceso" element={<Acceso />} />
              </Route>
            </Route>

            {/* ====================================================
                        3. ZONA EXCLUSIVA DEL CLIENTE (MÓVIL PWA)
                        ==================================================== */}
            <Route element={<ProtectedRoute allowedRoles={["cliente", "3"]} />}>
              <Route element={<ClientLayout />}>
                <Route path="/client/dashboard" element={<ClientDashboard />} />
                <Route path="/client/rutina" element={<Rutina />} />
                <Route path="/client/acceso" element={<ClientAcceso />} />
                <Route path="/client/progreso" element={<Progreso />} />
                <Route path="/client/perfil" element={<Perfil />} />
                <Route path="/client/renovar" element={<PagoRenovacion />} />
              </Route>
            </Route>

            {/* ====================================================
                        4. ZONA DEL ENTRENADOR (Tus vistas integradas)
                        ==================================================== */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["entrenador", "2", "administrador"]}
                />
              }
            >
              <Route element={<EntrenadorLayout />}>
                {/* Aquí cargamos tu nuevo dashboard */}
                <Route
                  path="/entrenador/dashboard"
                  element={<EntrenadorDashboard />}
                />

                {/* Vistas temporales para que no se rompa la app al hacer clic en el menú */}
                <Route path="/entrenador/clientes" element={<MisAlumnos />} />
                <Route
                  path="entrenador/planes"
                  element={<EntrenadorPlanes />}
                />
                <Route path="/entrenador/agenda" element={<AgendaDiaria />} />
                <Route path="/entrenador/ejercicios" element={<Ejercicios />} />
                <Route
                  path="/entrenador/comisiones"
                  element={<EntrenadorFinanzas />}
                />
                <Route
                  path="/entrenador/perfil"
                  element={<PerfilEntrenador />}
                />
              </Route>
            </Route>

            {/* Manejo de 404 - Si no encuentra la ruta, lo devuelve al Login */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ConfirmProvider>
  );
}

export default App;
