import React, { useState, useEffect } from 'react';
import { TrendingUp, Activity, Calendar, Clock, Award, ChevronRight } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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

                const stats = statsRes.data.body || statsRes.data || {};
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

    const metrics = [
        { label: 'Rendimiento', valor: historial.length ? 'Activo' : 'Sin datos', diff: '+', icon: TrendingUp, positivo: true },
        { label: 'Sesiones', valor: historial.length.toString(), diff: 'Total', icon: Award, positivo: true }
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gym-orange"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-12 h-full w-full">
            <div className="mt-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">Mi Progreso</h1>
                <p className="text-gray-400 text-sm mt-1">Sigue tu evolución y alcanza tus metas.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {metrics.map((metric, i) => {
                    const Icon = metric.icon;
                    return (
                        <div key={i} className="bg-zinc-900 border border-white/5 rounded-2xl p-5 flex items-center justify-between shadow-lg">
                            <div className="flex items-center gap-4">
                                <div className="bg-white/5 p-3 rounded-xl">
                                    <Icon size={24} className="text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{metric.label}</p>
                                    <p className="text-2xl font-bold text-white mt-1">{metric.valor}</p>
                                </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-bold ${metric.positivo ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                {metric.diff}
                            </div>
                        </div>
                    );
                })}
            </div>

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

            <div className="space-y-8 animate-fade-in">
                <div className="bg-black/20 p-4 rounded-xl border border-white/5 h-64">
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm font-bold text-white flex items-center gap-2">
                            <TrendingUp size={16} className="text-blue-400" /> Evolución de Peso
                        </p>
                        {weightData.length > 0 && (
                            <span className="text-xs text-green-400 font-bold">
                                Último: {weightData[weightData.length - 1].peso}kg
                            </span>
                        )}
                    </div>
                    {weightData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={weightData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="fecha" stroke="#666" tick={{ fontSize: 10 }} />
                                <YAxis domain={["dataMin - 2", "dataMax + 2"]} stroke="#666" tick={{ fontSize: 10 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "#1a1a1a",
                                        border: "1px solid #333",
                                        borderRadius: "8px",
                                    }}
                                />
                                <Area type="monotone" dataKey="peso" stroke="#3B82F6" fillOpacity={1} fill="url(#colorPeso)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gym-gray text-sm">
                            <Activity size={32} className="mb-2 opacity-20" />
                            Sin registros de peso
                        </div>
                    )}
                </div>

                <div className="bg-black/20 p-4 rounded-xl border border-white/5 h-56">
                    <p className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                        <Calendar size={16} className="text-gym-orange" /> Asistencias por Mes
                    </p>
                    {attendanceData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={attendanceData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                <XAxis dataKey="mes" stroke="#666" tick={{ fontSize: 10 }} />
                                <Tooltip
                                    cursor={{ fill: "transparent" }}
                                    contentStyle={{
                                        backgroundColor: "#1a1a1a",
                                        border: "1px solid #333",
                                    }}
                                />
                                <Bar dataKey="visitas" fill="#F97316" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gym-gray text-sm">
                            <Clock size={32} className="mb-2 opacity-20" />
                            Sin asistencias recientes
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-gradient-to-tr from-gym-orange/20 to-zinc-900 border border-gym-orange/30 rounded-3xl p-6 mt-2 relative overflow-hidden">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 relative z-10">
                    <Award size={20} className="text-gym-orange" />
                    ¡Lo estás haciendo genial!
                </h3>
                <p className="text-sm text-gray-300 mt-2 relative z-10">Has reducido tu porcentaje de grasa un 2% en el último mes. Mantén la constancia.</p>
                <Award size={100} className="absolute -right-6 -bottom-6 text-gym-orange/10 transform rotate-12" />
            </div>

            <div className="mt-4">
                <h3 className="text-lg font-bold text-white mb-4 px-1">Historial de Evaluaciones</h3>
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
                    {historial.length === 0 ? (
                        <p className="text-gray-500 text-sm italic pl-12 text-center w-full">Aún no hay registros de progreso.</p>
                    ) : historial.map((item, index) => (
                        <div key={item.id || index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-zinc-900 text-emerald-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-zinc-800/80 p-4 rounded-xl border border-white/5">
                                <span className="font-bold text-emerald-400 text-xs">{item.fecha ? new Date(item.fecha).toLocaleDateString() : 'Fecha indefinida'}</span>
                                <p className="text-sm text-white mt-1 font-semibold">{item.ejercicio_nombre || item.rutina_nombre || 'Sesión de Entrenamiento'}</p>
                                {(item.carga_real || item.reps_reales) && (
                                    <p className="text-xs text-gray-400 mt-1">Carga: {item.carga_real || '0'} | Reps: {item.reps_reales || '0'}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
