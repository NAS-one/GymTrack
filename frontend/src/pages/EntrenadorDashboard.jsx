import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import { Users, Lightbulb, Activity, Dumbbell } from "lucide-react";

//Reutilizamos componentes de Admin
import { StatCard } from "../components/Dashboard/StatCard";
import { LiveFeed } from "../components/Dashboard/Livefeed";

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

        //Adaptacion datos para el entrenador
        const adaptedData = {
          kpi: {
            misAlumnos: raw.kpi?.misAlumnos || 0,
            sugerenciasIA: raw.kpi?.sugerenciasIA || 0,
            asistenciaHoy: raw.kpi?.asistenciaHoy || 0,
            rutinasActivas: raw.kpi?.rutinasActivas || 0,
          },
          recentLogs: Array.isArray(raw.recentLogs) ? raw.recentLogs : [],
        };

        setStats(adaptedData);
      } catch (error) {
        console.error("Error conectando con la BD del Entrenador:", error);
        //Datos falsos mientras ya que el backend del entrenador aun no existe
        /*setStats({
          kpi: {
            misAlumnos: 12,
            sugerenciasIA: 3,
            asistenciaHoy: 5,
            rutinasActivas: 10,
          },
          recentLogs: [],
        });*/
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in-up pb-12">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Mi Panel
          </h2>
          <p className="text-zinc-400 mt-1">
            Resumen de tus alumnos y tareas pendientes.
          </p>
        </div>
      </div>

      {/* 2. KPIS DEL ENTRENADOR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Mis Alumnos"
          value={loading ? "..." : stats?.kpi.misAlumnos}
          trend={0}
          icon={<Users size={24} />}
          color="blue"
          onClick={() => navigate("/entrenador/clientes")}
        />
        <StatCard
          title="Sugerencias IA"
          value={loading ? "..." : stats?.kpi.sugerenciasIA}
          trend={stats?.kpi.sugerenciasIA > 0 ? 1 : 0}
          icon={<Lightbulb size={24} />}
          color="orange" // Color naranja para llamar la atención
          onClick={() => navigate("/entrenador/clientes")} // Aquí podría ir a una vista de validaciones
        />
        <StatCard
          title="Alumnos Entrenando Hoy"
          value={loading ? "..." : stats?.kpi.asistenciaHoy}
          trend={0}
          icon={<Activity size={24} />}
          color="green"
          onClick={() => navigate("/entrenador/agenda")}
        />
        <StatCard
          title="Rutinas Activas"
          value={loading ? "..." : stats?.kpi.rutinasActivas}
          trend={0}
          icon={<Dumbbell size={24} />}
          color="purple"
          onClick={() => navigate("/entrenador/rutinas")}
        />
      </div>

      {/* 3. SECCIÓN OPERATIVA (Reutilizamos el LiveFeed para ver qué hacen sus alumnos) */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 h-[350px] min-w-0">
          <div className="bg-[#121214] border border-white/5 rounded-xl p-6 h-full flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-4">
              Actividad Reciente de Mis Alumnos
            </h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <LiveFeed
                logs={stats?.recentLogs}
                onViewAll={() => navigate("/entrenador/agenda")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
