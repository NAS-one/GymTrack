import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import { Users, DollarSign, Activity, AlertCircle } from 'lucide-react';

// Componentes
import { StatCard } from '../../components/admin/Dashboard/StatCard';
import { TrendsChart } from '../../components/admin/Dashboard/TrendsChart';
import { PeakHoursChart } from '../../components/admin/Dashboard/PeakHoursChart';
import { LiveFeed } from '../../components/admin/Dashboard/Livefeed';
import { OpportunityRadar } from '../../components/admin/Dashboard/OpportunityRadar';
import { StaffTimeline } from '../../components/admin/Dashboard/StaffTimeline';
import { formatMoney } from '../../utils/format';

export function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/dashboard/summary');

        let raw = response.data.body || response.data;
        if (raw && raw.body) {
          raw = raw.body;
        }

        if (!raw) {
          console.error("Estructura de datos inválida:", raw);
          return;
        }

        // =========================================================
        // 1. EXTRACCIÓN DIRECTA DE LA DATA REAL DEL BACKEND
        // =========================================================

        // Finanzas y Asistencia (Anual y Semanal)
        const revenueYear = Array.isArray(raw.chartData?.revenueYear) ? raw.chartData.revenueYear : [];
        const revenueWeek = Array.isArray(raw.chartData?.revenueWeek) ? raw.chartData.revenueWeek : [];
        const attendanceYear = Array.isArray(raw.chartData?.attendanceYear) ? raw.chartData.attendanceYear : [];
        const attendanceWeek = Array.isArray(raw.chartData?.attendanceWeek) ? raw.chartData.attendanceWeek : [];

        // Planes (Membresías)
        const pieActive = Array.isArray(raw.chartData?.membershipActive) ? raw.chartData.membershipActive : [];
        const pieHistory = Array.isArray(raw.chartData?.membershipHistory) ? raw.chartData.membershipHistory : [];

        const membershipActive = pieActive.map(item => ({ name: item.name, value: parseInt(item.value) }));
        const membershipHistory = pieHistory.map(item => ({ name: item.name, value: parseInt(item.value) }));

        // =========================================================
        // 2. MAPA DE CALOR (Peak Hours)
        // =========================================================
        const hoursToShow = [];
        for (let i = 6; i <= 22; i++) hoursToShow.push(i);

        const peakHoursRaw = Array.isArray(raw.peakHours) ? raw.peakHours : [];
        const peakHoursData = hoursToShow.map(hour => {
          const record = peakHoursRaw.find(r => parseInt(r.hora) === hour);
          return {
            hour: `${hour.toString().padStart(2, '0')}:00`,
            count: record ? parseInt(record.cantidad) : 0
          };
        });

        // =========================================================
        // 3. CONSTRUCCIÓN FINAL DEL OBJETO DE ESTADO
        // =========================================================
        const adaptedData = {
          kpi: {
            activeMembers: raw.kpi?.activeMembers || 0,
            monthlyRevenue: raw.kpi?.income || 0,
            todayAttendance: raw.kpi?.todayAttendance || 0,
            machinesMaintenance: raw.kpi?.machinesBroken || 0
          },
          chartData: { // <-- Nombrado exactamente como lo espera TrendsChart
            revenueYear,
            revenueWeek,
            attendanceYear,
            attendanceWeek,
            membershipActive,
            membershipHistory,
          },
          peakHours: peakHoursData, // <-- Separado correctamente para el mapa de calor
          recentLogs: Array.isArray(raw.recentLogs) ? raw.recentLogs : []
        };

        setStats(adaptedData);
      } catch (error) {
        console.error("Error Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-8 animate-fade-in-up pb-12">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Centro de Comando</h2>
          <p className="text-gym-gray mt-1">Visión general en tiempo real.</p>
        </div>
      </div>

      {/* 2. KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Miembros Activos"
          value={loading ? "..." : stats?.kpi.activeMembers}
          trend={5} icon={<Users size={24} />} color="blue"
          onClick={() => navigate('/clientes?estado=active')}
        />
        <StatCard
          title="Ingresos (Mes)"
          value={loading ? "..." : formatMoney(stats?.kpi.monthlyRevenue || 0)}
          trend={12} icon={<DollarSign size={24} />} color="orange"
          onClick={() => navigate('/finanzas')}
        />
        <StatCard
          title="Asistencia Hoy"
          value={loading ? "..." : stats?.kpi.todayAttendance}
          trend={0} icon={<Activity size={24} />} color="green"
          onClick={() => navigate('/asistencia-historial?filter=today')}
        />
        <StatCard
          title="Máquinas Dañadas"
          value={loading ? "..." : stats?.kpi.machinesMaintenance}
          trend={stats?.kpi.machinesMaintenance > 0 ? -1 : 0}
          icon={<AlertCircle size={24} />} color={stats?.kpi.machinesMaintenance > 0 ? "purple" : "green"}
          onClick={() => navigate('/inventario?status=issues')}
        />
      </div>

      {/* 3. SECCIÓN ANALÍTICA */}
      <div className="grid grid-cols-12 gap-6">

        {/* GRÁFICO PRINCIPAL */}
        <div
          className="col-span-12 xl:col-span-8 h-[450px] min-w-0"
          title="Tendencias"
        >
          {/* ✅ Pasa stats.chartData */}
          {!loading && stats && <TrendsChart data={stats.chartData} />}
        </div>

        {/* MAPA DE CALOR */}
        <div className="col-span-12 xl:col-span-4 h-[450px] min-w-0">
          {/* ✅ Pasa stats.peakHours */}
          {!loading && stats && <PeakHoursChart data={stats.peakHours} />}
        </div>

      </div>

      {/* 4. SECCIÓN OPERATIVA */}
      <div className="grid grid-cols-12 gap-6">

        {/* LIVE FEED */}
        <div className="col-span-12 xl:col-span-8 h-[350px] min-w-0">
          <LiveFeed
            logs={stats?.recentLogs}
            onViewAll={() => navigate('/asistencia-historial?filter=today')}
          />
        </div>

        {/* TIMELINE STAFF */}
        <div className="col-span-12 xl:col-span-4 h-[350px] min-w-0">
          <StaffTimeline />
        </div>

      </div>

      {/* RADAR DE OPORTUNIDADES */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-4 h-[350px] min-w-0">
          <OpportunityRadar />
        </div>
      </div>

    </div>
  );
}