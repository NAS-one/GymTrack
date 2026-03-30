import { useState, useEffect } from 'react';
import {
    X, Briefcase, Calendar, DollarSign, Clock,
    TrendingUp, Phone, MapPin, AlertCircle
} from 'lucide-react';
import axios from '../../../api/axios';
import {
    BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

export function StaffDetailModal({ isOpen, onClose, staffId }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && staffId) {
            fetchStats();
        } else {
            // Limpiar al cerrar
            setData(null);
            setError(null);
        }
    }, [isOpen, staffId]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await axios.get(`/staff/${staffId}/stats`);

            // 1. Normalización de respuesta (evitar body.body)
            let cleanData = res.data.body || res.data;
            if (cleanData.body) cleanData = cleanData.body;

            // 2. Validación mínima
            if (!cleanData || !cleanData.perfil) {
                throw new Error("La ficha del colaborador está incompleta.");
            }

            setData(cleanData);
        } catch (err) {
            console.error("Error modal staff:", err);
            setError("No se pudo cargar la información. Verifica la conexión.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // --- RENDERIZADO CONDICIONAL ---

    // 1. Cargando
    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gym-orange"></div>
            </div>
        );
    }

    // 2. Error
    if (error) {
        return (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-gym-card border border-red-500/30 p-6 rounded-2xl text-center max-w-sm shadow-2xl">
                    <AlertCircle className="mx-auto text-red-500 mb-2" size={32} />
                    <p className="text-white mb-4 font-medium">{error}</p>
                    <button onClick={onClose} className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded text-white transition-colors">
                        Cerrar
                    </button>
                </div>
            </div>
        );
    }

    // 3. Datos (Uso de Optional Chaining ?. para seguridad total)
    const { perfil, historial, kpis } = data || {};

    const getRoleColor = (role) => {
        const r = (role || "").toLowerCase();
        if (r.includes('recep')) return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
        if (r.includes('aseo')) return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
        return 'text-gym-orange bg-gym-orange/10 border-gym-orange/20';
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-gym-card border border-white/10 w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">

                {/* === SIDEBAR PERFIL === */}
                <div className="w-full md:w-1/3 bg-black/20 border-r border-white/5 p-6 flex flex-col relative">
                    <button onClick={onClose} className="absolute top-4 left-4 md:hidden text-white"><X /></button>

                    <div className="flex flex-col items-center text-center mt-4 md:mt-0">
                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center text-3xl font-bold text-white shadow-xl mb-4">
                            {perfil?.nombre?.charAt(0) || '?'}
                        </div>

                        {/* Nombre y Cargo */}
                        <h2 className="text-xl font-bold text-white leading-tight">{perfil?.nombre || 'Sin Nombre'}</h2>
                        <span className={`mt-2 px-3 py-1 rounded-full text-xs font-bold border ${getRoleColor(perfil?.cargo)}`}>
                            {perfil?.cargo || 'Staff'}
                        </span>

                        {/* Detalles Clave */}
                        <div className="mt-6 w-full space-y-4">
                            <InfoRow icon={<Clock size={16} />} label="Turno" value={perfil?.turno} />
                            <InfoRow
                                icon={<DollarSign size={16} />}
                                label="Sueldo Base"
                                value={`$${Number(perfil?.sueldo_base || 0).toLocaleString()}`}
                                highlight
                            />
                            <InfoRow icon={<Calendar size={16} />} label="Antigüedad" value={`${kpis?.antiguedad_dias || 0} días`} />

                            <hr className="border-white/5 my-2" />

                            <div className="text-left space-y-2">
                                <p className="text-xs text-zinc-500 uppercase font-bold">Contacto</p>
                                <div className="flex items-center gap-2 text-sm text-zinc-300">
                                    <Phone size={14} className="text-gym-orange min-w-[14px]" />
                                    <span className="truncate">{perfil?.telefono || '--'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-zinc-300">
                                    <MapPin size={14} className="text-gym-orange min-w-[14px]" />
                                    <span className="truncate">{perfil?.direccion || 'Sin dirección'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* === DASHBOARD === */}
                <div className="flex-1 bg-gym-dark flex flex-col min-w-0">

                    {/* Toolbar */}
                    <div className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-white/[0.02] shrink-0">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <TrendingUp size={20} className="text-green-500" /> Rendimiento & Costos
                        </h3>
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">

                        {/* KPIs */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <KpiCard title="Costo Anual Proy." value={`$${((kpis?.costo_anual_proyectado || 0) / 1000000).toFixed(1)}M`} sub="CLP" color="blue" />
                            <KpiCard title="Asistencias Mes" value={kpis?.asistencia_promedio || 0} sub="Días trabajados" color="green" />
                            <KpiCard title="Evaluación" value="4.8" sub="/ 5.0" color="purple" />
                        </div>

                        {/* GRÁFICO 1: Historial Salarial */}
                        <div className="bg-black/20 border border-white/5 rounded-xl p-5">
                            <h4 className="text-sm font-bold text-zinc-400 mb-4 flex items-center gap-2">
                                <DollarSign size={16} /> Historial de Pagos
                            </h4>
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={historial || []}>
                                        <defs>
                                            <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                        <XAxis dataKey="mes" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', color: '#fff' }}
                                            formatter={(val) => [`$${val.toLocaleString()}`, 'Sueldo']}
                                        />
                                        <Area type="monotone" dataKey="costo_empresa" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCost)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* GRÁFICO 2: Asistencia Real */}
                        <div className="bg-black/20 border border-white/5 rounded-xl p-5">
                            <h4 className="text-sm font-bold text-zinc-400 mb-4 flex items-center gap-2">
                                <Briefcase size={16} /> Asistencia Real (Días)
                            </h4>
                            <div className="h-48 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={historial || []}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                        <XAxis dataKey="mes" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                            contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', color: '#fff' }}
                                            formatter={(val) => [val + ' días', 'Asistencia']}
                                        />
                                        <Bar dataKey="tareas_completadas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-[10px] text-zinc-500 mt-2">* Basado en registros de entrada biométricos/QR.</p>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

// --- MICRO COMPONENTES ---

function InfoRow({ icon, label, value, highlight }) {
    return (
        <div className="flex items-center justify-between p-2 rounded-lg bg-white/5">
            <div className="flex items-center gap-2 text-zinc-400 text-sm">
                {icon} <span>{label}</span>
            </div>
            <span className={`font-bold text-sm ${highlight ? 'text-green-400' : 'text-white'}`}>
                {value || '--'}
            </span>
        </div>
    );
}

function KpiCard({ title, value, sub, color }) {
    const colors = {
        blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        green: 'bg-green-500/10 text-green-400 border-green-500/20',
        purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    };

    return (
        <div className={`p-4 rounded-xl border ${colors[color]} flex flex-col items-center justify-center text-center`}>
            <span className="text-xs uppercase font-bold opacity-70 mb-1">{title}</span>
            <span className="text-xl font-bold text-white leading-none">{value}</span>
            <span className="text-[10px] opacity-60 mt-1">{sub}</span>
        </div>
    );
}