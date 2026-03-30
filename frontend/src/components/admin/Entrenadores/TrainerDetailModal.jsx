import { useState, useEffect, useMemo } from 'react';
import {
    X, DollarSign, Users, Briefcase, TrendingUp,
    Calendar, ArrowRightLeft, Percent, Search, Filter, Clock, ArrowUpDown, ShieldCheck
} from 'lucide-react';
import axios from '../../../api/axios';
import {
    ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area
} from 'recharts';

export function TrainerDetailModal({ isOpen, onClose, trainerId, allTrainers = [], onUpdate }) {
    const [activeTab, setActiveTab] = useState('overview');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- FILTROS DE CLIENTES ---
    const [clientSearch, setClientSearch] = useState("");
    const [clientStatus, setClientStatus] = useState("all"); // 'all', 'active', 'expiring', 'expired'
    const [clientSort, setClientSort] = useState("name"); // 'name', 'date'

    // Estado Admin
    const [targetTrainer, setTargetTrainer] = useState("");
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (isOpen && trainerId) fetchData();
        else { setData(null); setLoading(true); }
    }, [isOpen, trainerId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`/entrenadores/${trainerId}/stats`);
            setData(res.data.body);
        } catch (error) {
            setError("Error cargando datos.");
        } finally {
            setLoading(false);
        }
    };

    const getDaysLeft = (dateStr) => {
        if (!dateStr) return -999;
        const diff = new Date(dateStr) - new Date();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const getTenure = (dateStr) => {
        if (!dateStr) return "N/A";
        const days = Math.ceil(Math.abs(new Date() - new Date(dateStr)) / (86400000));
        if (days < 30) return `${days} días`;
        if (days < 365) return `${Math.floor(days / 30)} meses`;
        return `${(days / 365).toFixed(1)} años`;
    };

    // --- LÓGICA DE DATOS ---
    const stats = useMemo(() => {
        if (!data) return { activeClients: 0, expiredClients: 0 };
        const { clientes } = data;
        const active = clientes?.filter(c => getDaysLeft(c.fecha_fin) >= 0).length || 0;
        return { activeClients: active, expiredClients: (clientes?.length || 0) - active };
    }, [data]);

    // --- FILTRADO AVANZADO DE CLIENTES ---
    const processedClients = useMemo(() => {
        if (!data?.clientes) return [];
        let result = data.clientes.filter(c =>
            c.nombre.toLowerCase().includes(clientSearch.toLowerCase()) ||
            c.rut.includes(clientSearch)
        );

        // Filtro Estado
        if (clientStatus !== 'all') {
            result = result.filter(c => {
                const days = getDaysLeft(c.fecha_fin);
                if (clientStatus === 'active') return days >= 7;
                if (clientStatus === 'expiring') return days >= 0 && days < 7;
                if (clientStatus === 'expired') return days < 0;
                return true;
            });
        }

        // Ordenamiento
        result.sort((a, b) => {
            if (clientSort === 'name') return a.nombre.localeCompare(b.nombre);
            if (clientSort === 'date') return getDaysLeft(a.fecha_fin) - getDaysLeft(b.fecha_fin);
            return 0;
        });

        return result;
    }, [data, clientSearch, clientStatus, clientSort]);

    const handleReassign = async () => {
        if (!targetTrainer) return alert("Selecciona destino");
        if (!window.confirm(`¿Confirmar migración masiva?`)) return;
        setProcessing(true);
        try {
            await axios.post('/entrenadores/reasignar', { oldTrainerId: trainerId, newTrainerId: targetTrainer });
            fetchData(); onUpdate(); alert("Hecho");
        } catch (e) { alert("Error"); } finally { setProcessing(false); }
    };

    if (!isOpen) return null;
    if (loading) return <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"><div className="text-white animate-pulse">Cargando...</div></div>;
    if (!data) return null;

    const { perfil, historial } = data;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-gym-card border border-white/10 w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">

                {/* === SIDEBAR === */}
                <div className="w-full md:w-1/3 bg-black/20 border-r border-white/5 p-6 flex flex-col">
                    <div className="flex flex-col items-center text-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-900 border border-white/10 flex items-center justify-center text-2xl font-bold text-white shadow-lg mb-3">
                            {perfil.nombre?.charAt(0)}
                        </div>
                        <h2 className="text-lg font-bold text-white leading-tight">{perfil.nombre}</h2>
                        <div className="flex items-center gap-2 mt-1 mb-4">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-white/10 text-zinc-300 uppercase font-bold border border-white/10">
                                {perfil.modelo_contrato?.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                                <Clock size={10} /> {getTenure(perfil.created_at)}
                            </span>
                        </div>
                    </div>

                    {/* Requerimiento 1: Badge de Porcentaje / Modelo */}
                    <div className="mb-6">
                        {perfil.modelo_contrato === 'porcentaje' ? (
                            <div className="bg-purple-500/10 border border-purple-500/20 p-3 rounded-xl">
                                <p className="text-xs text-purple-300 font-bold uppercase mb-1 flex items-center gap-1"><Percent size={12} /> Esquema Comisión</p>
                                <div className="flex justify-between text-sm">
                                    <span className="text-white">Entrenador: <b className="text-purple-400">{((1 - Number(perfil.porcentaje_retencion)) * 100).toFixed(0)}%</b></span>
                                    <span className="text-zinc-500">Gym: {Number(perfil.porcentaje_retencion) * 100}%</span>
                                </div>
                            </div>
                        ) : perfil.modelo_contrato === 'arriendo_espacio' ? (
                            <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-xl text-center">
                                <p className="text-xs text-green-300 font-bold uppercase mb-1">Arriendo Fijo</p>
                                <p className="text-xl font-bold text-white">${Number(perfil.tarifa_arriendo).toLocaleString()}</p>
                            </div>
                        ) : (
                            <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl text-center">
                                <p className="text-xs text-blue-300 font-bold uppercase mb-1">Sueldo Base</p>
                                <p className="text-xl font-bold text-white">${Number(perfil.sueldo_base).toLocaleString()}</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2 flex-1">
                        <div className="grid grid-cols-2 gap-2">
                            <StatBox label="Activos" value={stats.activeClients} color="green" />
                            <StatBox label="Vencidos" value={stats.expiredClients} color="red" />
                        </div>
                        <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex justify-between items-center mt-2">
                            <span className="text-xs text-zinc-400">Total Histórico</span>
                            <span className="text-sm font-bold text-white">{data.clientes?.length || 0}</span>
                        </div>
                    </div>
                </div>

                {/* === MAIN CONTENT === */}
                <div className="flex-1 flex flex-col bg-gym-dark min-w-0">

                    <div className="flex border-b border-white/5 bg-black/10 px-2">
                        <TabBtn active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="Rentabilidad" icon={<TrendingUp size={16} />} />
                        <TabBtn active={activeTab === 'clients'} onClick={() => setActiveTab('clients')} label="Cartera" icon={<Users size={16} />} />
                        <TabBtn active={activeTab === 'admin'} onClick={() => setActiveTab('admin')} label="Admin" icon={<ShieldCheck size={16} />} />
                        <button onClick={onClose} className="p-4 text-gym-gray hover:text-white ml-auto"><X size={20} /></button>
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">

                        {/* --- VISTA 1: RENTABILIDAD PRO --- */}
                        {activeTab === 'overview' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex justify-between items-end">
                                    <h3 className="text-lg font-bold text-white">Rendimiento (6 Meses)</h3>
                                    <div className="flex gap-4 text-xs">
                                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500 rounded-sm"></div> Ingreso Bruto (Ventas)</div>
                                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-full"></div> Costo (Pago al Entrenador)</div>
                                    </div>
                                </div>

                                {/* GRÁFICO PROFESIONAL COMPOSED */}
                                <div className="bg-black/20 p-4 rounded-xl border border-white/5 h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={historial} margin={{ top: 20, right: 20, bottom: 0, left: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                                            <XAxis dataKey="nombre_mes" stroke="#71717A" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                            <YAxis stroke="#71717A" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                contentStyle={{ backgroundColor: '#09090b', border: '1px solid #333', borderRadius: '8px' }}
                                                formatter={(val, name) => [
                                                    `$${val.toLocaleString()}`,
                                                    name === 'ingreso_generado' ? 'Ventas Generadas' : 'Pago a Entrenador'
                                                ]}
                                            />
                                            <Bar dataKey="ingreso_generado" fill="#10B981" barSize={30} radius={[4, 4, 0, 0]} />
                                            <Line type="monotone" dataKey="costo_entrenador" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6' }} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>

                                <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-sm text-zinc-400">
                                    <p>
                                        * Este gráfico muestra el dinero recaudado por los alumnos asignados a este entrenador (Barras Verdes)
                                        vs el costo salarial o de comisiones pagado al entrenador (Línea Azul).
                                        <span className="text-white font-bold ml-1">La diferencia es el Margen del Gimnasio.</span>
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* --- VISTA 2: GESTIÓN CLIENTES (Filtros Pro) --- */}
                        {activeTab === 'clients' && (
                            <div className="animate-in fade-in slide-in-from-bottom-2 h-full flex flex-col">

                                {/* Filtros Superiores */}
                                <div className="flex flex-col gap-3 mb-4">
                                    <div className="relative">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gym-gray" />
                                        <input
                                            type="text" placeholder="Buscar por nombre o rut..."
                                            className="w-full bg-black/20 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white outline-none focus:border-gym-orange transition-colors"
                                            value={clientSearch} onChange={e => setClientSearch(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <div className="flex gap-2">
                                            <FilterPill label="Todos" active={clientStatus === 'all'} onClick={() => setClientStatus('all')} />
                                            <FilterPill label="Activos" active={clientStatus === 'active'} onClick={() => setClientStatus('active')} color="green" />
                                            <FilterPill label="Por Vencer" active={clientStatus === 'expiring'} onClick={() => setClientStatus('expiring')} color="yellow" />
                                            <FilterPill label="Vencidos" active={clientStatus === 'expired'} onClick={() => setClientStatus('expired')} color="red" />
                                        </div>
                                        <button
                                            onClick={() => setClientSort(clientSort === 'name' ? 'date' : 'name')}
                                            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
                                        >
                                            <ArrowUpDown size={12} /> Ordenar por {clientSort === 'name' ? 'Nombre' : 'Vencimiento'}
                                        </button>
                                    </div>
                                </div>

                                {/* Tabla con Scroll */}
                                <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden flex-1 relative">
                                    <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-white/5 text-gym-gray uppercase text-xs font-bold sticky top-0 z-10 backdrop-blur-md">
                                                <tr><th className="p-4">Alumno</th><th className="p-4 text-center">Estado</th><th className="p-4 text-right">Vencimiento</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {processedClients.map(c => {
                                                    const days = getDaysLeft(c.fecha_fin);
                                                    let badgeColor = days < 0 ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                                        : days < 7 ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                                            : 'bg-green-500/10 text-green-400 border-green-500/20';

                                                    return (
                                                        <tr key={c.id} className="hover:bg-white/5">
                                                            <td className="p-4">
                                                                <div className="font-bold text-white">{c.nombre}</div>
                                                                <div className="text-[10px] text-zinc-500">{c.tipo_plan}</div>
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
                                                                    {days < 0 ? 'VENCIDO' : `${days} DÍAS`}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-right text-zinc-400 font-mono text-xs">
                                                                {c.fecha_fin ? new Date(c.fecha_fin).toLocaleDateString() : '--'}
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                        {processedClients.length === 0 && <p className="text-center text-zinc-500 py-10 text-sm">Sin resultados.</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* --- VISTA 3: ADMIN --- */}
                        {activeTab === 'admin' && (
                            <div className="animate-in fade-in slide-in-from-bottom-2">
                                <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
                                    <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                        <ArrowRightLeft size={16} className="text-gym-orange" /> Reasignación de Cartera
                                    </h3>
                                    <p className="text-xs text-zinc-400 mb-4">
                                        Transfiere los <b>{processedClients.length} clientes</b> visibles a otro entrenador.
                                    </p>
                                    <div className="flex gap-2">
                                        <select className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none" value={targetTrainer} onChange={e => setTargetTrainer(e.target.value)}>
                                            <option value="">-- Seleccionar Destino --</option>
                                            {allTrainers.filter(t => t.id !== trainerId).map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                                        </select>
                                        <button onClick={handleReassign} disabled={processing} className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2 rounded-lg text-sm border border-white/5">
                                            {processing ? '...' : 'Migrar'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- MICRO COMPONENTES ---
function TabBtn({ active, onClick, label, icon }) {
    return <button onClick={onClick} className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${active ? 'text-gym-orange border-gym-orange bg-white/5' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}>{icon} {label}</button>;
}

function StatBox({ label, value, color }) {
    const colors = {
        green: 'bg-green-500/10 text-green-400 border-green-500/20',
        red: 'bg-red-500/10 text-red-400 border-red-500/20'
    };
    return (
        <div className={`p-2 rounded-lg border text-center ${colors[color]}`}>
            <p className="text-[10px] uppercase font-bold opacity-80">{label}</p>
            <p className="text-lg font-bold">{value}</p>
        </div>
    );
}

function FilterPill({ label, active, onClick, color = "blue" }) {
    const activeClass = active
        ? `bg-${color}-500/20 text-${color}-400 border-${color}-500/30`
        : 'bg-white/5 text-zinc-500 border-transparent hover:text-white';

    return (
        <button onClick={onClick} className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${activeClass}`}>
            {label}
        </button>
    );
}