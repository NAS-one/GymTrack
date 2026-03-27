import { ArrowUpRight, ArrowDownRight, Minus, ChevronRight } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

export function StatCard({
  title,
  value,
  icon,
  color = "orange",
  trend,
  sparklineData = [],
  goalProgress,
  onClick,
  loading = false,
  subtitle = "vs mes anterior"
}) {

  const theme = {
    orange: { text: "text-gym-orange", border: "border-gym-orange/20", glow: "bg-gym-orange", chart: "#F97316" },
    green: { text: "text-emerald-400", border: "border-emerald-500/20", glow: "bg-emerald-500", chart: "#10B981" },
    blue: { text: "text-blue-400", border: "border-blue-500/20", glow: "bg-blue-500", chart: "#3B82F6" },
    purple: { text: "text-purple-400", border: "border-purple-500/20", glow: "bg-purple-500", chart: "#8B5CF6" },
    red: { text: "text-rose-400", border: "border-rose-500/20", glow: "bg-rose-500", chart: "#F43F5E" }
  };

  const activeTheme = theme[color] || theme.orange;

  if (loading) {
    return (
      <div className="bg-gym-card p-6 rounded-3xl border border-white/5 animate-pulse flex flex-col justify-between h-[180px]">
        <div className="flex justify-between items-start">
          <div className="space-y-3">
            <div className="h-2 w-16 bg-white/10 rounded-full"></div>
            <div className="h-6 w-24 bg-white/10 rounded-md"></div>
          </div>
          <div className="h-10 w-10 bg-white/10 rounded-xl"></div>
        </div>
        <div className="h-8 w-full bg-white/5 rounded-md mt-4"></div>
        <div className="h-2 w-20 bg-white/10 rounded-full mt-4"></div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`bg-gym-card p-6 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group transition-all duration-500 flex flex-col justify-between h-full min-h-[180px] ${onClick ? 'cursor-pointer hover:border-white/10 active:scale-[0.98]' : ''}`}
    >
      {/* 🟢 Efecto Glow Dinámico */}
      <div className={`absolute -right-12 -top-12 w-40 h-40 rounded-full blur-[60px] opacity-10 pointer-events-none transition-all duration-700 group-hover:opacity-25 group-hover:scale-110 ${activeTheme.glow}`}></div>

      {/* 🔵 Header: Título, Valor e Icono */}
      <div className="flex justify-between items-start relative z-10">
        <div className="space-y-1">
          <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.25em]">{title}</p>
          <div className="flex items-center gap-2">
            <h3 className="text-3xl font-black text-white tracking-tighter drop-shadow-sm">
              {value}
            </h3>
            {onClick && <ChevronRight size={18} className="text-zinc-700 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />}
          </div>
        </div>
        <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 ${activeTheme.text} shadow-inner backdrop-blur-md group-hover:bg-white/10 transition-colors`}>
          {icon}
        </div>
      </div>

      {/* 🟠 Sparkline Section: Visual de tendencia rápida */}
      <div className="absolute inset-x-0 bottom-12 h-12 opacity-30 group-hover:opacity-60 transition-opacity duration-700 pointer-events-none">
        {sparklineData && sparklineData.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData.map((v, i) => ({ i, v }))}>
              <defs>
                <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={activeTheme.chart} stopOpacity={0.6} />
                  <stop offset="100%" stopColor={activeTheme.chart} stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
              <Area
                type="monotone"
                dataKey="v"
                stroke={activeTheme.chart}
                strokeWidth={2}
                fill={`url(#grad-${color})`}
                isAnimationActive={true}
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 🔴 Footer: Tendencia y Meta */}
      <div className="mt-auto relative z-10 pt-4">
        <div className="flex flex-col gap-3">

          <div className="flex items-center gap-2">
            {trend !== undefined && (
              <>
                {trend > 0 ? (
                  <div className="flex items-center gap-0.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg text-[11px] font-black">
                    <ArrowUpRight size={14} strokeWidth={3} /> {trend}%
                  </div>
                ) : trend < 0 ? (
                  <div className="flex items-center gap-0.5 text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-lg text-[11px] font-black">
                    <ArrowDownRight size={14} strokeWidth={3} /> {Math.abs(trend)}%
                  </div>
                ) : (
                  <div className="flex items-center gap-0.5 text-zinc-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-lg text-[11px] font-black">
                    <Minus size={14} strokeWidth={3} /> 0%
                  </div>
                )}
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">{subtitle}</span>
              </>
            )}
          </div>

          {goalProgress !== undefined && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-zinc-500">
                <span>Objetivo Mensual</span>
                <span className="text-white">{goalProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${activeTheme.glow}`}
                  style={{ width: `${goalProgress}%`, boxShadow: `0 0 10px ${activeTheme.chart}` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}