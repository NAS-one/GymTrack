import { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";

// Iconos adaptados para el Entrenador
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  CalendarDays,
  Dumbbell,
  Wallet,
  LogOut,
  Menu,
  ChevronLeft,
} from "lucide-react";

export function EntrenadorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const pageTitles = {
    "/entrenador/dashboard": "Mi Panel",
    "/entrenador/clientes": "Mis Alumnos",
    "/entrenador/rutinas": "Gestión de Rutinas",
    "/entrenador/agenda": "Agenda y Sesiones",
    "/entrenador/ejercicios": "Biblioteca de Ejercicios",
    "/entrenador/comisiones": "Mis Comisiones",
  };

  const currentTitle = pageTitles[location.pathname] || "GymTrack Entrenador";

  const menuItems = [
    {
      section: "Principal",
      items: [
        {
          path: "/entrenador/dashboard",
          label: "Mi Panel",
          icon: <LayoutDashboard size={20} />,
        },
      ],
    },
    {
      section: "Entrenamiento",
      items: [
        {
          path: "/entrenador/clientes",
          label: "Mis Alumnos",
          icon: <Users size={20} />,
        },
        {
          path: "/entrenador/rutinas",
          label: "Rutinas",
          icon: <ClipboardList size={20} />,
        },
        {
          path: "/entrenador/agenda",
          label: "Agenda",
          icon: <CalendarDays size={20} />,
        },
      ],
    },
    {
      section: "Herramientas",
      items: [
        {
          path: "/entrenador/ejercicios",
          label: "Ejercicios",
          icon: <Dumbbell size={20} />,
        },
        {
          path: "/entrenador/comisiones",
          label: "Comisiones",
          icon: <Wallet size={20} />,
        },
      ],
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-[#09090b] text-white overflow-hidden font-sans">
      {/* === SIDEBAR === */}
      <aside
        className={`${isSidebarOpen ? "w-72" : "w-20"} bg-black border-r border-white/5 flex flex-col transition-all duration-300 ease-in-out relative z-20`}
      >
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-8 bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white rounded-full p-1 shadow-xl transition-colors z-50"
        >
          {isSidebarOpen ? <ChevronLeft size={14} /> : <Menu size={14} />}
        </button>

        <div className="h-20 flex items-center px-6 border-b border-white/5">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600 to-orange-500 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20">
              <Dumbbell className="text-white fill-white/20" size={20} />
            </div>
            {isSidebarOpen && (
              <div className="animate-fade-in">
                <h1 className="font-bold text-lg tracking-tight leading-none">
                  GymTrack
                </h1>
                <span className="text-[10px] text-zinc-500 font-medium tracking-widest uppercase">
                  Entrenador
                </span>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-6 custom-scrollbar">
          {menuItems.map((group, index) => (
            <div key={index}>
              {isSidebarOpen && (
                <h3 className="px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  {group.section}
                </h3>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group overflow-hidden ${isActive ? "bg-white/5 text-white" : "text-zinc-400 hover:text-white hover:bg-white/5"}`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {isActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"></span>
                          )}
                          <span
                            className={`shrink-0 transition-colors ${isActive ? "text-orange-500" : "group-hover:text-zinc-300"}`}
                          >
                            {item.icon}
                          </span>
                          <span
                            className={`whitespace-nowrap font-medium text-sm transition-opacity duration-200 ${isSidebarOpen ? "opacity-100" : "opacity-0 w-0"}`}
                          >
                            {item.label}
                          </span>
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5 bg-zinc-900/30">
          <div
            className={`flex items-center gap-3 ${!isSidebarOpen && "justify-center"}`}
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-600 flex items-center justify-center text-xs font-bold text-white shrink-0 border border-white/10">
              {user?.username?.substring(0, 2).toUpperCase() || "EN"}
            </div>
            {isSidebarOpen && (
              <div className="flex-1 overflow-hidden transition-all duration-300">
                <p className="text-sm font-medium text-white truncate">
                  {user?.username || "Profesor"}
                </p>
                <p className="text-[10px] text-zinc-500 truncate">
                  {user?.email || "coach@gymtrack.com"}
                </p>
              </div>
            )}
            {isSidebarOpen && (
              <button
                onClick={handleLogout}
                className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* === CONTENIDO PRINCIPAL === */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#09090b] relative">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/20 backdrop-blur-sm sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-semibold text-white">{currentTitle}</h2>
            <p className="text-xs text-zinc-500 hidden md:block">
              Modo Staff Técnico
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 text-xs hover:bg-zinc-700 cursor-pointer transition-colors">
              🔔
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 scroll-smooth custom-scrollbar">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
