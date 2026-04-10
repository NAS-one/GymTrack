import { useEffect, useState } from "react";
import axios from "../api/axios";
import {
  DollarSign,
  TrendingUp,
  Users,
  CalendarCheck,
  Wallet,
  Loader2,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export function EntrenadorFinanzas() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinanzas = async () => {
      try {
        const res = await axios.get("/entrenadores/mis-finanzas");
        setData(res.data.body);
      } catch (error) {
        console.error("Error cargando finanzas:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFinanzas();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-gym-orange" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center text-zinc-500 mt-20">
        No se pudieron cargar tus datos financieros.
      </div>
    );
  }

  const { perfil, sesiones, totalesMes, historico, totalEstimado } = data;
  const esFijo = perfil.modelo_contrato === "sueldo_fijo";

  return (
    <div className="relative min-h-screen pb-20 animate-fade-in select-none">
      {/* CAPA ATMOSFÉRICA */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-green-500/5 blur-[140px] rounded-full opacity-40"></div>
        <div className="absolute bottom-[5%] right-[-5%] w-[45%] h-[45%] bg-gym-orange/5 blur-[140px] rounded-full opacity-30"></div>
      </div>

      <div className="relative z-10 space-y-10 max-w-[1550px] mx-auto">
        {/* HEADER */}
        <header className="px-4 mt-2">
          <div className="flex items-center gap-3 mb-2">
            <Wallet size={18} className="text-green-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">
              {esFijo ? "Contrato Sueldo Fijo" : "Contrato por Comisión"}
            </span>
          </div>
          <h2 className="text-6xl font-black text-white tracking-tighter italic">
            Mis <span className="text-zinc-700 not-italic">Finanzas</span>
          </h2>
          <p className="text-zinc-500 font-bold text-sm uppercase tracking-[0.2em] mt-2 opacity-80">
            Balance financiero del mes actual
          </p>
        </header>

        {/* KPIS ADAPTATIVOS */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-5 px-4">
          {esFijo ? (
            <>
              {/* === MODELO SUELDO FIJO === */}
              <KpiCard
                title="Sueldo Base"
                value={`$${perfil.sueldo_base?.toLocaleString()}`}
                subtitle="Monto fijo mensual"
                icon={<DollarSign size={20} />}
                color="green"
              />
              <KpiCard
                title="Bono por Alumnos"
                value={`$${(5000 * perfil.total_alumnos_activos).toLocaleString()}`}
                subtitle={`${perfil.total_alumnos_activos} alumnos activos × $5.000`}
                icon={<Users size={20} />}
                color="blue"
              />
              <KpiCard
                title="Total Estimado"
                value={`$${totalEstimado?.toLocaleString()}`}
                subtitle="Sueldo + Bonos"
                icon={<TrendingUp size={20} />}
                color="orange"
                highlight
              />
            </>
          ) : (
            <>
              {/* === MODELO PORCENTAJE === */}
              <KpiCard
                title="Comisiones del Mes"
                value={`$${totalesMes.comisiones_realizadas?.toLocaleString()}`}
                subtitle={`${totalesMes.total_sesiones} sesiones este mes`}
                icon={<DollarSign size={20} />}
                color="green"
              />
              <KpiCard
                title="Sesiones Realizadas"
                value={
                  totalesMes.total_sesiones - totalesMes.sesiones_pendientes
                }
                subtitle={`${totalesMes.sesiones_pendientes} pendientes aún`}
                icon={<CalendarCheck size={20} />}
                color="blue"
              />
              <KpiCard
                title="Total Ganado"
                value={`$${totalEstimado?.toLocaleString()}`}
                subtitle={`Retención gym: ${(Number(perfil.porcentaje_retencion) * 100).toFixed(0)}%`}
                icon={<TrendingUp size={20} />}
                color="orange"
                highlight
              />
            </>
          )}
        </section>

        {/* SECCIÓN MEDIA: HISTORIAL + GRÁFICO */}
        <div className="grid grid-cols-12 gap-6 px-4">
          {/* TABLA DE SESIONES DEL MES */}
          <div className="col-span-12 xl:col-span-7">
            <div className="bg-white/[0.01] border border-white/[0.03] rounded-[3rem] p-8 backdrop-blur-xl shadow-2xl overflow-hidden">
              <h3 className="text-xs font-black uppercase tracking-[0.25em] text-zinc-500 mb-6">
                Sesiones del Mes
              </h3>

              {sesiones.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
                  <Clock size={40} className="mb-4 opacity-30" />
                  <p className="text-sm">
                    No tienes sesiones registradas este mes.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-sm">
                    <thead className="text-[10px] uppercase tracking-wider text-zinc-500 border-b border-white/5 sticky top-0 bg-[#0c0c0e]">
                      <tr>
                        <th className="pb-3 pr-4">Fecha</th>
                        <th className="pb-3 pr-4">Cliente</th>
                        <th className="pb-3 pr-4 text-center">Duración</th>
                        <th className="pb-3 pr-4 text-right">Cobrado</th>
                        <th className="pb-3 pr-4 text-right">Tu Comisión</th>
                        <th className="pb-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {sesiones.map((s) => (
                        <tr
                          key={s.id}
                          className="hover:bg-white/[0.02] transition-colors"
                        >
                          <td className="py-3 pr-4 text-zinc-400 whitespace-nowrap">
                            {s.fecha_formateada}{" "}
                            <span className="text-zinc-600">
                              {s.hora_formateada}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-white font-medium flex items-center gap-2">
                            <User size={14} className="text-zinc-600" />{" "}
                            {s.cliente}
                          </td>
                          <td className="py-3 pr-4 text-center text-zinc-400 font-mono text-xs">
                            {s.duracion_minutos} min
                          </td>
                          <td className="py-3 pr-4 text-right text-zinc-400 font-mono">
                            ${s.valor_cobrado?.toLocaleString()}
                          </td>
                          <td className="py-3 pr-4 text-right text-green-400 font-mono font-bold">
                            ${s.monto_entrenador?.toLocaleString()}
                          </td>
                          <td className="py-3 text-center">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                                s.estado === "realizada"
                                  ? "bg-green-500/10 text-green-400"
                                  : s.estado === "cancelada"
                                    ? "bg-red-500/10 text-red-400"
                                    : "bg-orange-500/10 text-orange-400"
                              }`}
                            >
                              {s.estado === "realizada" ? (
                                <CheckCircle2 size={12} />
                              ) : (
                                <AlertCircle size={12} />
                              )}
                              {s.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* GRÁFICO DE EVOLUCIÓN MENSUAL */}
          <div className="col-span-12 xl:col-span-5">
            <div className="bg-white/[0.01] border border-white/[0.03] rounded-[3rem] p-8 backdrop-blur-xl shadow-2xl overflow-hidden h-full">
              <h3 className="text-xs font-black uppercase tracking-[0.25em] text-zinc-500 mb-6">
                Evolución de Ganancias (6 meses)
              </h3>

              {historico && historico.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={historico}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#222"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="nombre_mes"
                      stroke="#555"
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      stroke="#555"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(value) => [
                        `$${value.toLocaleString()}`,
                        "Ganancia",
                      ]}
                      contentStyle={{
                        backgroundColor: "#111",
                        border: "1px solid #333",
                        borderRadius: "12px",
                      }}
                      labelStyle={{ color: "#999" }}
                    />
                    <Bar
                      dataKey="ganancia"
                      fill="#F97316"
                      radius={[8, 8, 0, 0]}
                      barSize={36}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-[320px] text-zinc-600">
                  <TrendingUp size={40} className="mb-4 opacity-20" />
                  <p className="text-sm">Aún no hay datos históricos.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// === COMPONENTE AUXILIAR: TARJETA KPI ===
function KpiCard({ title, value, subtitle, icon, color, highlight }) {
  const colorMap = {
    green: {
      bg: "from-green-500/10 to-green-500/5",
      border: "border-green-500/20",
      text: "text-green-400",
      icon: "bg-green-500/20 text-green-400",
    },
    blue: {
      bg: "from-blue-500/10 to-blue-500/5",
      border: "border-blue-500/20",
      text: "text-blue-400",
      icon: "bg-blue-500/20 text-blue-400",
    },
    orange: {
      bg: "from-orange-500/10 to-orange-500/5",
      border: "border-orange-500/20",
      text: "text-orange-400",
      icon: "bg-orange-500/20 text-orange-400",
    },
  };

  const c = colorMap[color] || colorMap.green;

  return (
    <div
      className={`relative bg-gradient-to-br ${c.bg} border ${c.border} rounded-3xl p-6 overflow-hidden transition-all hover:scale-[1.02] ${highlight ? "ring-1 ring-orange-500/30 shadow-[0_0_30px_rgba(249,115,22,0.1)]" : ""}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-1">
            {title}
          </p>
          <p className={`text-3xl font-black ${c.text}`}>{value}</p>
        </div>
        <div
          className={`w-10 h-10 rounded-xl ${c.icon} flex items-center justify-center`}
        >
          {icon}
        </div>
      </div>
      <p className="text-xs text-zinc-500 font-medium">{subtitle}</p>
    </div>
  );
}
