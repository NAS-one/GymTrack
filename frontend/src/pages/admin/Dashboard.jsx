import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import { Users, DollarSign, Activity, AlertCircle, TrendingUp } from 'lucide-react';

// Componentes
import { StatCard } from '../../components/admin/Dashboard/StatCard';
import { TrendsChart } from '../../components/admin/Dashboard/TrendsChart';
import { PeakHoursChart } from '../../components/admin/Dashboard/PeakHoursChart';
import { LiveFeed } from '../../components/admin/Dashboard/Livefeed';
import { StaffTimeline } from '../../components/admin/Dashboard/StaffTimeline';
import { formatMoney } from '../../Utils/format';

export function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 🕒 1. VARIABLES DE FECHA (Para redirección técnica de Finanzas)
  const now = useMemo(() => new Date(), []);
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // 2. CONFIGURACIÓN DE METAS (Para la barra de progreso)
  const INCOME_GOAL = 5000000;
  const incomeProgress = stats ? Math.min(100, Math.round((stats.kpi.income / INCOME_GOAL) * 100)) : 0;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/dashboard/summary');
        let raw = response.data.body || response.data;
        if (raw && raw.body) raw = raw.body;

        if (!raw) return;

        const adaptedData = {
          kpi: {
            income: raw.kpi?.income || 0,
            incomeTrend: raw.kpi?.incomeTrend || 0,
            activeMembers: raw.kpi?.activeMembers || 0,
            newMembersTrend: raw.kpi?.newMembersTrend || 0,
            todayAttendance: raw.kpi?.todayAttendance || 0,
            machinesBroken: raw.kpi?.machinesBroken || 0
          },
          chartData: raw.chartData,
          peakHours: (raw.peakHours || []).map(r => ({
            hour: `${r.hora.toString().padStart(2, '0')}:00`,
            count: parseInt(r.cantidad)
          })),
          recentLogs: Array.isArray(raw.recentLogs) ? raw.recentLogs : []
        };

        setStats(adaptedData);
      } catch (error) {
        console.error("Dashboard Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

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
            Centro de <span className="text-zinc-700 not-italic">Mando</span>
          </h2>
          <p className="text-zinc-500 font-bold text-sm uppercase tracking-[0.2em] mt-2 opacity-80">
            Inteligencia operativa y financiera
          </p>
        </header>

        {/* 2. SECCIÓN DE KPIS (Redirección con parámetros corregida) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 px-4">

          {/* INRESOS -> Finanzas filtrado por mes actual */}
          <StatCard
            loading={loading}
            title="Ingresos del Mes"
            value={formatMoney(stats?.kpi?.income || 0)}
            trend={stats?.kpi?.incomeTrend}
            color="orange"
            icon={<DollarSign size={20} />}
            sparklineData={stats?.chartData?.revenueWeek?.map(d => d.value) || []}
            goalProgress={incomeProgress}
            onClick={() => navigate(`/finanzas?year=${currentYear}&month=${currentMonth}`)}
          />

          {/* 🌟 MIEMBROS ACTIVOS -> Clientes filtrado por 'active' */}
          <StatCard
            loading={loading}
            title="Miembros Activos"
            value={`${stats?.kpi?.activeMembers || 0}`}
            trend={stats?.kpi?.newMembersTrend}
            color="blue"
            icon={<Users size={20} />}
            sparklineData={[40, 42, 45, 50, 52, 55, 60]}
            subtitle="Crecimiento neto mes"
            onClick={() => navigate('/clientes?status=active')}
          />

          {/* ASISTENCIA -> Historial hoy */}
          <StatCard
            loading={loading}
            title="Asistencia Hoy"
            value={stats?.kpi?.todayAttendance || 0}
            trend={0}
            color="green"
            icon={<Activity size={20} />}
            sparklineData={stats?.peakHours?.map(d => d.count) || []}
            subtitle="Accesos registrados"
            onClick={() => navigate('/asistencia-historial?filter=today')}
          />

          {/* ALERTAS -> Inventario con problemas */}
          <StatCard
            loading={loading}
            title="Equipos"
            value={stats?.kpi?.machinesBroken || 0}
            trend={stats?.kpi?.machinesBroken > 0 ? -1 : 0}
            color={stats?.kpi?.machinesBroken > 0 ? "red" : "green"}
            icon={<AlertCircle size={20} />}
            subtitle={stats?.kpi?.machinesBroken > 0 ? "Alerta de reparación" : "Operatividad total"}
            onClick={() => navigate('/inventario?status=issues')}
          />
        </section>

        {/* 3. SECCIÓN ANALÍTICA */}
        <div className="grid grid-cols-12 gap-6 px-4">
          <div className="col-span-12 xl:col-span-8">
            <div className="h-full bg-white/[0.01] border border-white/[0.02] rounded-[3rem] p-3 backdrop-blur-3xl hover:bg-white/[0.02] transition-all duration-700 shadow-2xl overflow-hidden">
              {!loading && stats && <TrendsChart data={stats.chartData} />}
            </div>
          </div>

          <div className="col-span-12 xl:col-span-4">
            <div className="h-full bg-white/[0.01] border border-white/[0.02] rounded-[3rem] p-3 backdrop-blur-3xl hover:bg-white/[0.02] transition-all duration-700 shadow-2xl overflow-hidden">
              {!loading && stats && <PeakHoursChart data={stats.peakHours} />}
            </div>
          </div>
        </div>

        {/* 4. SECCIÓN OPERATIVA */}
        <div className="grid grid-cols-12 gap-6 px-4 pb-10">
          <div className="col-span-12 xl:col-span-8">
            <div className="bg-white/[0.01] border border-white/[0.03] rounded-[3rem] p-8 backdrop-blur-xl shadow-2xl transition-all duration-500 hover:border-white/[0.05] overflow-hidden">
              <LiveFeed
                logs={stats?.recentLogs}
                onViewAll={() => navigate('/asistencia-historial?filter=today')}
              />
            </div>
          </div>
          <div className="col-span-12 xl:col-span-4">
            <div className="bg-white/[0.01] border border-white/[0.03] rounded-[3rem] p-8 backdrop-blur-xl shadow-2xl transition-all duration-500 hover:border-white/[0.05] h-full overflow-hidden">
              <StaffTimeline />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}