// src/layouts/ClientLayout.jsx
import { Outlet, NavLink } from 'react-router-dom';
import { Home, Dumbbell, TrendingUp, ScanLine } from 'lucide-react';

export function ClientLayout() {
    return (
        <div className="flex flex-col h-screen bg-black text-white font-sans">

            {/* HEADER MÓVIL */}
            <header className="p-4 border-b border-white/10 text-center text-gym-orange font-bold bg-zinc-900">
                GymTrack App
            </header>

            {/* ÁREA DE CONTENIDO */}
            <main className="flex-1 overflow-y-auto pb-20 p-4">
                <Outlet />
            </main>

            {/* BOTTOM NAV BAR */}
            <nav className="fixed bottom-0 w-full bg-zinc-900 border-t border-white/5 flex justify-around p-3 pb-safe z-50">
                <NavLink to="/client/dashboard" className={({ isActive }) => `flex flex-col items-center transition-colors ${isActive ? 'text-gym-orange' : 'text-zinc-500 hover:text-zinc-300'}`}>
                    <Home size={24} />
                    <span className="text-[10px] mt-1 font-medium">Inicio</span>
                </NavLink>

                <NavLink to="/client/rutina" className={({ isActive }) => `flex flex-col items-center transition-colors ${isActive ? 'text-gym-orange' : 'text-zinc-500 hover:text-zinc-300'}`}>
                    <Dumbbell size={24} />
                    <span className="text-[10px] mt-1 font-medium">Rutina</span>
                </NavLink>

                <NavLink to="/client/acceso" className="flex flex-col items-center text-gym-orange">
                    <div className="bg-gym-orange text-white p-3 rounded-full -mt-8 shadow-lg shadow-orange-500/30">
                        <ScanLine size={28} />
                    </div>
                    <span className="text-[10px] mt-1 font-bold">Acceso</span>
                </NavLink>

                <NavLink to="/client/progreso" className={({ isActive }) => `flex flex-col items-center transition-colors ${isActive ? 'text-gym-orange' : 'text-zinc-500 hover:text-zinc-300'}`}>
                    <TrendingUp size={24} />
                    <span className="text-[10px] mt-1 font-medium">Progreso</span>
                </NavLink>
            </nav>
        </div>
    );
}