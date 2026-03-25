import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function PeakHoursChart({ data }) {
  // Si no hay data específica, mostramos un mensaje o placeholder
  if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-zinc-500 text-xs">Faltan datos de horarios</div>;

  // Calculamos el máximo para definir la intensidad del color
  const maxVal = Math.max(...data.map(d => d.count));

  const getBarColor = (val) => {
    const intensity = val / (maxVal || 1); // Evitar división por cero
    if (intensity > 0.75) return '#EF4444'; // Rojo (Lleno)
    if (intensity > 0.40) return '#F59E0B'; // Naranja (Medio)
    return '#10B981'; // Verde (Vacío)
  };

  return (
    <div className="bg-gym-card border border-white/5 rounded-2xl p-6 h-full shadow-lg flex flex-col min-h-0">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
            Horarios Punta
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-zinc-400 font-normal">Hoy</span>
        </h3>
        <p className="text-xs text-zinc-400">Intensidad de afluencia por hora.</p>
      </div>

      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
            <XAxis 
                dataKey="hour" 
                stroke="#52525B" 
                tick={{fontSize: 10}} 
                axisLine={false}
                tickLine={false}
            />
            <YAxis 
                stroke="#52525B" 
                tick={{fontSize: 10}} 
                axisLine={false}
                tickLine={false}
            />
            <Tooltip 
                cursor={{fill: 'rgba(255,255,255,0.05)'}}
                contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
                formatter={(value) => [`${value} personas`, 'Afluencia']}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.count)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Leyenda */}
      <div className="flex justify-center gap-4 mt-2 text-[10px] text-zinc-500">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> Bajo</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500"></div> Medio</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Alto</div>
      </div>
    </div>
  );
}