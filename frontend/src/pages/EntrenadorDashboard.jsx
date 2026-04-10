import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import { Users, Lightbulb, CalendarClock, Dumbbell, TrendingUp, Clock, User } from "lucide-react";

// Reutilizamos componentes de Admin
import { StatCard } from "../components/admin/Dashboard/StatCard";
import { LiveFeed } from "../components/admin/Dashboard/Livefeed";

export function EntrenadorDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get("/entrenadores/dashboard/summary");

        let raw = response.data.body || response.data;
        if (raw && raw.body) {
          raw = raw.body;
        }

        // Adaptacion datos para el entrenador
        const adaptedData = {
          kpi: {
            misAlumnos: raw.kpi?.misAlumnos || 0,
            sugerenciasIA: raw.kpi?.sugerenciasIA || 0,
            sesionesPendientesHoy: raw.kpi?.sesionesPendientesHoy || 0,
            rutinasActivas: raw.kpi?.rutinasActivas || 0,
            proximaSesionTexto: raw.kpi?.proximaSesionTexto || "Sin sesiones agendadas",
          },
          recentLogs: Array.isArray(raw.recentLogs) ? raw.recentLogs : [],
          proximasSesiones: Array.isArray(raw.proximasSesiones) ? raw.proximasSesiones : [],
        };

        setStats(adaptedData);
      } catch (error) {
        console.error("Error conectando con la BD del Entrenador:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Helper para formatear fecha de sesión (ya viene pre-formateada del backend)
  const formatSessionDate = (sesion) => {
    return { dia: sesion.dia || "---", hora: sesion.hora || "--:--" };
  };

  return (
    <div className="relative min-h-screen pb-20 animate-fade-in select-none">

      {/* 🌌 CAPA ATMOSFÉRICA */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-gym-orange/5 blur-[140px] rounded-full opacity-40"></div>
        <div className="absolute bottom-[5%] right-[-5%] w-[45%] h-[45%] bg-blue-600/5 blur-[140px] rounded-full opacity-30"></div>
      </div>

      <div className="relative z-10 space-y-10 max-w-[1550px] mx-auto">

        {/* 1. HEADER */}
        <header className="px-4 mt-2">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={18} className="text-gym-orange animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">Sincronización en tiempo real</span>
          </div>
          <h2 className="text-6xl font-black text-white tracking-tighter italic">
            Centro de <span className="text-zinc-700 not-italic">Entrenamiento</span>
          </h2>
          <p className="text-zinc-500 font-bold text-sm uppercase tracking-[0.2em] mt-2 opacity-80">
            Inteligencia operativa técnica
          </p>
        </header>

        {/* 2. KPIS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 px-4">
          <StatCard
            loading={loading}
            title="Mis Alumnos"
            value={stats?.kpi.misAlumnos || 0}
            trend={0}
            color="blue"
            icon={<Users size={20} />}
            sparklineData={[18, 19, 19, 21, 21]}
            subtitle="+3 nuevos esta semana"
            onClick={() => navigate("/entrenador/clientes")}
          />
          <StatCard
            loading={loading}
            title="Alertas y Acciones"
            value={stats?.kpi.sugerenciasIA || 0}
            trend={stats?.kpi.sugerenciasIA > 0 ? -1 : 0}
            color={stats?.kpi.sugerenciasIA > 0 ? "red" : "orange"}
            icon={<Lightbulb size={20} />}
            sparklineData={[]}
            subtitle="2 rutinas expiran soon"
            onClick={() => navigate("/entrenador/clientes")}
          />
          <StatCard
            loading={loading}
            title="Sesiones de Hoy"
            value={stats?.kpi.sesionesPendientesHoy || 0}
            trend={0}
            color="green"
            icon={<CalendarClock size={20} />}
            sparklineData={[1, 2, 4, 3, 2]}
            subtitle={stats?.kpi.proximaSesionTexto || "Sin sesiones agendadas"}
            onClick={() => navigate("/entrenador/agenda")}
          />
          <StatCard
            loading={loading}
            title="Alumnos sin Rutina"
            value={stats?.kpi.rutinasActivas || 0}
            trend={0}
            color="purple"
            icon={<Dumbbell size={20} />}
            sparklineData={[]}
            subtitle="Se necesita acción"
            onClick={() => navigate("/entrenador/rutinas")}
          />
        </section>

        {/* 3. SECCIÓN INFERIOR: NOTIFICACIONES + PRÓXIMAS SESIONES */}
        <div className="grid grid-cols-12 gap-6 px-4 pb-10">

          {/* CENTRO DE NOTIFICACIONES Y SOLICITUDES */}
          <div className="col-span-12 xl:col-span-8">
            <div className="bg-white/[0.01] border border-white/[0.03] rounded-[3rem] p-8 backdrop-blur-xl shadow-2xl transition-all duration-500 hover:border-white/[0.05] overflow-hidden min-h-[400px]">
              <h3 className="text-xs font-black uppercase tracking-[0.25em] text-zinc-500 mb-6">
                Centro de Notificaciones y Solicitudes
              </h3>
              <LiveFeed
                logs={stats?.recentLogs}
                onViewAll={() => navigate("/entrenador/agenda")}
              />
            </div>
          </div>

          {/* PRÓXIMAS SESIONES DE ENTRENAMIENTO PERSONAL */}
          <div className="col-span-12 xl:col-span-4">
            <div className="bg-white/[0.01] border border-white/[0.03] rounded-[3rem] p-8 backdrop-blur-xl shadow-2xl transition-all duration-500 hover:border-white/[0.05] overflow-hidden min-h-[400px]">
              <h3 className="text-xs font-black uppercase tracking-[0.25em] text-zinc-500 mb-6">
                Próximas Sesiones de Entrenamiento Personal
              </h3>

              <div className="space-y-3">
                {!loading && stats?.proximasSesiones?.length > 0 ? (
                  stats.proximasSesiones.map((sesion, index) => {
                    const { dia, hora } = formatSessionDate(sesion);
                    return (
                      <div
                        key={index}
                        className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-4 hover:bg-white/[0.06] hover:border-gym-orange/20 transition-all duration-300 group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-1 h-10 rounded-full bg-gym-orange shadow-[0_0_8px_rgba(249,115,22,0.4)]"></div>
                          <div className="flex-1">
                            <p className="text-white font-bold text-sm group-hover:text-gym-orange transition-colors">
                              {dia} - {hora}
                            </p>
                            <p className="text-zinc-500 text-xs flex items-center gap-1.5 mt-0.5">
                              <User size={12} />
                              {sesion.cliente}
                            </p>
                          </div>
                          <div className="text-[10px] text-zinc-600 font-mono">
                            {sesion.duracion || 60} min
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Clock size={40} className="text-zinc-700 mb-4" />
                    <p className="text-zinc-500 font-medium text-sm">No hay sesiones agendadas</p>
                    <p className="text-zinc-600 text-xs mt-1">Tu agenda está libre por el momento.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
