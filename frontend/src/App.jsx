import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ConfirmProvider } from './contexts/ConfirmContext';
import { AuthProvider } from './contexts/AuthProvider';

// Guardián y Layouts
import { ProtectedRoute } from './routes/ProtectedRoute';
import { AdminLayout } from './layouts/AdminLayout';
import { ClientLayout } from './layouts/ClientLayout';
// import { TrainerLayout } from './layouts/TrainerLayout'; 

// Páginas
import { Login } from './pages/auth/Login';
import { ActivateAccount } from './pages/auth/ActivateAccount';
import { Dashboard as AdminDashboard } from './pages/admin/Dashboard';
import { ClientDashboard } from './pages/client/Dashboard';
import { Clientes } from './pages/admin/Clientes';
import { Planes } from './pages/admin/Planes';
import { Finanzas } from './pages/admin/Finanzas';
import { Inventario } from './pages/admin/Inventario';
import { Ejercicios } from './pages/admin/Ejercicios';
import { Acceso } from './pages/admin/Acceso';
import { Asistencia } from './pages/admin/Asistencia';
import { Equipo } from './pages/admin/Equipo';
import { Reportes } from './pages/admin/Reportes';

function App() {
    return (
        <ConfirmProvider>
            <Toaster theme="dark" position="top-right" richColors />
            <AuthProvider>
                <BrowserRouter>
                    <Routes>
                        {/* 1. RUTA PÚBLICA */}
                        <Route path="/" element={<Login />} />
                        <Route path="/activate" element={<ActivateAccount />} />

                        {/* ====================================================
                2. ZONA EXCLUSIVA DEL ADMINISTRADOR
                ==================================================== */}
                        <Route element={<ProtectedRoute allowedRoles={['administrador']} />}>
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
                        <Route element={<ProtectedRoute allowedRoles={['cliente']} />}>
                            <Route element={<ClientLayout />}>
                                <Route path="/client/dashboard" element={<ClientDashboard />} />
                                <Route path="/client/rutina" element={<div className="text-center mt-10">Mi Rutina de Hoy</div>} />
                                <Route path="/client/acceso" element={<div className="text-center mt-10">Mi Código QR</div>} />
                                <Route path="/client/progreso" element={<div className="text-center mt-10">Gráficos de Progreso</div>} />
                            </Route>
                        </Route>

                        {/* ====================================================
                4. ZONA DEL ENTRENADOR (Pendiente de crear sus vistas)
                ==================================================== */}
                        <Route element={<ProtectedRoute allowedRoles={['entrenador']} />}>
                            {/* <Route element={<TrainerLayout />}> ... </Route> */}
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
