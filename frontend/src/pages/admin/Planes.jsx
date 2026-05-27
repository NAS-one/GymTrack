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
            const res = await axios.get('/planes');
            const data = res.data.body || [];
            setPlans(data);
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

    const handleDelete = async (id) => {
        const isConfirmed = await confirm({
            title: '¿Eliminar Plan?',
            description: 'Esta acción no se puede deshacer. Los socios activos con este plan conservarán su membresía hasta el vencimiento.',
            confirmText: 'Sí, eliminar',
            cancelText: 'Cancelar',
            type: 'danger'
        });
        if (!isConfirmed) return;
        try {
            await axios.delete(`/planes/${id}`);
            fetchPlans();
            toast.success('Plan eliminado correctamente');
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
                                <div key={plan.id} className="bg-gym-card border border-white/5 rounded-2xl p-5 relative group hover:border-gym-orange/30 transition-all hover:-translate-y-1 shadow-lg flex flex-col">
                                    <div className="absolute top-4 right-4 bg-white/5 px-2 py-1 rounded text-[10px] font-bold text-gym-gray border border-white/5 uppercase">
                                        {plan.duracion_meses} {plan.duracion_meses === 1 ? 'Mes' : 'Meses'}
                                    </div>
                                    <div className="mb-3">
                                        <h3 className="text-lg font-bold text-white">{plan.nombre}</h3>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-bold text-gym-orange">${parseInt(plan.precio).toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* KPI en Tarjeta */}
                                    <div className="mb-4 flex items-center gap-2 text-sm text-green-400 font-medium bg-green-500/10 px-2 py-1 rounded w-fit">
                                        <Users size={14} /> {plan.usuarios_activos || 0} Activos
                                    </div>

                                    <p className="text-xs text-gray-400 leading-relaxed mb-4 line-clamp-2 flex-1">
                                        {plan.descripcion || "Acceso a instalaciones."}
                                    </p>

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
                                        <button onClick={() => handleDelete(plan.id)} className="p-1.5 hover:bg-red-500/10 text-gym-gray hover:text-red-500 rounded-lg transition-colors">
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