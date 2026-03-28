import { useState, useEffect } from 'react';
import {
    X, Calendar, Filter, Save, FileSpreadsheet,
    CreditCard, Activity, Wrench, Clock, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

export function GenerateReportModal({ isOpen, onClose, tipoReporte, onGenerate }) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Estado consolidado de filtros
    const [formData, setFormData] = useState({
        titulo: '',
        fechaInicio: '',
        fechaFin: '',
        // Filtros Finanzas
        metodoPago: 'todos',
        estadoMembresia: 'todos',
        // Filtros Asistencia
        estadoAcceso: 'todos',
        jornada: 'todos',
        // Filtros Inventario
        estadoMaquina: 'todos',
    });

    // Autocompletar título sugerido al abrir
    useEffect(() => {
        if (isOpen) {
            const mesActual = new Date().toLocaleString('es-CL', { month: 'long', year: 'numeric' });
            const titulos = {
                finanzas: `Balance Financiero - ${mesActual}`,
                asistencia: `Reporte de Afluencia - ${mesActual}`,
                inventario: `Estado de Inventario - ${mesActual}`,
                operativo: `Reporte Operativo - ${mesActual}`
            };
            setFormData(prev => ({ ...prev, titulo: titulos[tipoReporte] || `Reporte ${tipoReporte}` }));
        }
    }, [isOpen, tipoReporte]);

    if (!isOpen) return null;

    // --- MOTOR DE FECHAS RÁPIDAS ---
    const setQuickDate = (daysAgo, isThisMonth = false) => {
        const end = new Date();
        let start = new Date();

        if (isThisMonth) {
            start = new Date(end.getFullYear(), end.getMonth(), 1);
        } else {
            start.setDate(start.getDate() - daysAgo);
        }

        const formatDate = (date) => date.toISOString().split('T')[0];

        setFormData(prev => ({
            ...prev,
            fechaInicio: formatDate(start),
            fechaFin: formatDate(end)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.titulo.trim() || !formData.fechaInicio || !formData.fechaFin) {
            return toast.warning("Complete el título y el rango de fechas");
        }
        if (new Date(formData.fechaInicio) > new Date(formData.fechaFin)) {
            return toast.error("La fecha de inicio no puede ser mayor a la de fin");
        }

        setIsSubmitting(true);
        try {
            await onGenerate({ ...formData, tipo: tipoReporte });
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const InputClass = "w-full bg-[#09090b] border border-white/10 focus:border-gym-orange focus:ring-1 focus:ring-gym-orange rounded-xl px-4 py-2.5 text-white outline-none transition-all placeholder-zinc-600 text-sm";
    const LabelClass = "text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5";

    // Icono dinámico para el header
    const HeaderIcon = tipoReporte === 'finanzas' ? CreditCard : tipoReporte === 'asistencia' ? Activity : Wrench;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">

                {/* HEADER */}
                <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-gym-orange/20 to-orange-600/10 text-gym-orange rounded-xl border border-gym-orange/20 shadow-inner">
                            <HeaderIcon size={24} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white capitalize">Reporte de {tipoReporte}</h3>
                            <p className="text-xs text-zinc-400 mt-0.5">Configura los parámetros para la extracción de datos.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white hover:bg-white/10 p-2 rounded-xl transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* CONTENIDO SCROLLEABLE */}
                <div className="overflow-y-auto custom-scrollbar p-6">
                    <form id="report-form" onSubmit={handleSubmit} className="space-y-6">

                        {/* 1. TÍTULO */}
                        <div>
                            <label className={LabelClass}><FileSpreadsheet size={14} /> Nombre del Documento</label>
                            <input
                                type="text"
                                className={InputClass}
                                value={formData.titulo}
                                onChange={e => setFormData({ ...formData, titulo: e.target.value })}
                            />
                        </div>

                        {/* 2. RANGO DE FECHAS */}
                        <div className="bg-black/30 p-5 rounded-2xl border border-white/5 space-y-4">
                            <div className="flex justify-between items-center">
                                <label className={LabelClass}><Calendar size={14} /> Período de Tiempo</label>
                                {/* Botones de acción rápida */}
                                <div className="flex gap-2">
                                    <QuickDateBtn label="7 Días" onClick={() => setQuickDate(7)} />
                                    <QuickDateBtn label="30 Días" onClick={() => setQuickDate(30)} />
                                    <QuickDateBtn label="Este Mes" onClick={() => setQuickDate(0, true)} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="date" className={`${InputClass} [color-scheme:dark]`} value={formData.fechaInicio} onChange={e => setFormData({ ...formData, fechaInicio: e.target.value })} />
                                <input type="date" className={`${InputClass} [color-scheme:dark]`} value={formData.fechaFin} onChange={e => setFormData({ ...formData, fechaFin: e.target.value })} />
                            </div>
                        </div>

                        {/* 3. FILTROS AVANZADOS DINÁMICOS */}
                        <div className="bg-black/30 p-5 rounded-2xl border border-white/5 space-y-4">
                            <label className={LabelClass}><Filter size={14} /> Parámetros Específicos</label>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* --- FILTROS FINANZAS --- */}
                                {tipoReporte === 'finanzas' && (
                                    <>
                                        <SelectField label="Método de Pago" value={formData.metodoPago} onChange={e => setFormData({ ...formData, metodoPago: e.target.value })} options={[
                                            { val: 'todos', label: 'Todos los métodos' },
                                            { val: 'Efectivo', label: 'Efectivo' },
                                            { val: 'Transferencia', label: 'Transferencia Bancaria' },
                                            { val: 'Tarjeta', label: 'Tarjeta Crédito/Débito' }
                                        ]} />
                                        <SelectField label="Estado Membresía" value={formData.estadoMembresia} onChange={e => setFormData({ ...formData, estadoMembresia: e.target.value })} options={[
                                            { val: 'todos', label: 'Cualquier estado' },
                                            { val: 'active', label: 'Solo Activas' },
                                            { val: 'expired', label: 'Solo Vencidas' }
                                        ]} />
                                    </>
                                )}

                                {/* --- FILTROS ASISTENCIA --- */}
                                {tipoReporte === 'asistencia' && (
                                    <>
                                        <SelectField label="Estado de Acceso" value={formData.estadoAcceso} onChange={e => setFormData({ ...formData, estadoAcceso: e.target.value })} options={[
                                            { val: 'todos', label: 'Todos los accesos' },
                                            { val: 'aprobado', label: 'Accesos Aprobados' },
                                            { val: 'denegado', label: 'Accesos Denegados' }
                                        ]} />
                                        <SelectField label="Jornada" value={formData.jornada} onChange={e => setFormData({ ...formData, jornada: e.target.value })} options={[
                                            { val: 'todos', label: 'Día Completo' },
                                            { val: 'mañana', label: 'Mañana (06:00 - 14:00)' },
                                            { val: 'tarde', label: 'Tarde (14:00 - 22:00)' }
                                        ]} />
                                    </>
                                )}

                                {/* --- FILTROS INVENTARIO --- */}
                                {tipoReporte === 'inventario' && (
                                    <SelectField label="Estado Operativo" value={formData.estadoMaquina} onChange={e => setFormData({ ...formData, estadoMaquina: e.target.value })} options={[
                                        { val: 'todos', label: 'Todas las máquinas' },
                                        { val: 'operativa', label: 'Operativas' },
                                        { val: 'mantencion', label: 'En Mantención' },
                                        { val: 'baja', label: 'Dadas de Baja' }
                                    ]} />
                                )}
                            </div>
                        </div>
                    </form>
                </div>

                {/* FOOTER ACTIONS */}
                <div className="px-6 py-4 border-t border-white/5 bg-black/20 flex gap-3 shrink-0">
                    <button type="button" onClick={onClose} disabled={isSubmitting} className="flex-1 py-3 text-sm font-bold text-zinc-400 hover:text-white transition-colors rounded-xl border border-white/5 hover:bg-white/5">
                        Cancelar
                    </button>
                    <button form="report-form" type="submit" disabled={isSubmitting} className="flex-[2] bg-gym-orange hover:bg-orange-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSubmitting ? (
                            <span className="animate-pulse">Procesando Millones de Datos...</span>
                        ) : (
                            <><Save size={18} /> Generar Reporte</>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}

// Subcomponentes UI
function QuickDateBtn({ label, onClick }) {
    return (
        <button type="button" onClick={onClick} className="px-3 py-1 bg-white/5 hover:bg-gym-orange/20 text-zinc-400 hover:text-gym-orange border border-white/5 hover:border-gym-orange/30 rounded-lg text-[10px] font-bold uppercase transition-all">
            {label}
        </button>
    );
}

function SelectField({ label, value, onChange, options }) {
    return (
        <div>
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 block">{label}</label>
            <select value={value} onChange={onChange} className="w-full bg-[#09090b] border border-white/10 focus:border-gym-orange rounded-xl px-4 py-2.5 text-white outline-none transition-all text-sm appearance-none cursor-pointer hover:border-white/20">
                {options.map(opt => <option key={opt.val} value={opt.val}>{opt.label}</option>)}
            </select>
        </div>
    );
}