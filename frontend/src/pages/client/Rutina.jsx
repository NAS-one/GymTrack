import React, { useState, useEffect } from 'react';
import { Dumbbell, Clock, Info, Plus, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../contexts/useAuth';
import axios from '../../api/axios';
import { toast } from 'sonner';
import { RutinaModal } from '../../components/admin/Clientes/RutinaModal';
import { useConfirm } from '../../contexts/ConfirmContext';

export const Rutina = () => {
    const { user } = useAuth();
    const confirm = useConfirm();

    const [rutinaDelDia, setRutinaDelDia] = useState(null);
    const [rutinasActivas, setRutinasActivas] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    // Estado del modal de rutinas
    const [isRutinaModalOpen, setIsRutinaModalOpen] = useState(false);
    const [rutinaParaEditar, setRutinaParaEditar] = useState(null);

    // Acordeón: qué rutina está expandida en la lista
    const [expandedRutinaId, setExpandedRutinaId] = useState(null);

    // Objeto "cliente" que pasamos al RutinaModal (el propio usuario)
    const clienteSelf = user ? { id: user.id || user.id_usuario, nombre: user.nombre || user.username } : null;

    const fetchRutinas = async () => {
        const userId = user?.id || user?.id_usuario;
        if (!userId) {
            setFetchError("No se encontró el ID del cliente.");
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const response = await axios.get(`/rutinas/active/${userId}?t=${Date.now()}`);
            let data = response.data.body || response.data;
            if (data && data.body) data = data.body;

            const lista = Array.isArray(data) ? data : (data ? [data] : []);
            setRutinasActivas(lista);

            if (lista.length > 0) {
                const combinedRoutine = {
                    nombre: lista.length > 1 ? "Plan de Entrenamiento" : lista[0].nombre,
                    entrenador_nombre: lista[0].entrenador_nombre || lista[0].entrenador,
                    plan: []
                };
                lista.forEach(rutina => {
                    const ejercicios = rutina.plan || rutina.detalles || rutina.ejercicios || [];
                    combinedRoutine.plan = [...combinedRoutine.plan, ...ejercicios];
                });
                setRutinaDelDia(combinedRoutine);
            } else {
                setRutinaDelDia(null);
            }
        } catch (error) {
            console.error("Error al obtener la rutina:", error);
            if (error.response?.status !== 404) {
                setFetchError(`Error: ${error.message}.`);
            } else {
                setRutinaDelDia(null);
                setRutinasActivas([]);
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRutinas();
    }, [user?.id, user?.id_usuario]);

    const handleDeleteRutina = async (rutina) => {
        const ok = await confirm({
            title: '¿Eliminar esta rutina?',
            description: `Se eliminará "${rutina.nombre}" permanentemente.`,
            confirmText: 'Sí, eliminar',
            cancelText: 'Cancelar',
            type: 'danger',
        });
        if (!ok) return;
        try {
            await axios.delete(`/rutinas/${rutina.id}`);
            toast.success('Rutina eliminada');
            fetchRutinas();
        } catch {
            toast.error('Error al eliminar la rutina');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gym-orange"></div>
            </div>
        );
    }

    if (fetchError) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                <Dumbbell size={48} className="text-gray-600 mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Error al cargar la rutina</h2>
                <p className="text-gray-400 text-sm">{fetchError}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-5 animate-fade-in pb-12 h-full">

            {/* ── HEADER ── */}
            <div className="flex items-center justify-between mb-2 mt-2">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Mi Rutina</h1>
                    <p className="text-gray-400 text-sm">
                        {rutinasActivas.length > 0
                            ? `${rutinasActivas.length} rutina(s) activa(s)`
                            : 'Sin rutinas activas'}
                    </p>
                </div>
                <div className="bg-gym-orange/10 p-3 rounded-2xl">
                    <Dumbbell size={28} className="text-gym-orange" />
                </div>
            </div>

            {/* ── SECCIÓN: GESTIÓN DE RUTINAS PROPIAS ── */}
            <div className="bg-zinc-900/60 border border-white/5 rounded-2xl overflow-hidden">
                {/* Cabecera de la sección */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 border-b border-white/5 bg-orange-500/5">
                    <div>
                        <p className="text-xs text-orange-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <Dumbbell size={13} /> Mis Rutinas
                        </p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                            Crea y gestiona tus propias rutinas sin necesidad de entrenador.
                        </p>
                    </div>
                    {(!rutinasActivas || rutinasActivas.length < 7) && (
                        <button
                            onClick={() => {
                                setRutinaParaEditar(null);
                                setIsRutinaModalOpen(true);
                            }}
                            className="bg-gym-orange hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 text-sm whitespace-nowrap"
                        >
                            <Plus size={16} /> Nueva Rutina
                        </button>
                    )}
                </div>

                {/* Lista de rutinas */}
                {rutinasActivas.length === 0 ? (
                    <div className="p-10 flex flex-col items-center justify-center text-center">
                        <Dumbbell size={36} className="text-zinc-700 mb-3" />
                        <p className="text-zinc-400 font-medium text-sm">Aún no tienes rutinas activas.</p>
                        <p className="text-zinc-600 text-xs mt-1">
                            Pulsa "Nueva Rutina" para crear tu primer plan de entrenamiento.
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {rutinasActivas.map((rutina) => {
                            const isExpanded = expandedRutinaId === rutina.id;
                            const ejercicios = rutina.plan || rutina.detalles || rutina.ejercicios || [];
                            return (
                                <div key={rutina.id}>
                                    {/* Cabecera de cada rutina */}
                                    <div className="flex items-center justify-between p-4 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                                        <button
                                            className="flex items-center gap-3 flex-1 text-left"
                                            onClick={() => setExpandedRutinaId(isExpanded ? null : rutina.id)}
                                        >
                                            <div className="w-8 h-8 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center justify-center shrink-0">
                                                <Dumbbell size={15} className="text-gym-orange" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{rutina.nombre}</p>
                                                <p className="text-[10px] text-zinc-500">
                                                    {ejercicios.length} ejercicios · Creada: {new Date(rutina.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            {isExpanded
                                                ? <ChevronUp size={16} className="text-zinc-500 ml-2" />
                                                : <ChevronDown size={16} className="text-zinc-500 ml-2" />
                                            }
                                        </button>
                                        <div className="flex items-center gap-2 ml-3">
                                            <button
                                                onClick={() => {
                                                    setRutinaParaEditar(rutina);
                                                    setIsRutinaModalOpen(true);
                                                }}
                                                className="px-3 py-1.5 text-xs font-bold text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/10 transition-all"
                                            >
                                                <Edit size={13} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteRutina(rutina)}
                                                className="px-3 py-1.5 text-xs font-bold text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-all"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Detalle expandible */}
                                    {isExpanded && ejercicios.length > 0 && (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-white/5 text-zinc-500 text-xs uppercase tracking-wider">
                                                    <tr>
                                                        <th className="p-3">Día</th>
                                                        <th className="p-3">Músculo</th>
                                                        <th className="p-3">Ejercicio</th>
                                                        <th className="p-3 text-center">Series</th>
                                                        <th className="p-3 text-center">Reps</th>
                                                        <th className="p-3 text-right">Carga</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {ejercicios.map((row, i) => (
                                                        <tr key={i} className="hover:bg-white/5 transition-colors">
                                                            <td className="p-3 font-bold text-gym-orange text-xs">{row.dia}</td>
                                                            <td className="p-3 text-zinc-400 text-xs">{row.grupo_muscular || '--'}</td>
                                                            <td className="p-3 text-white text-xs">{row.nombre_ejercicio}</td>
                                                            <td className="p-3 text-center text-zinc-400 font-mono text-xs">{row.series}</td>
                                                            <td className="p-3 text-center text-zinc-400 font-mono text-xs">{row.repeticiones}</td>
                                                            <td className="p-3 text-right">
                                                                <span className="bg-zinc-800 text-gym-orange px-2 py-0.5 rounded font-mono border border-zinc-700 text-xs">
                                                                    {row.carga_proyectada || 'P.C.'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── SECCIÓN: VISTA SEMANAL DE LA RUTINA ACTIVA ── */}
            {rutinaDelDia && (
                <>
                    {/* Info card de entrenador (si aplica) */}
                    <div className="bg-zinc-900 border border-white/5 rounded-2xl p-4 shadow-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center border border-white/10">
                                <Clock size={18} className="text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">
                                    {rutinaDelDia.entrenador_nombre ? 'Asignada por' : 'Gestionada por'}
                                </p>
                                <p className="text-sm text-white font-medium">
                                    {rutinaDelDia.entrenador_nombre || 'Ti mismo'}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-widest">Ejercicios</p>
                            <p className="text-xl text-white font-bold">
                                {(rutinaDelDia.plan || []).length}
                            </p>
                        </div>
                    </div>

                    {/* Plan semanal */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-white px-1 mt-4 border-b border-white/10 pb-2">Plan Semanal</h3>

                        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(dia => {
                            const ejerciciosDia = (rutinaDelDia.plan || []).filter(ej => ej.dia === dia);
                            const hoyDate = new Date();
                            const diasSemanaMap = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                            const esHoy = diasSemanaMap[hoyDate.getDay()] === dia;

                            return (
                                <div key={dia} className={`bg-zinc-900/40 border ${esHoy ? 'border-gym-orange' : 'border-white/5'} rounded-2xl overflow-hidden`}>
                                    <div className={`p-3 border-b ${esHoy ? 'border-gym-orange/30 bg-gym-orange/10 text-gym-orange' : 'border-white/5 bg-zinc-800/20 text-gray-400'} flex justify-between items-center`}>
                                        <h4 className="font-bold text-sm tracking-widest uppercase">{dia} {esHoy && '(Hoy)'}</h4>
                                        <span className="text-xs font-semibold">{ejerciciosDia.length > 0 ? `${ejerciciosDia.length} Ejercicios` : 'Descanso'}</span>
                                    </div>

                                    <div className="p-3">
                                        {ejerciciosDia.length === 0 ? (
                                            <div className="text-center py-4 text-gray-500 text-sm">
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
                                                                <span className="text-[10px] bg-white/10 px-2 text-gray-300 rounded-md font-bold uppercase tracking-wider">
                                                                    {ej.grupo_muscular || 'Musculatura'}
                                                                </span>
                                                            </div>
                                                            <h5 className="text-sm font-bold text-white">
                                                                {ej.nombre_ejercicio || ej.ejercicio_nombre || ej.nombre || 'Ejercicio Físico'}
                                                            </h5>
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
                                                                    <p className="text-xs font-semibold text-emerald-400">
                                                                        {ej.carga || ej.carga_proyectada ? `${ej.carga || ej.carga_proyectada}` : 'Libre'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {(ej.info || ej.descripcion) && (
                                                                <div className="flex items-center gap-1 mt-2 bg-white/5 p-1.5 rounded-md w-full">
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
                </>
            )}

            {/* ── MODAL DE RUTINA ── */}
            <RutinaModal
                isOpen={isRutinaModalOpen}
                onClose={() => {
                    setIsRutinaModalOpen(false);
                    setRutinaParaEditar(null);
                }}
                client={clienteSelf}
                rutinaExistente={rutinaParaEditar}
                onSave={() => {
                    fetchRutinas();
                }}
            />
        </div>
    );
};
