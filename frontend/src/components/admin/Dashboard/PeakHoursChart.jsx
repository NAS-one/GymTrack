import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#09090b] border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md">
        <p className="text-zinc-400 text-xs font-bold mb-1">Hora: {label}</p>
        <p className="text-white text-sm font-black flex items-center gap-2">
          {data.count} accesos registrados
        </p>
        <p className="text-[9px] text-gym-orange mt-2 uppercase tracking-wider font-bold">
          Click para ver asistentes ➔
        </p>
      </div>
    );
  }
  return null;
};

export function PeakHoursChart({ data }) {
  const navigate = useNavigate();

  if (!data || data.length === 0) {
    return <div className="bg-gym-card border border-white/5 rounded-2xl p-6 h-full flex items-center justify-center text-zinc-500 text-sm">Cargando afluencia...</div>;
  }

  // 🌟 LÓGICA DE TIEMPO REAL: Filtrar horas del futuro
  const currentHour = new Date().getHours();
  const pastAndCurrentData = data.filter(entry => {
    const entryHour = parseInt(entry.hour.split(':')[0], 10);
    return entryHour <= currentHour;
  });

  const maxVal = Math.max(...pastAndCurrentData.map(d => d.count));

  // Asignamos un ID de gradiente en lugar de un color sólido
  const getGradientId = (val) => {
    if (val === 0) return 'colorEmpty';
    const intensity = val / (maxVal || 1);
    if (intensity > 0.75) return 'colorHigh';
    if (intensity > 0.40) return 'colorMed';
    return 'colorLow';
  };

  const handleBarClick = (entry) => {
    if (entry.count === 0) return;
    const hourPrefix = entry.hour.split(':')[0];
    navigate(`/asistencia-historial?filter=today&hour=${hourPrefix}`);
  };

  return (
    <div className="bg-gym-card border border-white/5 rounded-2xl p-6 h-full shadow-xl flex flex-col min-h-0 relative group overflow-hidden">

      {/* Brillo dinámico de fondo */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gym-orange/5 blur-3xl rounded-full pointer-events-none"></div>

      <div className="mb-6 relative z-10 flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            Afluencia en Vivo
            <span className="relative flex h-2 w-2 ml-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gym-orange opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-gym-orange"></span>
            </span>
          </h3>
          <p className="text-xs text-zinc-400">Progreso hasta las {currentHour}:00 hrs</p>
        </div>
      </div>

      <div className="flex-1 w-full min-h-0 relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={pastAndCurrentData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            {/* 🌟 DEFINICIÓN DE GRADIENTES PREMIUM */}
            <defs>
              <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={1} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="colorMed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F97316" stopOpacity={1} />
                <stop offset="95%" stopColor="#F97316" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={1} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="colorEmpty" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#27272a" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#27272a" stopOpacity={0.2} />
              </linearGradient>
            </defs>

            <XAxis dataKey="hour" stroke="#52525B" tick={{ fontSize: 10, fill: '#A1A1AA' }} axisLine={false} tickLine={false} dy={10} />
            <YAxis stroke="#52525B" tick={{ fontSize: 10, fill: '#A1A1AA' }} axisLine={false} tickLine={false} allowDecimals={false} domain={[0, 'dataMax > 5 ? dataMax : 5']} />

            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 4 }} content={<CustomTooltip />} />

            <Bar dataKey="count" radius={[4, 4, 0, 0]} onClick={handleBarClick} className="cursor-pointer transition-all duration-300 hover:opacity-80 hover:-translate-y-1" minPointSize={2}>
              {pastAndCurrentData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={`url(#${getGradientId(entry.count)})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-center gap-5 mt-4 text-[10px] font-bold uppercase tracking-wider text-zinc-500 relative z-10">
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#10B981]"></div> Bajo</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#F97316]"></div> Normal</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#EF4444]"></div> Peak</div>
      </div>
    </div>
  );
}