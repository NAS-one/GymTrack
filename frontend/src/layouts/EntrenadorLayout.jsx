import { useState, useEffect, useRef } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../contexts/useAuth";
import { useConfirm } from "../contexts/ConfirmContext";
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
  Zap,
  Clock,
  User,
  UserCog,
  Shield,
} from "lucide-react";

export function EntrenadorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileRef = useRef(null);

  // Reloj en Tiempo Real
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Cerrar menú de perfil al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItems = [
    {
      section: "PRINCIPAL",
      items: [
        {
          path: "/entrenador/dashboard",
          label: "Mi Panel",
          icon: <LayoutDashboard size={18} />,
        },
      ],
    },
    {
      section: "ENTRENAMIENTO",
      items: [
        {
          path: "/entrenador/clientes",
          label: "Mis Alumnos",
          icon: <Users size={18} />,
        },
        {
          path: "/entrenador/planes",
          label: "Planes",
          icon: <ClipboardList size={18} />,
        },
        {
          path: "/entrenador/agenda",
          label: "Agenda",
          icon: <CalendarDays size={18} />,
        },
      ],
    },
    {
      section: "HERRAMIENTAS",
      items: [
        {
          path: "/entrenador/ejercicios",
          label: "Ejercicios",
          icon: <Dumbbell size={18} />,
        },
        {
          path: "/entrenador/comisiones",
          label: "Finanzas",
          icon: <Wallet size={18} />,
        },
      ],
    },
  ];

  const handleLogout = async () => {
    const isConfirmed = await confirm({
      title: "¿Cerrar Sesión?",
      description:
        "Tendrás que volver a ingresar tus credenciales para acceder al panel.",
      confirmText: "Sí, salir",
      cancelText: "Cancelar",
      type: "logout",
    });

    if (isConfirmed) {
      logout();
      navigate("/login");
    }
  };

  const trainerName = user?.nombre || user?.username || "Entrenador";
  const timeString = currentTime.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const dateString = currentTime.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden font-sans selection:bg-gym-orange/30">
      {/* 🌌 FONDO ATMOSFÉRICO GLOBAL */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-1/4 w-[500px] h-[500px] bg-gym-orange/5 blur-[120px] rounded-full animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-1/4 w-[600px] h-[600px] bg-blue-500/5 blur-[150px] rounded-full"></div>
      </div>

      {/* === SIDEBAR === */}
      <aside
        className={`${isSidebarOpen ? "w-64" : "w-20"} bg-black flex flex-col transition-all duration-500 ease-in-out relative z-30`}
      >
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-10 bg-zinc-900 border border-white/10 text-zinc-400 hover:text-gym-orange rounded-full p-1.5 shadow-2xl transition-all z-50 hover:scale-110"
        >
          {isSidebarOpen ? (
            <ChevronLeft size={12} strokeWidth={3} />
          ) : (
            <Menu size={12} strokeWidth={3} />
          )}
        </button>

        {/* LOGO */}
        <div className="h-24 flex items-center px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gym-orange flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(249,115,22,0.3)]">
              <Zap
                className="text-white fill-white/20"
                size={18}
                strokeWidth={2.5}
              />
            </div>
            {isSidebarOpen && (
              <h1 className="font-black text-lg tracking-tighter italic">
                GYM<span className="text-gym-orange">TRACK</span>
              </h1>
            )}
          </div>
        </div>

        {/* NAVEGACIÓN */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-7 custom-scrollbar py-4">
          {menuItems.map((group, index) => (
            <div key={index} className="space-y-1">
              {isSidebarOpen && (
                <h3 className="px-4 text-[9px] font-black text-zinc-700 uppercase tracking-[0.3em] mb-2">
                  {group.section}
                </h3>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group ${isActive ? "bg-white/[0.03] text-white shadow-inner" : "text-zinc-500 hover:text-zinc-200"}`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={`${isActive ? "text-gym-orange" : "group-hover:text-white"}`}
                          >
                            {item.icon}
                          </span>
                          {isSidebarOpen && (
                            <span className="text-sm font-bold tracking-tight">
                              {item.label}
                            </span>
                          )}
                          {isActive && (
                            <div className="absolute left-0 w-1 h-4 bg-gym-orange rounded-r-full shadow-[0_0_10px_rgba(249,115,22,1)]"></div>
                          )}
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

      {/* === MAIN CONTENT === */}
      <main className="flex-1 relative z-10 flex flex-col bg-black">
        <div className="flex-1 bg-[#0c0c0e] my-2 mr-2 rounded-[3.5rem] border border-white/[0.03] flex flex-col overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.8)]">
          {/* ============================================= */}
          {/* HEADER PREMIUM (Mismo estilo que Admin)       */}
          {/* ============================================= */}
          <header className="h-20 flex items-center justify-between px-12 shrink-0 border-b border-white/[0.02]">
            {/* Reloj */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 bg-black/40 px-4 py-2.5 rounded-2xl border border-white/5 shadow-inner">
                <div className="p-1.5 rounded-xl bg-gym-orange/10 text-gym-orange border border-gym-orange/20 shadow-[0_0_10px_rgba(249,115,22,0.1)]">
                  <Clock size={16} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black text-white tracking-widest uppercase font-mono">
                    {timeString}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-500 capitalize tracking-wide">
                    {dateString}
                  </span>
                </div>
              </div>
            </div>

            {/* Acciones (Notificaciones + Perfil + Logout) */}
            <div className="flex items-center gap-6">

              {/* Perfil del Entrenador */}
              <div className="relative" ref={profileRef}>
                <div
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-black text-white tracking-tight group-hover:text-gym-orange transition-colors">
                      {trainerName}
                    </p>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                      Entrenador
                    </p>
                  </div>
                  <div
                    className={`w-10 h-10 rounded-2xl bg-gradient-to-tr from-gym-orange/20 to-orange-500/5 border border-gym-orange/30 flex items-center justify-center text-gym-orange shadow-[0_0_15px_rgba(249,115,22,0.15)] transition-all overflow-hidden ${isProfileMenuOpen ? "ring-2 ring-gym-orange scale-105" : "group-hover:scale-105"}`}
                  >
                    <User size={18} strokeWidth={2.5} />
                  </div>
                </div>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-4 w-64 bg-[#09090b]/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)] py-2 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
                    <div className="absolute -top-1.5 right-4 w-3 h-3 bg-[#09090b] border-t border-l border-white/10 rotate-45"></div>
                    <div className="px-5 py-4 border-b border-white/5 relative z-10">
                      <p className="text-sm font-black text-white truncate">
                        {user?.email || "correo@gym.com"}
                      </p>
                      <p className="text-[9px] font-bold text-gym-orange uppercase tracking-widest mt-1 flex items-center gap-1">
                        <Shield size={10} /> Entrenador Personal
                      </p>
                    </div>
                    <div className="p-2 space-y-1 relative z-10">
                      <button
                        onClick={() => { setIsProfileMenuOpen(false); navigate("/entrenador/perfil"); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-all text-left group"
                      >
                        <UserCog
                          size={16}
                          className="group-hover:text-gym-orange transition-colors"
                        />{" "}
                        Ajustes de Perfil
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

          {/* ÁREA DE CONTENIDO */}
          <div className="flex-1 overflow-y-auto px-12 pb-12 pt-8 custom-scrollbar relative z-0">
            <div className="max-w-[1500px] mx-auto">
              <Outlet />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

