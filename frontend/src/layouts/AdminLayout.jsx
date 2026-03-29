import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../contexts/useAuth';
import {
    LayoutDashboard, Users, UserCog, Dumbbell, CreditCard, Package,
    Tags, LogOut, Menu, ChevronLeft, History as HistoryIcon,
    FileText, ScanLine, Bell, Settings, Zap
} from 'lucide-react';

export function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Conexión SSE para Notificaciones de Asistencia en Tiempo Real
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const baseURL = `http://${window.location.hostname}:3000`;
        const eventSource = new EventSource(`${baseURL}/notifications/stream?token=${token}`);

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'success') {
                    toast.success(data.message, { duration: 8000 });
                } else if (data.type === 'error') {
                    toast.error(data.message, { duration: 8000 });
                }
            } catch (err) {
                console.error("Error parseando SSE:", err);
            }
        };

        return () => {
            eventSource.close();
        };
    }, []);

    const menuItems = [
        {
            section: 'SISTEMA',
            items: [{ path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> }]
        },
        {
            section: 'RECEPCIÓN',
            items: [
                { path: '/acceso', label: 'Terminal QR', icon: <ScanLine size={18} /> },
                { path: '/asistencia-historial', label: 'Historial', icon: <HistoryIcon size={18} /> },
            ]
        },
        {
            section: 'COMERCIAL',
            items: [
                { path: '/clientes', label: 'Comunidad', icon: <Users size={18} /> },
                { path: '/planes', label: 'Planes', icon: <Tags size={18} /> },
                { path: '/finanzas', label: 'Caja y Tesorería', icon: <CreditCard size={18} /> },
            ]
        },
        {
            section: 'OPERACIONES',
            items: [
                { path: '/equipo', label: 'Personal', icon: <UserCog size={18} /> },
                { path: '/inventario', label: 'Maquinaria', icon: <Package size={18} /> },
                { path: '/ejercicios', label: 'Ejercicios', icon: <Dumbbell size={18} /> },
            ]
        },
        {
            section: 'ANÁLISIS',
            items: [{ path: '/reportes', label: 'Reportes', icon: <FileText size={18} /> }]
        }
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-black text-white overflow-hidden font-sans selection:bg-gym-orange/30">

            {/* 🌌 FONDO ATMOSFÉRICO GLOBAL */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-1/4 w-[500px] h-[500px] bg-gym-orange/5 blur-[120px] rounded-full animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] right-1/4 w-[600px] h-[600px] bg-blue-500/5 blur-[150px] rounded-full"></div>
            </div>

            {/* === SIDEBAR (Minimalista) === */}
            <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-black flex flex-col transition-all duration-500 ease-in-out relative z-30`}>
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="absolute -right-3 top-10 bg-zinc-900 border border-white/10 text-zinc-400 hover:text-gym-orange rounded-full p-1.5 shadow-2xl transition-all z-50 hover:scale-110"
                >
                    {isSidebarOpen ? <ChevronLeft size={12} strokeWidth={3} /> : <Menu size={12} strokeWidth={3} />}
                </button>

                {/* LOGO */}
                <div className="h-24 flex items-center px-6 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gym-orange flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(249,115,22,0.3)]">
                            <Zap className="text-white fill-white/20" size={18} strokeWidth={2.5} />
                        </div>
                        {isSidebarOpen && (
                            <h1 className="font-black text-lg tracking-tighter italic">GYM<span className="text-gym-orange">TRACK</span></h1>
                        )}
                    </div>
                </div>

                {/* NAVEGACIÓN */}
                <nav className="flex-1 overflow-y-auto px-3 space-y-7 custom-scrollbar py-4">
                    {menuItems.map((group, index) => (
                        <div key={index} className="space-y-1">
                            {isSidebarOpen && (
                                <h3 className="px-4 text-[9px] font-black text-zinc-700 uppercase tracking-[0.3em] mb-2">{group.section}</h3>
                            )}
                            <ul className="space-y-1">
                                {group.items.map((item) => (
                                    <li key={item.path}>
                                        <NavLink
                                            to={item.path}
                                            className={({ isActive }) => `
                                                relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group
                                                ${isActive ? 'bg-white/[0.03] text-white shadow-inner' : 'text-zinc-500 hover:text-zinc-200'}
                                            `}
                                        >
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

                {/* PERFIL */}
                <div className="p-4 border-t border-white/5">
                    <div className={`flex items-center gap-3 p-2 rounded-2xl bg-white/[0.02] border border-white/5 ${!isSidebarOpen && 'justify-center'}`}>
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-black border border-white/10">{user?.nombre?.substring(0, 2).toUpperCase() || user?.username?.substring(0, 2).toUpperCase() || 'AD'}</div>
                        {isSidebarOpen && (
                            <button onClick={handleLogout} className="ml-auto p-2 text-zinc-600 hover:text-rose-500 transition-colors"><LogOut size={16} /></button>
                        )}
                    </div>
                </div>
            </aside>

            {/* === MAIN CONTENT (La "Hoja" Premium) === */}
            <main className="flex-1 relative z-10 flex flex-col bg-black">
                {/* Contenedor con bordes ultra suaves */}
                <div className="flex-1 bg-[#0c0c0e] my-2 mr-2 rounded-[3.5rem] border border-white/[0.03] flex flex-col overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.8)]">

                    {/* TOP HEADER (Minimalista - Sin Títulos ni Buscadores redundantes) */}
                    <header className="h-14 flex items-center justify-end px-12 shrink-0">
                        <div className="flex items-center gap-5">
                            <button className="text-zinc-600 hover:text-white transition-all hover:scale-110"><Bell size={18} /></button>
                            <button className="text-zinc-600 hover:text-white transition-all hover:scale-110"><Settings size={18} /></button>
                        </div>
                    </header>

                    {/* ÁREA DE CONTENIDO */}
                    <div className="flex-1 overflow-y-auto px-12 pb-12 custom-scrollbar">
                        <div className="max-w-[1500px] mx-auto pt-4">
                            <Outlet />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
