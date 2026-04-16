import React, { useState, useEffect } from 'react';
import { Dumbbell, Clock, Info } from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import axios from '../../api/axios';

export const Rutina = () => {
    const { user } = useAuth();
    const [rutinaDelDia, setRutinaDelDia] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRutina = async () => {
            if (!user?.id) return;
            try {
                const response = await axios.get(`/rutinas/active/${user.id}`);
                setRutinaDelDia(response.data.body);
            } catch (error) {
                console.error("Error al obtener la rutina:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRutina();
    }, [user?.id]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gym-orange"></div>
            </div>
        );
    }

    if (!rutinaDelDia) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <Dumbbell size={48} className="text-gray-600 mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Sin Rutina Activa</h2>
                <p className="text-gray-400 text-sm">Aún no tienes una rutina asignada. Por favor conversa con tu entrenador.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5 animate-fade-in pb-12 h-full">
            <div className="flex items-center justify-between mb-2 mt-2">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Mi Rutina</h1>
                    <p className="text-gray-400 text-sm">{rutinaDelDia.nombre}</p>
                </div>
                <div className="bg-gym-orange/10 p-3 rounded-2xl">
                    <Dumbbell size={28} className="text-gym-orange" />
                </div>
            </div>

            <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 shadow-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center border border-white/10">
                        <Clock size={18} className="text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Asignada por</p>
                        <p className="text-sm text-white font-medium">{rutinaDelDia.entrenador_nombre || rutinaDelDia.entrenador || 'Tu Entrenador'}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Ejercicios</p>
                    <p className="text-xl text-white font-bold">{(rutinaDelDia.detalles || rutinaDelDia.ejercicios || []).length}</p>
                </div>
            </div>

            <div className="space-y-6">
                <h3 className="text-lg font-bold text-white px-1 mt-4 border-b border-white/10 pb-2">Plan Semanal</h3>

                {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(dia => {
                    const ejerciciosDia = (rutinaDelDia.plan || rutinaDelDia.detalles || rutinaDelDia.ejercicios || []).filter(ej => ej.dia === dia);
                    const hoyDate = new Date();
                    const diasSemanaMap = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                    const esHoy = diasSemanaMap[hoyDate.getDay()] === dia || (diasSemanaMap[hoyDate.getDay()] === 'Miercoles' && dia === 'Miércoles');

                    return (
                        <div key={dia} className={`bg-zinc-900/40 border ${esHoy ? 'border-gym-orange' : 'border-white/5'} rounded-2xl overflow-hidden`}>
                            <div className={`p-3 border-b ${esHoy ? 'border-gym-orange/30 bg-gym-orange/10 text-gym-orange' : 'border-white/5 bg-zinc-800/20 text-gray-400'} flex justify-between items-center`}>
                                <h4 className="font-bold text-sm tracking-widest uppercase">{dia} {esHoy && '(Hoy)'}</h4>
                                <span className="text-xs font-semibold">{ejerciciosDia.length > 0 ? `${ejerciciosDia.length} Ejercicios` : 'Descanso'}</span>
                            </div>

                            <div className="p-3">
                                {ejerciciosDia.length === 0 ? (
                                    <div className="text-center py-4 text-gray-500 text-sm flex items-center justify-center gap-2">
                                        Día de Recuperación y Descanso
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {ejerciciosDia.map((ej, index) => (
                                            <div key={ej.id || index} className="bg-zinc-800/80 border border-white/5 rounded-xl p-3 flex gap-3">
                                                <div className="flex flex-col items-center justify-center w-8">
                                                    <span className="text-lg font-black text-white/20">{index + 1}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="text-[10px] bg-white/10 px-2 text-gray-300 rounded-md font-bold uppercase tracking-wider">{ej.grupo_muscular || 'Musculatura'}</span>
                                                    </div>
                                                    <h5 className="text-sm font-bold text-white">{ej.nombre_ejercicio || ej.ejercicio_nombre || ej.nombre || 'Ejercicio Físico'}</h5>
                                                    <div className="flex items-center gap-4 mt-1.5">
                                                        <div>
                                                            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Series</span>
                                                            <p className="text-xs font-semibold text-gym-orange">{ej.series || '-'}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Reps</span>
                                                            <p className="text-xs font-semibold text-gym-orange">{ej.repeticiones || ej.reps || '-'}</p>
                                                        </div>
                                                        <div>
                                                            <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">Peso</span>
                                                            <p className="text-xs font-semibold text-emerald-400">{ej.carga || ej.carga_proyectada ? `${ej.carga || ej.carga_proyectada}` : 'Libre'}</p>
                                                        </div>
                                                    </div>
                                                    {(ej.info || ej.descripcion) && (
                                                        <div className="flex items-center gap-1 mt-2 bg-white/5 p-1.5 rounded-md inline-flex w-full">
                                                            <Info size={10} className="text-gray-400 shrink-0" />
                                                            <span className="text-[10px] text-gray-400 leading-tight">{ej.info || ej.descripcion}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
