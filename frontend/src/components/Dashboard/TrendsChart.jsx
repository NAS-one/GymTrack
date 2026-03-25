import { useState, useMemo, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { DollarSign, Users, PieChart as PieIcon, Eye, EyeOff, Calendar } from 'lucide-react';

const COLORS = ['#FF5722', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

const labelsTranslation = {
  Jan: 'Ene', Feb: 'Feb', Mar: 'Mar', Apr: 'Abr', May: 'May', Jun: 'Jun',
  Jul: 'Jul', Aug: 'Ago', Sep: 'Sep', Oct: 'Oct', Nov: 'Nov', Dec: 'Dic',
  Mon: 'Lun', Tue: 'Mar', Wed: 'Mié', Thu: 'Jue', Fri: 'Vie', Sat: 'Sáb', Sun: 'Dom'
};
// Trim() por si la base de datos manda espacios extra
const formatLabel = (label) => labelsTranslation[label?.trim()] || label?.trim();

export function TrendsChart({ data }) {
  const [activeTab, setActiveTab] = useState('revenue');
  const [timeRange, setTimeRange] = useState('year');
  const [membershipFilter, setMembershipFilter] = useState('active');

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showData, setShowData] = useState(true);

  // 0. AUTO-DETECCIÓN DE DATA (Para evitar que colapse si pasas la prop equivocada)
  const safeData = useMemo(() => {
    if (!data) return {};
    // Si pasaron todo el dashboardData, sacamos el chartData
    if (data.chartData) return data.chartData;
    return data;
  }, [data]);

  // 1. EXTRAER AÑOS (Forzando a que sean Números reales)
  const availableYears = useMemo(() => {
    if (!safeData || Object.keys(safeData).length === 0) return [];
    const yearsRevenue = safeData.revenueYear?.map(d => Number(d.year)) || [];
    const yearsAttendance = safeData.attendanceYear?.map(d => Number(d.year)) || [];
    const uniqueYears = [...new Set([...yearsRevenue, ...yearsAttendance])].filter(Boolean);
    return uniqueYears.sort((a, b) => b - a);
  }, [safeData]);

  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  // 2. PROCESAR DATOS (Con conversión segura de año)
  const currentData = useMemo(() => {
    if (!safeData || Object.keys(safeData).length === 0) return [];
    let rawData = [];

    if (activeTab === 'revenue') {
      rawData = timeRange === 'week' ? (safeData.revenueWeek || []) : (safeData.revenueYear || []);
    } else if (activeTab === 'attendance') {
      rawData = timeRange === 'week' ? (safeData.attendanceWeek || []) : (safeData.attendanceYear || []);
    } else if (activeTab === 'memberships') {
      return membershipFilter === 'active' ? (safeData.membershipActive || []) : (safeData.membershipHistory || []);
    }

    if (timeRange === 'year' && activeTab !== 'memberships') {
      // FORZAMOS LA CONVERSIÓN A NUMBER PARA EVITAR BUG "2026" === 2026 -> false
      return rawData.filter(d => Number(d.year) === Number(selectedYear));
    }
    return rawData;
  }, [safeData, activeTab, timeRange, membershipFilter, selectedYear]);

  // 3. TOTALES
  const totalValue = useMemo(() => {
    return currentData.reduce((acc, item) => acc + (Number(item.value) || 0), 0);
  }, [currentData]);

  const formattedTotal = activeTab === 'revenue'
    ? `$${totalValue.toLocaleString()}`
    : totalValue.toLocaleString();

  const renderTooltipText = (value, name) => {
    if (activeTab === 'revenue') return [`$${parseInt(value).toLocaleString()}`, "Ingresos"];
    if (activeTab === 'attendance') return [`${parseInt(value)} Accesos`, "Asistencia"];
    return [parseInt(value).toLocaleString(), name];
  };

  if (!data || Object.keys(safeData).length === 0) {
    return <div className="bg-gym-card h-full flex flex-col items-center justify-center text-zinc-500 rounded-2xl border border-white/5 min-h-[450px]">Cargando datos del gráfico...</div>;
  }

  return (
    <div className="bg-gym-card p-6 rounded-2xl border border-white/5 h-full shadow-lg flex flex-col min-h-[450px] relative overflow-hidden">

      {/* HEADER */}
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-gym-gray uppercase tracking-wider">
              {activeTab === 'revenue' && 'Flujo de Caja'}
              {activeTab === 'attendance' && 'Afluencia'}
              {activeTab === 'memberships' && 'Membresías'}
            </h3>
            <button
              onClick={() => setShowData(!showData)}
              className="text-gym-gray hover:text-white transition-colors"
            >
              {showData ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          </div>

          <div className="mt-1">
            {showData ? (
              <span className="text-3xl font-bold text-white tracking-tight">{formattedTotal}</span>
            ) : (
              <span className="text-3xl font-bold text-zinc-700 select-none tracking-widest">••••••</span>
            )}
          </div>

          {activeTab !== 'memberships' && timeRange === 'year' && availableYears.length > 0 && (
            <div className="mt-2 relative inline-block w-fit">
              <Calendar size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gym-orange pointer-events-none" />
              <select
                className="pl-6 pr-8 py-1 bg-gym-orange/10 border border-gym-orange/20 rounded-md text-xs font-bold text-gym-orange focus:outline-none appearance-none cursor-pointer hover:bg-gym-orange/20 transition-colors"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              >
                {availableYears.map(yr => <option key={yr} value={yr} className="text-black">{yr}</option>)}
              </select>
            </div>
          )}

          {(timeRange === 'week' || activeTab === 'memberships') && (
            <span className="text-xs text-zinc-500 mt-2 font-medium">
              {activeTab === 'memberships' ? 'Distribución Total' : 'Últimos 7 días'}
            </span>
          )}
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
            <TabButton active={activeTab === 'revenue'} onClick={() => setActiveTab('revenue')} icon={<DollarSign size={14} />} label="Finanzas" />
            <TabButton active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} icon={<Users size={14} />} label="Asistencia" />
            <TabButton active={activeTab === 'memberships'} onClick={() => setActiveTab('memberships')} icon={<PieIcon size={14} />} label="Planes" />
          </div>

          <div className="bg-black/40 p-1 rounded-lg border border-white/5 flex">
            {activeTab !== 'memberships' ? (
              <>
                <RangeButton active={timeRange === 'week'} onClick={() => setTimeRange('week')} label="Semana" />
                <RangeButton active={timeRange === 'year'} onClick={() => setTimeRange('year')} label="Año" />
              </>
            ) : (
              <>
                <RangeButton active={membershipFilter === 'active'} onClick={() => setMembershipFilter('active')} label="Activos" />
                <RangeButton active={membershipFilter === 'history'} onClick={() => setMembershipFilter('history')} label="Histórico" />
              </>
            )}
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="flex-1 w-full min-h-0 relative mt-4">
        {!showData ? (
          <div className="w-full h-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
            <div className="p-5 rounded-full bg-white/5 border border-white/5 mb-4 shadow-xl shadow-black/20">
              <EyeOff size={40} className="text-zinc-500" strokeWidth={1.5} />
            </div>
            <h4 className="text-base font-bold text-white tracking-tight">Vista Privada Activa</h4>
            <p className="text-sm text-zinc-500 mt-1 font-medium text-center">Los datos están ocultos.</p>
            <button onClick={() => setShowData(true)} className="mt-6 text-xs text-gym-orange hover:text-white font-bold uppercase tracking-wider transition-colors hover:underline">
              Mostrar Datos
            </button>
          </div>
        ) : currentData.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 font-medium text-sm">
            No hay registros para este periodo.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === 'memberships' ? (
              <PieChart>
                <Pie
                  data={currentData}
                  cx="50%" cy="50%"
                  innerRadius={80} outerRadius={110}
                  paddingAngle={4} dataKey="value" stroke="none"
                >
                  {currentData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #333', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" formatter={(val) => <span className="text-zinc-400 text-xs ml-1">{val}</span>} />
                <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle">
                  <tspan x="50%" dy="-0.5em" fontSize="24" fontWeight="bold" fill="white">{
                    totalValue >= 1000 ? (totalValue / 1000).toFixed(1) + 'k' : totalValue
                  }</tspan>
                  <tspan x="50%" dy="1.6em" fontSize="10" fill="#71717A">TOTAL</tspan>
                </text>
              </PieChart>
            ) : (
              <AreaChart data={currentData} margin={{ top: 10, right: 0, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF5722" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#FF5722" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradAtt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#52525B"
                  tick={{ fontSize: 10, fontWeight: 500 }}
                  axisLine={false} tickLine={false}
                  tickFormatter={formatLabel} dy={10}
                />
                <YAxis
                  stroke="#52525B"
                  tick={{ fontSize: 10, fontWeight: 500 }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(val) => activeTab === 'revenue' ? `$${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}` : val}
                />
                <Tooltip
                  cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff', fontSize: '12px' }}
                  formatter={renderTooltipText}
                  labelFormatter={formatLabel}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={activeTab === 'revenue' ? '#FF5722' : '#3B82F6'}
                  strokeWidth={3}
                  fillOpacity={1}
                  fill={`url(#grad${activeTab === 'revenue' ? 'Rev' : 'Att'})`}
                  animationDuration={1000}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-all text-xs font-medium ${active ? 'bg-white/10 text-white shadow-sm border border-white/5' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
      {icon} <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

function RangeButton({ active, onClick, label }) {
  return (
    <button onClick={onClick} className={`px-3 py-1.5 text-[10px] uppercase font-bold rounded-md transition-all ${active ? 'bg-white/10 text-white shadow-sm border border-white/5' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
      {label}
    </button>
  );
}