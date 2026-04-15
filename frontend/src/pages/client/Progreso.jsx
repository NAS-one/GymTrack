import React, { useState, useEffect } from 'react';
import { TrendingUp, Scale, Ruler, Award } from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import axios from '../../api/axios';

export const Progreso = () => {
    const { user } = useAuth();
    const [historial, setHistorial] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchProgreso = async () => {
            if (!user?.id) return;
            try {
                const response = await axios.get(`/progreso/cliente/${user.id}`);
                setHistorial(response.data.body || []);
            } catch (error) {
                console.error("Error al obtener el progreso:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProgreso();
    }, [user?.id]);

    // Mock estático de top-metrics (ya que en tu BD medidas_fisicas se almacena aparte y usualmente son calculadas).
    // TODO: Enlazar endpoint de medidas físicas para sobrescribir esto en el futuro.
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
