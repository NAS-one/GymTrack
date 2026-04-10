import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { DollarSign, Users, PieChart as PieIcon, Eye, EyeOff, Calendar, LineChart, ExternalLink, Activity } from 'lucide-react';

const PIE_COLORS = ['#F97316', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B'];

const labelsTranslation = {
  Jan: 'Ene', Feb: 'Feb', Mar: 'Mar', Apr: 'Abr', May: 'May', Jun: 'Jun',
  Jul: 'Jul', Aug: 'Ago', Sep: 'Sep', Oct: 'Oct', Nov: 'Nov', Dec: 'Dic',
  Mon: 'Lun', Tue: 'Mar', Wed: 'Mié', Thu: 'Jue', Fri: 'Vie', Sat: 'Sáb', Sun: 'Dom'
};

const formatLabel = (label) => labelsTranslation[label?.trim()] || label?.trim();

// --- TOOLTIP PERSONALIZADO (Con pointerEvents: 'none' FORZADO) ---
const CustomAreaTooltip = ({ active, payload, label, activeTab }) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const isRevenue = activeTab === 'revenue';

    return (
      // 🌟 pointerEvents: 'none' evita que el tooltip bloquee el click del mouse
      <div style={{ pointerEvents: 'none' }} className="bg-[#09090b]/95 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] transform transition-all duration-200">
        <p className="text-zinc-500 text-[10px] font-black mb-1.5 uppercase tracking-widest">{formatLabel(label)}</p>
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full shadow-lg ${isRevenue ? 'bg-gym-orange shadow-gym-orange/50' : 'bg-blue-500 shadow-blue-500/50'}`} />
          <p className="text-white text-lg font-black tracking-tight">
            {isRevenue ? `$${value.toLocaleString()}` : `${value} accesos`}
          </p>
        </div>
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-1.5 text-[9px] text-zinc-400 uppercase font-bold tracking-wider">
          <ExternalLink size={12} className={isRevenue ? 'text-gym-orange' : 'text-blue-500'} />
          <span>Click para inspeccionar</span>
        </div>
      </div>
    );
  }
  return null;
};

export function TrendsChart({ data }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('revenue');
  const [timeRange, setTimeRange] = useState('month');
  const [membershipFilter, setMembershipFilter] = useState('active');

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showData, setShowData] = useState(true);

  // 1. AUTO-DETECCIÓN DE DATOS SEGUROS
  const safeData = useMemo(() => {
    if (!data) return {};
    if (data.chartData) return data.chartData;
    return data;
  }, [data]);

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

  // 2. PROCESAMIENTO Y CORTE INTELIGENTE DE DATOS
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

    if ((timeRange === 'year' || timeRange === 'month') && activeTab !== 'memberships') {
      rawData = rawData.filter(d => Number(d.year) === Number(selectedYear));
    }

    const today = new Date();
    const currentMonthIndex = today.getMonth();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (activeTab !== 'memberships') {
      rawData = rawData.filter(d => {
        if (Number(d.year) === today.getFullYear()) {
          const dataMonthIndex = monthNames.indexOf(d.name);
          if (dataMonthIndex !== -1 && dataMonthIndex > currentMonthIndex) return false;
        }
        return true;
      });
    }

    if (timeRange === 'month' && activeTab !== 'memberships') {
      return rawData.slice(-6);
    }

    return rawData;
  }, [safeData, activeTab, timeRange, membershipFilter, selectedYear]);

  const totalValue = useMemo(() => {
    return currentData.reduce((acc, item) => acc + (Number(item.value) || 0), 0);
  }, [currentData]);

  const formattedTotal = activeTab === 'revenue' ? `$${totalValue.toLocaleString()}` : totalValue.toLocaleString();

  // 3. 🌟 FUNCIÓN CENTRALIZADA DE REDIRECCIÓN 🌟
  const executeRedirection = (rawLabel) => {
    if (!rawLabel) return;
    const clickedLabel = rawLabel.trim().toLowerCase();

    const monthMap = {
      jan: 1, ene: 1, enero: 1,
      feb: 2, febrero: 2,
      mar: 3, marzo: 3,
      apr: 4, abr: 4, abril: 4,
      may: 5, mayo: 5,
      jun: 6, junio: 6,
      jul: 7, julio: 7,
      aug: 8, ago: 8, agosto: 8,
      sep: 9, septiembre: 9,
      oct: 10, octubre: 10,
      nov: 11, noviembre: 11,
      dec: 12, dic: 12, diciembre: 12
    };

    if (timeRange === 'year' || timeRange === 'month') {
      const monthNumber = monthMap[clickedLabel];

      if (!monthNumber) {
        return;
      }

      if (activeTab === 'attendance') {
        navigate(`/asistencia-historial?year=${selectedYear}&month=${monthNumber}`);
      } else if (activeTab === 'revenue') {
        navigate(`/finanzas?year=${selectedYear}&month=${monthNumber}`);
      }

    } else if (timeRange === 'week') {
      if (activeTab === 'attendance') navigate(`/asistencia-historial?filter=today`);
      if (activeTab === 'revenue') navigate(`/finanzas`);
    }
  };

  // 🌟 CAPTURA DE CLIC GENERAL EN EL GRÁFICO
  const handleChartClick = (state) => {
    if (state && state.activePayload && state.activePayload[0]) {
      executeRedirection(state.activePayload[0].payload.name);
    }
  };

  // 🌟 CAPTURA DE CLIC DIRECTO EN EL PUNTO DEL GRÁFICO (Active Dot)
  const handleActiveDotClick = (_, payload) => {
    if (payload && payload.payload && payload.payload.name) {
      executeRedirection(payload.payload.name);
    }
  };

  const handlePieClick = (data) => {
    if (!data) return;
    navigate(`/planes?plan=${data.name}`);
  };

  if (!data || Object.keys(safeData).length === 0) {
    return (
      <div className="bg-gym-card p-6 rounded-2xl border border-white/5 h-full flex flex-col items-center justify-center text-zinc-500 shadow-lg min-h-[450px]">
        <Activity size={40} className="mb-4 opacity-20 animate-pulse" />
        <p className="font-medium text-sm">Procesando inteligencia de datos...</p>
      </div>
    );
  }

  return (
    <div className="bg-gym-card p-6 rounded-3xl border border-white/5 h-full shadow-2xl flex flex-col min-h-[450px] relative overflow-hidden group transition-all duration-500 hover:border-white/10">

      {/* EFECTO GLOW DE FONDO AMBIENTAL */}
      <div className={`absolute -top-32 -right-32 w-96 h-96 blur-[100px] rounded-full pointer-events-none transition-colors duration-1000 opacity-10
        ${activeTab === 'revenue' ? 'bg-gym-orange' : activeTab === 'attendance' ? 'bg-blue-500' : 'bg-purple-500'}`}
      />

      {/* HEADER DINÁMICO */}
      <div className="flex flex-col lg:flex-row justify-between items-start mb-8 relative z-10 gap-5">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
              {activeTab === 'revenue' && <><DollarSign size={16} className="text-gym-orange" /> Flujo de Caja</>}
              {activeTab === 'attendance' && <><Users size={16} className="text-blue-500" /> Afluencia</>}
              {activeTab === 'memberships' && <><PieIcon size={16} className="text-purple-500" /> Membresías</>}
            </h3>
            <button onClick={() => setShowData(!showData)} className="text-zinc-500 hover:text-white hover:bg-white/10 transition-colors bg-white/5 p-1.5 rounded-lg border border-transparent hover:border-white/10" title="Alternar Privacidad">
              {showData ? <Eye size={14} /> : <EyeOff size={14} />}
            </button>
          </div>

          <div className="mt-1 flex items-baseline gap-2">
            {showData ? (
              <span className="text-4xl font-black text-white tracking-tighter drop-shadow-sm">{formattedTotal}</span>
            ) : (
              <span className="text-4xl font-black text-zinc-700 select-none tracking-widest">••••••</span>
            )}
          </div>

          {activeTab !== 'memberships' && (timeRange === 'year' || timeRange === 'month') && availableYears.length > 0 && (
            <div className="mt-2 relative inline-block w-fit group/select">
              <Calendar size={12} className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${activeTab === 'revenue' ? 'text-gym-orange' : 'text-blue-500'}`} />
              <select
                className={`pl-8 pr-10 py-1.5 bg-black/40 border border-white/5 rounded-xl text-xs font-bold focus:outline-none appearance-none cursor-pointer hover:bg-white/5 hover:border-white/10 transition-all shadow-inner
                  ${activeTab === 'revenue' ? 'text-gym-orange' : 'text-blue-400'}`}
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              >
                {availableYears.map(yr => <option key={yr} value={yr} className="text-black">{yr}</option>)}
              </select>
            </div>
          )}
          <span className="text-[9px] text-zinc-500 mt-2 font-black uppercase tracking-[0.15em] bg-black/50 px-2.5 py-1.5 rounded-lg w-fit border border-white/5">
            {activeTab === 'memberships' ? 'Distribución Activa' : timeRange === 'week' ? 'Dinámica de 7 días' : timeRange === 'month' ? 'Análisis Semestral' : 'Análisis Anual'}
          </span>
        </div>

        {/* CONTROLES / TABS INTERACTIVOS */}
        <div className="flex flex-col items-start lg:items-end gap-3 w-full lg:w-auto">
          <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 w-full lg:w-auto overflow-x-auto custom-scrollbar shadow-inner">
            <TabButton active={activeTab === 'revenue'} onClick={() => setActiveTab('revenue')} icon={<DollarSign size={14} />} label="Finanzas" activeColor="text-gym-orange" />
            <TabButton active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')} icon={<Users size={14} />} label="Asistencia" activeColor="text-blue-400" />
            <TabButton active={activeTab === 'memberships'} onClick={() => setActiveTab('memberships')} icon={<PieIcon size={14} />} label="Planes" activeColor="text-purple-400" />
          </div>

          <div className="bg-black/40 p-1.5 rounded-2xl border border-white/5 flex w-full lg:w-auto shadow-inner">
            {activeTab !== 'memberships' ? (
              <>
                <RangeButton active={timeRange === 'week'} onClick={() => setTimeRange('week')} label="Semana" />
                <RangeButton active={timeRange === 'month'} onClick={() => setTimeRange('month')} label="Semestre" />
                <RangeButton active={timeRange === 'year'} onClick={() => setTimeRange('year')} label="Año" />
              </>
            ) : (
              <>
                <RangeButton active={membershipFilter === 'active'} onClick={() => setMembershipFilter('active')} label="Activos" />
                <RangeButton active={membershipFilter === 'history'} onClick={() => setMembershipFilter('history')} label="Todos" />
              </>
            )}
          </div>
        </div>
      </div>

      {/* ÁREA DEL GRÁFICO */}
      <div className="flex-1 w-full min-h-0 relative mt-2">
        {!showData ? (
          <div className="w-full h-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500">
            <div className="p-6 rounded-full bg-white/5 border border-white/10 mb-5 shadow-2xl backdrop-blur-md">
              <EyeOff size={48} className="text-zinc-500" strokeWidth={1.5} />
            </div>
            <h4 className="text-lg font-bold text-white tracking-tight">Modo Confidencial</h4>
            <button onClick={() => setShowData(true)} className="mt-5 text-xs bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-xl text-white font-bold transition-all border border-white/5 hover:border-white/20 shadow-lg">
              Revelar Métricas
            </button>
          </div>
        ) : currentData.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.01] animate-in fade-in">
            <LineChart size={40} className="mb-3 opacity-30" strokeWidth={1.5} />
            <p className="text-sm font-medium">Aún no hay registros consolidados para este período.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" className="animate-in fade-in duration-700">
            {activeTab === 'memberships' ? (
              <PieChart style={{ cursor: 'pointer' }}>
                <Pie
                  data={currentData} cx="50%" cy="50%"
                  innerRadius={100} outerRadius={130}
                  paddingAngle={4} dataKey="value" stroke="none"
                  onClick={handlePieClick}
                  className="cursor-pointer focus:outline-none hover:opacity-80 transition-all duration-300"
                >
                  {currentData.map((entry, index) => (<Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }} itemStyle={{ color: '#fff', fontWeight: '900' }} />
                <Legend verticalAlign="bottom" height={40} iconType="circle" formatter={(val) => <span className="text-zinc-400 font-bold text-[11px] uppercase tracking-wider ml-1.5 hover:text-white cursor-pointer transition-colors">{val}</span>} />
                <text x="50%" y="48%" textAnchor="middle" dominantBaseline="middle">
                  <tspan x="50%" dy="-0.1em" fontSize="32" fontWeight="900" fill="white">{totalValue >= 1000 ? (totalValue / 1000).toFixed(1) + 'k' : totalValue}</tspan>
                  <tspan x="50%" dy="1.8em" fontSize="10" fill="#71717A" fontWeight="900" letterSpacing="0.2em">TOTAL</tspan>
                </text>
              </PieChart>
            ) : (
              <AreaChart
                data={currentData}
                margin={{ top: 20, right: 0, left: -15, bottom: 0 }}
                onClick={handleChartClick}
                style={{ cursor: 'pointer' }}
              >
                <defs>
                  <linearGradient id="gradColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={activeTab === 'revenue' ? '#F97316' : '#3B82F6'} stopOpacity={0.6} />
                    <stop offset="100%" stopColor={activeTab === 'revenue' ? '#F97316' : '#3B82F6'} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis dataKey="name" stroke="#52525B" tick={{ fontSize: 10, fontWeight: 700, fill: '#71717a' }} axisLine={false} tickLine={false} tickFormatter={formatLabel} dy={15} />
                <YAxis stroke="#52525B" tick={{ fontSize: 10, fontWeight: 700, fill: '#71717a' }} axisLine={false} tickLine={false} tickFormatter={(val) => activeTab === 'revenue' ? `$${val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val}` : val} />

                {/* Se elimina la animación de Tooltip para que no absorba los clics */}
                <Tooltip
                  content={<CustomAreaTooltip activeTab={activeTab} />}
                  cursor={{ stroke: 'rgba(255,255,255,0.05)', strokeWidth: 40, radius: 8 }}
                  isAnimationActive={false}
                />

                <Area
                  type="monotone" dataKey="value"
                  stroke={activeTab === 'revenue' ? '#F97316' : '#3B82F6'}
                  strokeWidth={4} fillOpacity={1} fill="url(#gradColor)"
                  animationDuration={1500} animationEasing="ease-out"
                  activeDot={{
                    r: 8,
                    strokeWidth: 4,
                    stroke: '#09090b',
                    fill: activeTab === 'revenue' ? '#F97316' : '#3B82F6',
                    shadowBlur: 10,
                    shadowColor: 'white',
                    cursor: 'pointer',
                    onClick: handleActiveDotClick // 🌟 CAPTURA DIRECTA DEL PUNTO
                  }}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// --- COMPONENTES UI MEJORADOS ---
function TabButton({ active, onClick, icon, label, activeColor }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl transition-all duration-300 text-xs font-black uppercase tracking-wider ${active ? `bg-white/10 ${activeColor} shadow-lg border border-white/10 scale-95` : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
      {icon} <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

function RangeButton({ active, onClick, label }) {
  return (
    <button onClick={onClick} className={`flex-1 sm:flex-none px-5 py-2 text-[10px] uppercase tracking-[0.15em] font-black rounded-xl transition-all duration-300 ${active ? 'bg-white/10 text-white shadow-lg border border-white/10 scale-95' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
      {label}
    </button>
  );
}