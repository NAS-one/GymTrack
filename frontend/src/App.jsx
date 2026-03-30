import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { ConfirmProvider } from "./contexts/ConfirmContext";
import { AuthProvider } from "./contexts/AuthProvider";

// Guardián y Layouts
import { ProtectedRoute } from "./routes/ProtectedRoute"; // <-- Verifica tu ruta
import { AdminLayout } from "./layouts/AdminLayout"; // <-- Actualizado
import { ClientLayout } from "./layouts/ClientLayout"; // <-- Nuevo
import { EntrenadorLayout } from "./layouts/EntrenadorLayout";

// Páginas (Mantenemos tus imports actuales)
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Clientes } from "./pages/Clientes";
import { Planes } from "./pages/Planes";
import { Finanzas } from "./pages/Finanzas";
import { Inventario } from "./pages/Inventario";
import { Ejercicios } from "./pages/Ejercicios";
import { Acceso } from "./pages/Acceso";
import { Asistencia } from "./pages/Asistencia";
import { Equipo } from "./pages/Equipo";
import { EntrenadorDashboard } from "./pages/EntrenadorDashboard";
import { MisAlumnos } from "./pages/MisAlumnos";

function App() {
  return (
    <ConfirmProvider>
      <Toaster theme="dark" position="top-right" richColors />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* 1. RUTA PÚBLICA */}
            <Route path="/" element={<Login />} />

            {/* ====================================================
                2. ZONA EXCLUSIVA DEL ADMINISTRADOR
                ==================================================== */}
            <Route
              element={<ProtectedRoute allowedRoles={["administrador"]} />}
            >
              <Route element={<AdminLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/clientes" element={<Clientes />} />
                <Route path="/staff" element={<Equipo />} />
                <Route path="/planes" element={<Planes />} />
                <Route path="/asistencia-historial" element={<Asistencia />} />
                <Route path="/finanzas" element={<Finanzas />} />
                <Route path="/inventario" element={<Inventario />} />
                <Route path="/ejercicios" element={<Ejercicios />} />
                <Route path="/acceso" element={<Acceso />} />
              </Route>
            </Route>

            {/* ====================================================
                3. ZONA EXCLUSIVA DEL CLIENTE (MÓVIL PWA)
                ==================================================== */}
            <Route element={<ProtectedRoute allowedRoles={["cliente"]} />}>
              <Route element={<ClientLayout />}>
                <Route
                  path="/client/dashboard"
                  element={
                    <div className="text-center mt-10">
                      Vista de Inicio Cliente
                    </div>
                  }
                />
                <Route
                  path="/client/rutina"
                  element={
                    <div className="text-center mt-10">Mi Rutina de Hoy</div>
                  }
                />
                <Route
                  path="/client/acceso"
                  element={
                    <div className="text-center mt-10">Mi Código QR</div>
                  }
                />
                <Route
                  path="/client/progreso"
                  element={
                    <div className="text-center mt-10">
                      Gráficos de Progreso
                    </div>
                  }
                />
              </Route>
            </Route>

            {/* ====================================================
                4. ZONA DEL ENTRENADOR (Pendiente de crear sus vistas)
                ==================================================== */}
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["entrenador", "administrador"]}
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
                  path="/entrenador/rutinas"
                  element={
                    <div className="text-center text-white mt-10">
                      Gestión de Rutinas (Próximamente)
                    </div>
                  }
                />
                <Route
                  path="/entrenador/agenda"
                  element={
                    <div className="text-center text-white mt-10">
                      Agenda y Sesiones (Próximamente)
                    </div>
                  }
                />
                <Route
                  path="/entrenador/ejercicios"
                  element={
                    <div className="text-center text-white mt-10">
                      Biblioteca de Ejercicios (Próximamente)
                    </div>
                  }
                />
                <Route
                  path="/entrenador/comisiones"
                  element={
                    <div className="text-center text-white mt-10">
                      Mis Comisiones (Próximamente)
                    </div>
                  }
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
