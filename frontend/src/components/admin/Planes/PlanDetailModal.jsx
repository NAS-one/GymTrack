import { useState, useEffect } from 'react';
import { X, TrendingUp, Users, DollarSign, AlertCircle } from 'lucide-react';
// Asegúrate de tener instalado recharts: npm install recharts
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from '../../../api/axios';

export function PlanDetailModal({ isOpen, onClose, plan }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && plan) {
      fetchStats();
    }
  }, [isOpen, plan]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      // Llama al endpoint que creamos en el backend
      const res = await axios.get(`/planes/${plan.id}/stats`);
      setData(res.data.body);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar las estadísticas.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !plan) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-gym-card border border-white/10 w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">

        {/* HEADER */}
        <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-black/20">
          <div>
            <h2 className="text-2xl font-bold text-white">{plan.nombre}</h2>
            <p className="text-gym-gray text-sm">Análisis de rendimiento y suscriptores</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-gym-gray hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {loading ? (
            <div className="h-full flex items-center justify-center text-gym-gray animate-pulse">Cargando métricas...</div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center text-red-400 gap-2">
              <AlertCircle size={32} />
              <p>{error}</p>
            </div>
          ) : (
            <div className="space-y-8 animate-fade-in">

              {/* 1. TARJETAS KPI */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KpiCard
                  label="Ingresos Históricos"
                  value={`$${parseInt(data.kpi.ingresos_totales || 0).toLocaleString()}`}
                  icon={<DollarSign className="text-green-400" size={20} />}
                  sub="Total acumulado"
                />
                <KpiCard
                  label="Usuarios Activos"
                  value={data.kpi.activos_ahora || 0}
                  icon={<Users className="text-blue-400" size={20} />}
                  sub={`De ${data.kpi.total_historico || 0} históricos`}
                />
                <KpiCard
                  label="Valor del Plan"
                  value={`$${parseInt(plan.precio).toLocaleString()}`}
                  icon={<TrendingUp className="text-orange-400" size={20} />}
                  sub={`${plan.duracion_meses} mes(es) de duración`}
                />
              </div>

              {/* 2. GRÁFICO DE INGRESOS (RECHARTS) */}
              <div className="bg-black/20 border border-white/5 rounded-2xl p-6 h-80">
                <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                  <TrendingUp size={16} className="text-gym-orange" /> Evolución de Ingresos (Últimos 6 meses)
                </h3>
                {data.grafico && data.grafico.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.grafico}>
                      <defs>
                        <linearGradient id="colorIngreso" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis dataKey="mes" stroke="#666" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#666" tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                      <Area type="monotone" dataKey="total" stroke="#10B981" fillOpacity={1} fill="url(#colorIngreso)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gym-gray text-sm italic">
                    No hay ingresos registrados en los últimos 6 meses.
                  </div>
                )}
              </div>

              {/* 3. LISTA DE CLIENTES ACTIVOS */}
              <div>
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Users size={16} className="text-gym-gray" /> Suscriptores Activos Recientes
                </h3>
                <div className="bg-black/20 border border-white/5 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-gym-gray uppercase text-xs font-bold">
                      <tr>
                        <th className="p-4">Cliente</th>
                        <th className="p-4">RUT</th>
                        <th className="p-4 hidden sm:table-cell">Inicio</th>
                        <th className="p-4 text-right">Vencimiento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {data.clientes && data.clientes.length > 0 ? data.clientes.map((c, i) => (
                        <tr key={i} className="hover:bg-white/5 transition-colors group">
                          <td className="p-4 text-white font-medium group-hover:text-gym-orange transition-colors">{c.nombre}</td>
                          <td className="p-4 text-gym-gray text-xs">{c.rut}</td>
                          <td className="p-4 text-gym-gray hidden sm:table-cell">{new Date(c.fecha_inicio).toLocaleDateString()}</td>
                          <td className="p-4 text-right text-orange-400 font-medium font-mono">
                            {new Date(c.fecha_fin).toLocaleDateString()}
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan="4" className="p-8 text-center text-gym-gray italic">No hay usuarios activos en este plan actualmente.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Micro-componente para las tarjetas de arriba
function KpiCard({ label, value, icon, sub }) {
  return (
    <div className="bg-black/20 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] text-gym-gray font-bold uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs text-gym-gray">{sub}</p>
    </div>
  )
}