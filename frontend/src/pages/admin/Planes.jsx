import { useEffect, useState } from 'react';
import axios from '../../api/axios';
import { Plus, Edit, Trash2, Users, TrendingUp, Award, Eye } from 'lucide-react';
import { PlanModal } from '../../components/admin/Planes/PlanModal';
import { PlanDetailModal } from '../../components/admin/Planes/PlanDetailModal';
import { toast } from 'sonner';
import { useConfirm } from '../../contexts/ConfirmContext';

export function Planes() {
    const confirm = useConfirm();
    const [plans, setPlans] = useState([]);
    const [archivedPlans, setArchivedPlans] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modales
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [detailPlan, setDetailPlan] = useState(null);

    // Stats
    const [stats, setStats] = useState({ total: 0, bestSeller: 'N/A' });

    const fetchPlans = async () => {
        try {
            setLoading(true);
            const [res, archivedRes] = await Promise.all([
                axios.get('/planes'),
                axios.get('/planes/archived')
            ]);
            const data = res.data.body || [];
            const archivedData = archivedRes.data.body || [];
            setPlans(data);
            setArchivedPlans(archivedData);
            calculateStats(data);
        } catch (e) {
            console.error("Error fetching plans:", e);
            setPlans([]); // Evita que explote el map
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        if (!Array.isArray(data) || data.length === 0) {
            setStats({ total: 0, bestSeller: 'N/A' });
            return;
        }

        const total = data.length;

        // Lógica Segura para encontrar el Best Seller
        // Convertimos a número (Number) para evitar errores si viene como string "10"
        const bestPlan = data.reduce((prev, current) => {
            const prevActive = Number(prev.usuarios_activos) || 0;
            const currActive = Number(current.usuarios_activos) || 0;
            return (prevActive > currActive) ? prev : current;
        }, data[0]); // Inicializamos con el primero

        setStats({
            total,
            bestSeller: (Number(bestPlan.usuarios_activos) || 0) > 0 ? bestPlan.nombre : 'N/A'
        });
    };

    useEffect(() => { fetchPlans(); }, []);

    const handleSave = async (formData) => {
        try {
            if (selectedPlan) await axios.patch(`/planes/${selectedPlan.id}`, formData);
            else await axios.post('/planes', formData);
            setIsModalOpen(false);
            fetchPlans();
            toast.success(selectedPlan ? 'Plan actualizado' : 'Plan creado', {
                description: `El plan "${formData.nombre}" fue guardado correctamente.`
            });
        } catch (e) {
            console.error(e);
            const mensajeError = e.response?.data?.error
                || (Array.isArray(e.response?.data) ? e.response.data[0]?.message : null)
                || 'Error al guardar el plan. Verifica los datos e intenta nuevamente.';
            toast.error('Error al guardar plan', { description: mensajeError });
        }
    };

    const handleDelete = async (plan) => {
        const isLastPlan = plans.length <= 1;
        if (isLastPlan) {
            toast.error('No se puede eliminar el último plan', {
                description: 'Debe existir al menos 1 plan activo en el sistema.'
            });
            return;
        }

        const activeUsersCount = Number(plan.usuarios_activos) || 0;
        let warningText = 'Esta acción no se puede deshacer. ';
        if (activeUsersCount > 0) {
            warningText += `¡ATENCIÓN! Este plan tiene ${activeUsersCount} usuarios activos. Sus membresías se mantendrán vigentes hasta su fecha de vencimiento, pero no podrán renovar este plan.`;
        } else {
            warningText += 'Los socios activos con este plan conservarán su membresía hasta el vencimiento.';
        }

        const isConfirmed = await confirm({
            title: '¿Archivar Plan?',
            description: warningText,
            confirmText: 'Sí, archivar',
            cancelText: 'Cancelar',
            type: 'danger'
        });
        if (!isConfirmed) return;
        try {
            await axios.delete(`/planes/${plan.id}`);
            fetchPlans();
            toast.success('Plan archivado correctamente');
        } catch (e) {
            const mensajeError = e.response?.data?.error || 'Error al eliminar el plan.';
            toast.error('Error', { description: mensajeError });
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up pb-10">

            {/* HEADER */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">Planes y Tarifas</h2>
                    <p className="text-gym-gray text-sm">Gestiona el catálogo comercial.</p>
                </div>
                <button onClick={() => { setSelectedPlan(null); setIsModalOpen(true); }} className="bg-gym-orange hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg transition-all">
                    <Plus size={18} /> Nuevo Plan
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">

                {/* === GRID DE TARJETAS === */}
                <div className="flex-1">
                    {loading ? (
                        <div className="text-center py-12 text-gym-gray">Cargando catálogo...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {plans.map((plan) => (
                                <div key={plan.id} className={`bg-gym-card border rounded-2xl p-5 relative group transition-all hover:-translate-y-1 shadow-lg flex flex-col
                                    ${plan.tipo_plan === 'oferta' ? 'border-orange-500/30 hover:border-orange-500' : 
                                      plan.tipo_plan === 'estudiante' ? 'border-blue-500/30 hover:border-blue-500' : 
                                      plan.tipo_plan === 'combo' ? 'border-emerald-500/30 hover:border-emerald-500' : 
                                      'border-white/5 hover:border-gym-orange/30'}`}
                                >
                                    <div className="mb-3">
                                        <h3 className="text-lg font-bold text-white truncate" title={plan.nombre}>{plan.nombre}</h3>
                                        
                                        {/* Duración y Etiqueta de Tipo (Debajo del nombre para que no choquen) */}
                                        <div className="flex gap-2 mt-1 mb-2">
                                            {plan.tipo_plan === 'oferta' && <span className="bg-orange-500/20 text-orange-400 px-2 py-1 rounded text-[9px] font-black uppercase border border-orange-500/30">🔥 Oferta</span>}
                                            {plan.tipo_plan === 'estudiante' && <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-[9px] font-black uppercase border border-blue-500/30">🎓 Convenio</span>}
                                            {plan.tipo_plan === 'combo' && <span className="bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-[9px] font-black uppercase border border-emerald-500/30">⚡ Combo</span>}
                                            
                                            <div className="bg-white/5 px-2 py-1 rounded text-[10px] font-bold text-gym-gray border border-white/5 uppercase">
                                                {plan.duracion_meses} {plan.duracion_meses === 1 ? 'Mes' : 'Meses'}
                                            </div>
                                        </div>

                                        <div className="flex flex-col">
                                            {plan.precio_comparacion && plan.precio_comparacion > plan.precio && (
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-xs text-zinc-500 line-through">${parseInt(plan.precio_comparacion).toLocaleString()}</span>
                                                    <span className="bg-red-500/20 text-red-500 text-[10px] font-black px-1.5 py-0.5 rounded border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                                                        -{Math.round((1 - plan.precio / plan.precio_comparacion) * 100)}%
                                                    </span>
                                                </div>
                                            )}
                                            <span className="text-2xl font-black text-gym-orange tracking-tight truncate w-full" title={`$${parseInt(plan.precio).toLocaleString()}`}>${parseInt(plan.precio).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* KPI en Tarjeta */}
                                    <div className="mb-4 flex items-center gap-2 text-sm text-green-400 font-medium bg-green-500/10 px-2 py-1 rounded w-fit">
                                        <Users size={14} /> {plan.usuarios_activos || 0} Activos
                                    </div>

                                    <p className="text-xs text-gray-400 leading-relaxed mb-3 line-clamp-2">
                                        {plan.descripcion || "Acceso a instalaciones."}
                                    </p>

                                    {/* Beneficios Extra */}
                                    {plan.beneficios_extra && plan.beneficios_extra.length > 0 && (
                                        <div className="mb-4 space-y-1 flex-1">
                                            {plan.beneficios_extra.map((ben, idx) => (
                                                <div key={idx} className="text-[10px] text-emerald-400 flex items-center gap-1.5">
                                                    <span className="w-1 h-1 bg-emerald-400 rounded-full"></span> {ben}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {(!plan.beneficios_extra || plan.beneficios_extra.length === 0) && <div className="flex-1"></div>}

                                    <div className="pt-3 border-t border-white/5 flex gap-2">
                                        {/* Botón Ver Detalle */}
                                        <button
                                            onClick={() => setDetailPlan(plan)}
                                            className="p-1.5 hover:bg-purple-500/10 text-gym-gray hover:text-purple-400 rounded-lg transition-colors"
                                            title="Ver Estadísticas"
                                        >
                                            <Eye size={18} />
                                        </button>

                                        <button onClick={() => { setSelectedPlan(plan); setIsModalOpen(true); }} className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-white transition-colors uppercase">
                                            Editar
                                        </button>
                                        <button onClick={() => handleDelete(plan)} className="p-1.5 hover:bg-red-500/10 text-gym-gray hover:text-red-500 rounded-lg transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* === SIDEBAR DINÁMICA === */}
                <div className="w-full lg:w-72 space-y-5">

                    {/* KPI 1: Resumen */}
                    <div className="bg-gym-card border border-white/10 rounded-2xl p-5">
                        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            <TrendingUp size={16} className="text-gym-orange" /> Resumen
                        </h3>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-xs text-gym-gray font-bold uppercase">Total Planes</span>
                                <span className="text-lg font-bold text-white">{stats.total}</span>
                            </div>

                            <div className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-3">
                                <span className="text-xs text-gym-gray font-bold uppercase block mb-2">Clientes Activos por Plan</span>

                                {plans.length > 0 ? plans.map(plan => (
                                    <div key={plan.id} className="flex justify-between items-center text-sm">
                                        <span className="text-gray-400 truncate w-32">{plan.nombre}</span>
                                        <span className="text-white font-mono font-bold">{plan.usuarios_activos || 0}</span>
                                    </div>
                                )) : <span className="text-xs text-gray-600">No hay planes</span>}
                            </div>
                        </div>
                    </div>

                    {/* KPI 2: Plan Estrella */}
                    <div className="bg-gym-card border border-white/10 rounded-2xl p-5">
                        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            <Award size={16} className="text-yellow-500" /> Plan Estrella
                        </h3>
                        <div className="text-center py-4 bg-yellow-500/5 rounded-xl border border-yellow-500/10">
                            <div className="inline-block p-3 rounded-full bg-yellow-500/10 text-yellow-500 mb-2 shadow-lg">
                                <Award size={28} />
                            </div>
                            <p className="text-lg font-bold text-white px-2">{stats.bestSeller}</p>
                            <p className="text-xs text-gym-gray mt-1">Mayor preferencia actual</p>
                        </div>
                    </div>

                    {/* KPI 3: Planes Archivados */}
                    {archivedPlans.length > 0 && (
                        <div className="bg-gym-card border border-white/10 rounded-2xl p-5">
                            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <Trash2 size={16} className="text-red-500" /> Planes Archivados
                            </h3>
                            <div className="space-y-3">
                                {archivedPlans.map(plan => (
                                    <div key={plan.id} className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl space-y-2">
                                        <div className="flex justify-between items-start">
                                            <span className="text-sm font-bold text-white truncate pr-2">{plan.nombre}</span>
                                            <span className="text-xs text-zinc-500 font-mono">${parseInt(plan.precio).toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-red-400">{plan.usuarios_activos_restantes || 0} activos</span>
                                            <span className="text-zinc-500">{plan.total_membresias_historicas || 0} históricas</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>

            <PlanModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                planToEdit={selectedPlan}
                onSave={handleSave}
            />

            {/* Renderizado condicional seguro del modal */}
            {detailPlan && (
                <PlanDetailModal
                    isOpen={!!detailPlan}
                    onClose={() => setDetailPlan(null)}
                    plan={detailPlan}
                />
            )}

        </div>
    );
}