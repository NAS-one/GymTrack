import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export function StatCard({ title, value, icon, color = "orange", trend, onClick }) {
  
  // 1. Mapa de colores dinámico (Tailwind)
  const colorStyles = {
    orange: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    green: "text-green-500 bg-green-500/10 border-green-500/20",
    blue: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    purple: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  };

  const activeStyle = colorStyles[color] || colorStyles.orange;

  // 2. Lógica de Tendencia (Numérica)
  const renderTrend = () => {
    if (trend === undefined || trend === null) return null;

    if (trend > 0) {
      return (
        <span className="text-green-400 flex items-center gap-1 bg-green-400/10 px-1.5 py-0.5 rounded text-xs font-bold">
          <ArrowUpRight size={12} /> {trend}%
        </span>
      );
    }
    if (trend < 0) {
      return (
        <span className="text-red-400 flex items-center gap-1 bg-red-400/10 px-1.5 py-0.5 rounded text-xs font-bold">
          <ArrowDownRight size={12} /> {Math.abs(trend)}%
        </span>
      );
    }
    return <span className="text-zinc-500"><Minus size={12}/> 0%</span>;
  };

  return (
    <div 
      onClick={onClick}
      // 👇 LÓGICA DE INTERACCIÓN AÑADIDA
      className={`
        bg-gym-card p-6 rounded-2xl border border-white/5 
        shadow-lg shadow-black/20 group relative overflow-hidden
        transition-all duration-300
        ${onClick 
            ? 'cursor-pointer hover:border-white/20 hover:bg-white/5 active:scale-95 hover:shadow-xl' 
            : 'hover:border-white/10'
        }
      `}
    >
      
      {/* Fondo decorativo (Glow) */}
      <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-10 -mr-8 -mt-8 ${activeStyle.split(' ')[0].replace('text', 'bg')}`}></div>

      {/* Header: Título e Icono */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <p className="text-gym-gray text-xs font-bold uppercase tracking-wider mb-1 opacity-80">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-white tracking-tight">
            {value}
          </h3>
        </div>

        <div className={`p-3 rounded-xl shadow-inner ${activeStyle}`}>
          {icon}
        </div>
      </div>

      {/* Footer: Tendencia */}
      <div className="flex items-center gap-2 relative z-10 text-xs font-medium">
        {renderTrend()}
        {trend !== undefined && <span className="text-zinc-500">vs mes anterior</span>}
      </div>

    </div>
  );
}