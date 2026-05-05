import React, { useState, useEffect } from 'react';
import {
    TrendingUp, Activity, Calendar, Clock, Award, ChevronRight,
    Scale, Ruler, Percent, Target, Dumbbell
} from 'lucide-react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
import axios from '../../api/axios';

export const Progreso = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [historial, setHistorial] = useState([]);
    const [weightData, setWeightData] = useState([]);
    const [attendanceData, setAttendanceData] = useState([]);
    const [planVigente, setPlanVigente] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            const userId = user?.id || user?.id_usuario;
            if (!userId) return;

            try {
                const [progressRes, statsRes, membresiasRes] = await Promise.all([
                    axios.get(`/progresos/cliente/${userId}`),
                    axios.get(`/clientes/${userId}/stats`),
                    axios.get(`/membresias/cliente/${userId}`),
                ]);

                setHistorial(progressRes.data.body || []);

                let stats = statsRes.data.body || statsRes.data || {};
                if (stats.body) {
                    stats = stats.body;
                }
                const medidas = stats.medidas || [];
                const asistencia = stats.asistencia || [];

                const formattedWeight = medidas.map((m) => ({
                    fecha: new Date(m.fecha_registro).toLocaleDateString('es-CL', {
                        month: 'short',
                        day: 'numeric',
                    }),
                    peso: parseFloat(m.peso) || 0,
                    grasa: parseFloat(m.porcentaje_grasa) || 0,
                    altura: parseFloat(m.altura) || 0,
                    cintura: parseFloat(m.circunferencia_cintura) || 0,
                }));

                setWeightData(formattedWeight);

                const visitsByMonth = asistencia.reduce((acc, curr) => {
                    const dateObj = new Date(curr.fecha_entrada);
                    const month = dateObj.toLocaleDateString('es-CL', { month: 'short' });
                    acc[month] = (acc[month] || 0) + 1;
                    return acc;
                }, {});

                const formattedAttendance = Object.keys(visitsByMonth).map((mes) => ({
                    mes,
                    visitas: visitsByMonth[mes],
                }));

                setAttendanceData(formattedAttendance);

                const memberships = membresiasRes.data.body || [];
                const activePlan = memberships.find((m) => m.estado === 'active' || m.estado === 'activa');
                if (activePlan) {
                    setPlanVigente({
                        nombre: activePlan.plan_nombre || activePlan.tipo_plan || 'Plan Activo',
                        estado: activePlan.estado,
                        vencimiento: activePlan.fecha_fin,
                    });
                } else if (memberships.length > 0) {
                    setPlanVigente({
                        nombre: memberships[0].plan_nombre || memberships[0].tipo_plan || 'Plan',
                        estado: memberships[0].estado || 'inactivo',
                        vencimiento: memberships[0].fecha_fin,
                    });
                } else {
                    setPlanVigente(null);
                }
            } catch (error) {
                console.error("Error al obtener el progreso, stats o plan:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user?.id, user?.id_usuario]);

    // Obtener última medida para las cards resumen
    const lastMeasure = weightData.length > 0 ? weightData[weightData.length - 1] : null;

    // Calcular deltas respecto a la primera medición
    const firstMeasure = weightData.length > 1 ? weightData[0] : null;
    const getDelta = (key) => {
        if (!lastMeasure || !firstMeasure || !lastMeasure[key] || !firstMeasure[key]) return null;
        return (lastMeasure[key] - firstMeasure[key]).toFixed(1);
    };

    const totalAsistencias = attendanceData.reduce((sum, d) => sum + d.visitas, 0);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gym-orange"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-12 h-full w-full">
            {/* HEADER */}
            <div className="mt-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">Mi Progreso</h1>
                <p className="text-gray-400 text-sm mt-1">Sigue tu evolución física, asistencia y alcanza tus metas.</p>
            </div>

            {/* CARDS: Últimas Medidas Registradas */}
            <div>
                <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2 px-1">
                    <Scale size={16} className="text-gym-orange" /> Últimas Medidas Registradas
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <MeasureCard
                        label="Peso"
                        value={lastMeasure?.peso}
                        unit="kg"
                        delta={getDelta('peso')}
                        deltaUnit="kg"
                        icon={<Scale size={18} className="text-blue-400" />}
                        color="blue"
                    />
                    <MeasureCard
                        label="Estatura"
                        value={lastMeasure?.altura}
                        unit="m"
                        icon={<Ruler size={18} className="text-emerald-400" />}
                        color="emerald"
                    />
                    <MeasureCard
                        label="% Grasa"
                        value={lastMeasure?.grasa}
                        unit="%"
                        delta={getDelta('grasa')}
                        deltaUnit="%"
                        icon={<Percent size={18} className="text-orange-400" />}
                        color="orange"
                        invertDelta
                    />
                    <MeasureCard
                        label="Cintura"
                        value={lastMeasure?.cintura}
                        unit="cm"
                        delta={getDelta('cintura')}
                        deltaUnit="cm"
                        icon={<Ruler size={18} className="text-purple-400" />}
                        color="purple"
                        invertDelta
                    />
                </div>
            </div>

            {/* RESUMEN RÁPIDO: Métricas */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                    <div className="bg-emerald-500/10 p-2.5 rounded-xl">
                        <Calendar size={20} className="text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Asistencias</p>
                        <p className="text-xl font-black text-white">{totalAsistencias}</p>
                        <p className="text-[10px] text-zinc-500">Últimos 6 meses</p>
                    </div>
                </div>
                <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
                    <div className="bg-blue-500/10 p-2.5 rounded-xl">
                        <Dumbbell size={20} className="text-blue-400" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Evaluaciones</p>
                        <p className="text-xl font-black text-white">{historial.length}</p>
                        <p className="text-[10px] text-zinc-500">Registros totales</p>
                    </div>
                </div>
            </div>

            {/* GRÁFICOS EN GRID 2x2 (Igual que el entrenador) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Gráfico Peso */}
                <div className="bg-black/20 p-4 rounded-xl border border-white/5 h-56">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-bold text-white flex items-center gap-1.5">
                            <TrendingUp size={14} className="text-blue-400" /> Evolución de Peso
                        </p>
                        {weightData.length > 0 && (
                            <span className="text-[10px] text-green-400 font-bold">
                                {weightData[weightData.length - 1].peso}kg
                            </span>
                        )}
                    </div>
                    {weightData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="85%">
                            <AreaChart data={weightData}>
                                <defs>
                                    <linearGradient id="colorPesoC" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="fecha" stroke="#666" tick={{ fontSize: 9 }} />
                                <YAxis domain={["dataMin - 2", "dataMax + 2"]} stroke="#666" tick={{ fontSize: 9 }} width={35} />
                                <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px", fontSize: "12px" }} />
                                <Area type="monotone" dataKey="peso" stroke="#3B82F6" fillOpacity={1} fill="url(#colorPesoC)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gym-gray text-xs">
                            <Activity size={28} className="mb-2 opacity-20" />
                            Sin registros de peso
                        </div>
                    )}
                </div>

                {/* Gráfico Asistencia */}
                <div className="bg-black/20 p-4 rounded-xl border border-white/5 h-56">
                    <p className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                        <Calendar size={14} className="text-gym-orange" /> Asistencias por Mes
                    </p>
                    {attendanceData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="85%">
                            <BarChart data={attendanceData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="mes" stroke="#666" tick={{ fontSize: 9 }} />
                                <Tooltip
                                    cursor={{ fill: "transparent" }}
                                    contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", fontSize: "12px" }}
                                />
                                <Bar dataKey="visitas" fill="#F97316" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gym-gray text-xs">
                            <Clock size={28} className="mb-2 opacity-20" />
                            Sin asistencias recientes
                        </div>
                    )}
                </div>

                {/* Gráfico % Grasa */}
                <div className="bg-black/20 p-4 rounded-xl border border-white/5 h-56">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Percent size={14} className="text-orange-400" /> % Grasa Corporal
                        </p>
                        {weightData.length > 0 && weightData[weightData.length - 1].grasa && (
                            <span className="text-[10px] text-orange-400 font-bold">
                                {weightData[weightData.length - 1].grasa}%
                            </span>
                        )}
                    </div>
                    {weightData.some((d) => d.grasa) ? (
                        <ResponsiveContainer width="100%" height="85%">
                            <AreaChart data={weightData}>
                                <defs>
                                    <linearGradient id="colorGrasaC" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#F97316" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="fecha" stroke="#666" tick={{ fontSize: 9 }} />
                                <YAxis domain={["dataMin - 1", "dataMax + 1"]} stroke="#666" tick={{ fontSize: 9 }} width={35} />
                                <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px", fontSize: "12px" }} />
                                <Area type="monotone" dataKey="grasa" stroke="#F97316" fillOpacity={1} fill="url(#colorGrasaC)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gym-gray text-xs">
                            <Percent size={28} className="mb-2 opacity-20" />
                            Sin registros de grasa
                        </div>
                    )}
                </div>

                {/* Gráfico Cintura */}
                <div className="bg-black/20 p-4 rounded-xl border border-white/5 h-56">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Ruler size={14} className="text-purple-400" /> Cintura
                        </p>
                        {weightData.length > 0 && weightData[weightData.length - 1].cintura && (
                            <span className="text-[10px] text-purple-400 font-bold">
                                {weightData[weightData.length - 1].cintura}cm
                            </span>
                        )}
                    </div>
                    {weightData.some((d) => d.cintura) ? (
                        <ResponsiveContainer width="100%" height="85%">
                            <AreaChart data={weightData}>
                                <defs>
                                    <linearGradient id="colorCinturaC" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="fecha" stroke="#666" tick={{ fontSize: 9 }} />
                                <YAxis domain={["dataMin - 5", "dataMax + 5"]} stroke="#666" tick={{ fontSize: 9 }} width={35} />
                                <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", borderRadius: "8px", fontSize: "12px" }} />
                                <Area type="monotone" dataKey="cintura" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorCinturaC)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gym-gray text-xs">
                            <Ruler size={28} className="mb-2 opacity-20" />
                            Sin registros de cintura
                        </div>
                    )}
                </div>
            </div>

            {/* CARD: Plan Vigente */}
            <div className="bg-[#121212] border border-white/5 rounded-3xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gym-orange/10 to-transparent pointer-events-none"></div>
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <p className="text-sm uppercase tracking-[0.35em] text-gym-orange font-semibold">Mi Plan</p>
                        <h2 className="text-2xl font-black text-white mt-2">
                            {planVigente ? planVigente.nombre : 'No tienes un plan activo'}
                        </h2>
                        <p className="text-gray-400 mt-2 text-sm max-w-2xl">
                            {planVigente
                                ? `Estado: ${planVigente.estado} • Vencimiento: ${planVigente.vencimiento ? new Date(planVigente.vencimiento).toLocaleDateString() : 'Sin fecha'}.`
                                : 'Contrata un plan para recibir tu rutina completa, seguimiento y beneficios exclusivos.'}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => navigate('/planes')}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-gym-orange px-5 py-3 text-sm font-bold text-black transition hover:bg-orange-400"
                    >
                        {planVigente ? 'Ver planes' : 'Contratar plan'}
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* CARD MOTIVACIONAL */}
            {weightData.length > 1 && (
                <div className="bg-gradient-to-tr from-gym-orange/20 to-zinc-900 border border-gym-orange/30 rounded-3xl p-6 relative overflow-hidden">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 relative z-10">
                        <Award size={20} className="text-gym-orange" />
                        ¡Sigue así!
                    </h3>
                    <p className="text-sm text-gray-300 mt-2 relative z-10">
                        {getDelta('grasa') && parseFloat(getDelta('grasa')) < 0
                            ? `Has reducido tu porcentaje de grasa en ${Math.abs(parseFloat(getDelta('grasa')))}% desde tu primer registro. ¡Gran trabajo!`
                            : `Llevas ${weightData.length} mediciones registradas. La constancia es la clave del éxito.`}
                    </p>
                    <Award size={100} className="absolute -right-6 -bottom-6 text-gym-orange/10 transform rotate-12" />
                </div>
            )}

            {/* HISTORIAL DE EVALUACIONES (Timeline) */}
            <div className="mt-2">
                <h3 className="text-lg font-bold text-white mb-4 px-1 flex items-center gap-2">
                    <Activity size={20} className="text-emerald-400" />
                    Historial de Evaluaciones
                </h3>
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                    {historial.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                            <Target size={40} className="mb-3 opacity-20" />
                            <p className="text-sm font-medium">Aún no hay registros de progreso.</p>
                            <p className="text-xs text-zinc-600 mt-1">Tus evaluaciones aparecerán aquí a medida que entrenes.</p>
                        </div>
                    ) : historial.slice(0, 15).map((item, index) => (
                        <div key={item.id || index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-zinc-900 text-emerald-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-zinc-800/80 p-4 rounded-xl border border-white/5">
                                <span className="font-bold text-emerald-400 text-xs">{item.fecha ? new Date(item.fecha).toLocaleDateString() : 'Fecha indefinida'}</span>
                                <p className="text-sm text-white mt-1 font-semibold">
                                    {item.nombre_ejercicio || item.ejercicio_nombre || item.rutina_nombre || 'Sesión de Entrenamiento'}
                                </p>
                                {item.grupo_muscular && (
                                    <span className="text-[10px] text-gym-orange font-bold uppercase tracking-wider">{item.grupo_muscular}</span>
                                )}
                                {(item.carga_real || item.reps_reales || item.series_reales) && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        {item.series_reales && `Series: ${item.series_reales} |`} {item.reps_reales && `Reps: ${item.reps_reales}`} {item.carga_real && `| Carga: ${item.carga_real}`}
                                        {item.rpe && <span className="text-yellow-400 ml-1">RPE {item.rpe}</span>}
                                    </p>
                                )}
                                {item.comentarios && (
                                    <p className="text-[11px] text-zinc-500 mt-1 italic">"{item.comentarios}"</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ========== COMPONENTE: Tarjeta de Medida ==========
function MeasureCard({ label, value, unit, delta, deltaUnit, icon, color, invertDelta = false }) {
    const colorMap = {
        blue: 'from-blue-500/10 to-blue-500/5 border-blue-500/10',
        emerald: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/10',
        orange: 'from-orange-500/10 to-orange-500/5 border-orange-500/10',
        purple: 'from-purple-500/10 to-purple-500/5 border-purple-500/10',
    };

    const isPositive = delta ? (invertDelta ? parseFloat(delta) < 0 : parseFloat(delta) > 0) : null;

    return (
        <div className={`bg-gradient-to-br ${colorMap[color]} border rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02]`}>
            <div className="mb-2 opacity-80">{icon}</div>
            <p className="text-[10px] text-gym-gray uppercase font-bold mb-1 tracking-wider">{label}</p>
            <p className="text-2xl font-black text-white">
                {value || '--'} <span className="text-xs font-normal text-zinc-500">{value ? unit : ''}</span>
            </p>
            {delta && (
                <span className={`text-[10px] font-bold mt-1 ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {parseFloat(delta) > 0 ? '+' : ''}{delta}{deltaUnit}
                </span>
            )}
        </div>
    );
}
