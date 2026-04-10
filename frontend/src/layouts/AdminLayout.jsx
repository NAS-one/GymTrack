import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import { toast } from 'sonner';

// Contextos
import { useAuth } from '../contexts/useAuth';
import { useConfirm } from '../contexts/ConfirmContext';

// Componentes (Modales y Paneles)
import { AdminProfileModal } from '../components/admin/Profile/AdminProfileModal';
import { AdminNotificationsPanel } from '../components/admin/Profile/AdminNotificationsPanel';
import { AdminSettingsModal } from '../components/admin/Profile/AdminSettingsModal';

// Iconos
import {
    LayoutDashboard, Users, UserCog, Dumbbell, CreditCard, Package,
    Tags, LogOut, Menu, ChevronLeft, History as HistoryIcon,
    FileText, ScanLine, Bell, Settings, Zap, User, Shield, Clock
} from 'lucide-react';

export function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const confirm = useConfirm();

    // Estados de la UI (Menús y Paneles)
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    // Estados de los Modales Maestros
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // 🌟 ESTADO DE NOTIFICACIONES (Historial en memoria)
    const [notifications, setNotifications] = useState([]);

    // Estado inicial enriquecido
    const [adminData, setAdminData] = useState({
        nombre: 'Cargando...',
        cargo: 'Gerencia',
        email: user?.email,
        telefono: '',
        preferencias_alertas: {}
    });

    // Estado del Reloj en Tiempo Real
    const [currentTime, setCurrentTime] = useState(new Date());

    const profileRef = useRef(null);

    // 1. Reloj en Tiempo Real
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // 2. Cargar Datos del Administrador al iniciar
    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                const response = await axios.get('/perfil').catch(() => ({ data: null }));
                if (response.data && response.data.body) {
                    setAdminData({ ...response.data.body, email: user?.email });
                } else {
                    setAdminData({
                        nombre: 'Administrador',
                        cargo: 'Gerencia General',
                        email: user?.email,
                        telefono: '',
                        preferencias_alertas: {}
                    });
                }
            } catch (error) {
                console.error("Error al cargar perfil:", error);
            }
        };

        if (user) {
            fetchAdminData();
        }
    }, [user]);

    // 3. Cargar historial de notificaciones desde la BD al entrar
    useEffect(() => {
        const fetchNotificaciones = async () => {
            try {
                const response = await axios.get('/notificaciones');
                // 🌟 Extraemos los datos con cuidado
                let data = response.data?.body;

                // Si por algún motivo quedó doblemente envuelto, lo extraemos
                if (data && data.body && Array.isArray(data.body)) {
                    data = data.body;
                }

                // Si finalmente es un arreglo, lo guardamos
                if (Array.isArray(data)) {
                    setNotifications(data);
                } else {
                    setNotifications([]); // Fallback seguro
                }
            } catch (error) {
                console.error("Error al cargar historial de alertas:", error);
                setNotifications([]);
            }
        };

        if (user) fetchNotificaciones();
    }, [user]);

    // 4. 🌟 Conexión SSE para Notificaciones (Actualizado)
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        const baseURL = `http://${window.location.hostname}:3000`;
        const sseUrl = `${baseURL}/notificaciones/stream?token=${token}`;
        const eventSource = new EventSource(sseUrl);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);

            // 🌟 A. Guardar en el historial del panel (Máx 50 para no llenar RAM)
            setNotifications(prev => [
                { ...data, id: Date.now() + Math.random() },
                ...prev
            ].slice(0, 50));

            // 🌟 B. Disparar el Toast Visual en pantalla
            if (data.type === 'ingreso_exitoso') {
                toast.success(data.title, { description: data.message, icon: '🟢' });
            } else if (data.type === 'alerta_sistema') {
                toast.warning(data.title, { description: data.message, icon: '⚠️' });
            } else if (data.type === 'ingreso_denegado') {
                toast.error(data.title, { description: data.message, icon: '🔴' });
            } else {
                toast.info(data.title, { description: data.message });
            }
        };

        eventSource.onerror = (error) => {
            console.error("Conexión SSE perdida. El navegador intentará reconectar...", error);
        };

        return () => {
            eventSource.close();
        };
    }, []);

    // 5. Cerrar menú de perfil al hacer clic afuera
    useEffect(() => {
        function handleClickOutside(event) {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 6. Función para limpiar notificaciones
    const handleClearNotifications = async () => {
        try {
            await axios.put('/notificaciones/leer');

            // 🌟 ESTO ES CLAVE: Actualizamos la memoria RAM para que React repinte las tarjetas
            setNotifications(prev => prev.map(n => ({ ...n, leida: true })));

        } catch (error) {
            toast.error("Error al limpiar notificaciones");
        }
    };

    const menuItems = [
        { section: 'SISTEMA', items: [{ path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> }] },
        { section: 'RECEPCIÓN', items: [{ path: '/acceso', label: 'Terminal QR', icon: <ScanLine size={18} /> }, { path: '/asistencia-historial', label: 'Historial', icon: <HistoryIcon size={18} /> }] },
        { section: 'COMERCIAL', items: [{ path: '/clientes', label: 'Comunidad', icon: <Users size={18} /> }, { path: '/planes', label: 'Planes', icon: <Tags size={18} /> }, { path: '/finanzas', label: 'Caja y Tesorería', icon: <CreditCard size={18} /> }] },
        { section: 'OPERACIONES', items: [{ path: '/staff', label: 'Personal', icon: <UserCog size={18} /> }, { path: '/inventario', label: 'Maquinaria', icon: <Package size={18} /> }, { path: '/ejercicios', label: 'Ejercicios', icon: <Dumbbell size={18} /> }] },
        { section: 'ANÁLISIS', items: [{ path: '/reportes', label: 'Reportes', icon: <FileText size={18} /> }] }
    ];

    const handleLogout = async () => {
        const isConfirmed = await confirm({
            title: '¿Cerrar Sesión?',
            description: 'Tendrás que volver a ingresar tus credenciales para acceder al panel de control.',
            confirmText: 'Sí, salir',
            cancelText: 'Cancelar',
            type: 'danger'
        });

        if (isConfirmed) {
            logout();
            navigate('/login');
        }
    };

    const timeString = currentTime.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateString = currentTime.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div className="flex h-screen bg-black text-white overflow-hidden font-sans selection:bg-gym-orange/30">

            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-1/4 w-[500px] h-[500px] bg-gym-orange/5 blur-[120px] rounded-full animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-1/4 w-[600px] h-[600px] bg-blue-500/5 blur-[150px] rounded-full"></div>
            </div>

            <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-black flex flex-col transition-all duration-500 ease-in-out relative z-30`}>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="absolute -right-3 top-10 bg-zinc-900 border border-white/10 text-zinc-400 hover:text-gym-orange rounded-full p-1.5 shadow-2xl transition-all z-50 hover:scale-110">
                    {isSidebarOpen ? <ChevronLeft size={12} strokeWidth={3} /> : <Menu size={12} strokeWidth={3} />}
                </button>
                <div className="h-24 flex items-center px-6 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gym-orange flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                            <Zap className="text-white fill-white/20" size={18} strokeWidth={2.5} />
                        </div>
                        {isSidebarOpen && <h1 className="font-black text-lg tracking-tighter italic">GYM<span className="text-gym-orange">TRACK</span></h1>}
                    </div>
                </div>
                <nav className="flex-1 overflow-y-auto px-3 space-y-7 custom-scrollbar py-4">
                    {menuItems.map((group, index) => (
                        <div key={index} className="space-y-1">
                            {isSidebarOpen && <h3 className="px-4 text-[9px] font-black text-zinc-700 uppercase tracking-[0.3em] mb-2">{group.section}</h3>}
                            <ul className="space-y-1">
                                {group.items.map((item) => (
                                    <li key={item.path}>
                                        <NavLink to={item.path} className={({ isActive }) => `relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group ${isActive ? 'bg-white/[0.03] text-white shadow-inner' : 'text-zinc-500 hover:text-zinc-200'}`}>
                                            {({ isActive }) => (
                                                <>
                                                    <span className={`${isActive ? 'text-gym-orange' : 'group-hover:text-white'}`}>{item.icon}</span>
                                                    {isSidebarOpen && <span className="text-sm font-bold tracking-tight">{item.label}</span>}
                                                    {isActive && <div className="absolute left-0 w-1 h-4 bg-gym-orange rounded-r-full shadow-[0_0_10px_rgba(249,115,22,1)]"></div>}
                                                </>
                                            )}
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </nav>
            </aside>

            <main className="flex-1 relative z-10 flex flex-col bg-black">
                <div className="flex-1 bg-[#0c0c0e] my-2 mr-2 rounded-[3.5rem] border border-white/[0.03] flex flex-col overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.8)]">

                    <header className="h-20 flex items-center justify-between px-12 shrink-0 border-b border-white/[0.02]">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-3 bg-black/40 px-4 py-2.5 rounded-2xl border border-white/5 shadow-inner">
                                <div className="p-1.5 rounded-xl bg-gym-orange/10 text-gym-orange border border-gym-orange/20 shadow-[0_0_10px_rgba(249,115,22,0.1)]">
                                    <Clock size={16} strokeWidth={2.5} />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs font-black text-white tracking-widest uppercase font-mono">{timeString}</span>
                                    <span className="text-[10px] font-bold text-zinc-500 capitalize tracking-wide">{dateString}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-4 bg-black/40 p-1.5 rounded-2xl border border-white/5 shadow-inner">
                                <button
                                    onClick={() => setIsNotificationsOpen(true)}
                                    className="relative p-2.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
                                    title="Notificaciones"
                                >
                                    <Bell size={18} strokeWidth={2} />
                                    {/* 🌟 C. El puntito rojo solo aparece si hay alertas */}
                                    {notifications.length > 0 && (
                                        <span className="absolute top-2.5 right-3 w-1.5 h-1.5 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse"></span>
                                    )}
                                </button>
                                <button
                                    onClick={() => setIsSettingsOpen(true)}
                                    className="p-2.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                                    title="Configuración General"
                                >
                                    <Settings size={18} strokeWidth={2} />
                                </button>
                            </div>

                            <div className="w-px h-8 bg-white/10"></div>

                            <div className="relative" ref={profileRef}>
                                <div onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)} className="flex items-center gap-3 cursor-pointer group">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-xs font-black text-white tracking-tight group-hover:text-gym-orange transition-colors">{adminData.nombre}</p>
                                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{adminData.cargo}</p>
                                    </div>
                                    <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr from-gym-orange/20 to-orange-500/5 border border-gym-orange/30 flex items-center justify-center text-gym-orange shadow-[0_0_15px_rgba(249,115,22,0.15)] transition-all overflow-hidden ${isProfileMenuOpen ? 'ring-2 ring-gym-orange scale-105' : 'group-hover:scale-105'}`}>
                                        {adminData.foto_perfil ? (
                                            <img src={adminData.foto_perfil} alt="Perfil" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={18} strokeWidth={2.5} />
                                        )}
                                    </div>
                                </div>

                                {isProfileMenuOpen && (
                                    <div className="absolute right-0 mt-4 w-64 bg-[#09090b]/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)] py-2 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
                                        <div className="absolute -top-1.5 right-4 w-3 h-3 bg-[#09090b] border-t border-l border-white/10 rotate-45"></div>
                                        <div className="px-5 py-4 border-b border-white/5 relative z-10">
                                            <p className="text-sm font-black text-white truncate">{adminData.email}</p>
                                            <p className="text-[9px] font-bold text-gym-orange uppercase tracking-widest mt-1 flex items-center gap-1"><Shield size={10} /> Nivel de Acceso: Total</p>
                                        </div>
                                        <div className="p-2 space-y-1 relative z-10">
                                            <button
                                                onClick={() => {
                                                    setIsProfileMenuOpen(false);
                                                    setIsProfileModalOpen(true);
                                                }}
                                                className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all text-left group"
                                            >
                                                <UserCog size={16} className="group-hover:text-gym-orange transition-colors" /> Ajustes de Perfil
                                            </button>

                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={handleLogout}
                                className="p-2.5 ml-2 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all border border-transparent hover:border-rose-500/20"
                                title="Cerrar Sesión"
                            >
                                <LogOut size={18} strokeWidth={2.5} />
                            </button>

                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto px-12 pb-12 pt-8 custom-scrollbar relative z-0">
                        <div className="max-w-[1500px] mx-auto">
                            <Outlet />
                        </div>
                    </div>
                </div>
            </main>

            {/* Modales */}
            <AdminNotificationsPanel
                isOpen={isNotificationsOpen}
                onClose={() => setIsNotificationsOpen(false)}
                notifications={notifications}
                markAsRead={handleClearNotifications}
            />

            <AdminSettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />

            <AdminProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                adminData={adminData}
                onUpdate={(newData) => setAdminData(newData)}
            />

        </div>
    );
}