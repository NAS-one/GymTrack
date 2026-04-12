import { useState, useEffect } from 'react';
import {
    X, FileSpreadsheet, Calendar, Filter, Users, Activity,
    UserX, UserMinus, CreditCard, Banknote, Landmark,
    Sun, Moon, Wrench, CheckCircle, AlertTriangle, Clock,
    Tags, Award, Briefcase, Sparkles, Percent
} from 'lucide-react';

export function GenerateReportModal({ isOpen, onClose, tipoReporte, onGenerate }) {
    // Estados del formulario
    const [titulo, setTitulo] = useState('');
    const [filtroExtra, setFiltroExtra] = useState('todos');

    // Estados de Tiempo
    const [timePreset, setTimePreset] = useState('month');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');

    const nombresReporte = {
        finanzas: 'Balance Financiero',
        asistencia: 'Métricas de Afluencia',
        inventario: 'Auditoría de Inventario',
        clientes: 'Directorio de Comunidad',
        planes: 'Rendimiento de Planes',
        entrenadores: 'Eficiencia de Staff'
    };

    // 1. Efecto: Reiniciar estado al abrir el modal
    useEffect(() => {
        if (isOpen) {
            setFiltroExtra(tipoReporte === 'clientes' ? 'all' : 'todos');
            setTimePreset('month');
            setTitulo('');
            calcularFechas('month');
        }
    }, [isOpen, tipoReporte]);

    // 2. Motor de cálculo de fechas inteligente
    const calcularFechas = (preset) => {
        const hoy = new Date();
        let inicio = new Date();

        if (preset === 'week') inicio.setDate(hoy.getDate() - 7);
        else if (preset === 'month') inicio.setMonth(hoy.getMonth() - 1);
        else if (preset === 'year') inicio = new Date(hoy.getFullYear(), 0, 1);

        if (preset !== 'custom') {
            setFechaInicio(inicio.toISOString().split('T')[0]);
            setFechaFin(hoy.toISOString().split('T')[0]);
        }
    };

    const handleTimePresetChange = (preset) => {
        setTimePreset(preset);
        calcularFechas(preset);
    };

    // 3. Generador de Títulos Reactivos
    const getSmartPlaceholder = () => {
        const timeLabels = { week: 'Última Sem', month: 'Último Mes', year: 'Este Año', custom: 'Rango Específico' };
        const timeStr = ` - ${timeLabels[timePreset]}`;

        if (tipoReporte === 'clientes') {
            const tags = { all: 'Completo', active: 'Vigentes', expired: 'Riesgo Fuga', none: 'Prospectos' };
            return `Directorio ${tags[filtroExtra]}${timeStr}`;
        }
        if (tipoReporte === 'finanzas') {
            const tags = { todos: 'General', Tarjeta: 'Digital', Efectivo: 'Efectivo', Transferencia: 'Transferencias' };
            return `Balance ${tags[filtroExtra]}${timeStr}`;
        }
        if (tipoReporte === 'asistencia') {
            const tags = { todos: 'General', mañana: 'Jornada Mañana', tarde: 'Jornada Tarde' };
            return `Afluencia ${tags[filtroExtra]}${timeStr}`;
        }
        if (tipoReporte === 'inventario') {
            const tags = { todos: 'Global', operativa: 'Operativos', en_mantencion: 'En Riesgo' };
            return `Auditoría Equipos ${tags[filtroExtra]}${timeStr}`;
        }
        if (tipoReporte === 'planes') {
            const tags = { todos: 'Global', activos: 'Vigentes', populares: 'Top Ventas' };
            return `Rendimiento Planes ${tags[filtroExtra]}${timeStr}`;
        }
        if (tipoReporte === 'entrenadores') {
            const tags = { todos: 'Global', sueldo_fijo: 'Plantilla Fija', porcentaje: 'Freelance' };
            return `Eficiencia Staff ${tags[filtroExtra]}${timeStr}`;
        }

        return 'Nuevo Reporte';
    };

    // Etiqueta dinámica para el filtro de tiempo
    const getTimeLabel = () => {
        if (tipoReporte === 'clientes') return 'Período de Análisis (Registros/Vencimientos)';
        if (tipoReporte === 'inventario') return 'Fechas de Adquisición / Registro';
        if (tipoReporte === 'planes') return 'Período de Ventas / Renovaciones';
        if (tipoReporte === 'entrenadores') return 'Período de Evaluación de Desempeño';
        return 'Horizonte Temporal';
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const formData = {
            titulo: titulo.trim() || getSmartPlaceholder(),
            tipo: tipoReporte,
            filtroExtra,
            fechaInicio,
            fechaFin
        };

        onGenerate(formData);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="bg-[#0c0c0e] border border-white/10 rounded-[2rem] w-full max-w-3xl relative z-10 shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gym-orange via-orange-400 to-gym-orange"></div>

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-white/5 shrink-0 bg-black/20">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-gym-orange/20 to-orange-500/5 text-gym-orange rounded-2xl border border-gym-orange/20 shadow-inner">
                            <FileSpreadsheet size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Configurar Extracción</h2>
                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-0.5">{nombresReporte[tipoReporte]}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white hover:bg-rose-500/20 rounded-full transition-all">
                        <X size={24} />
                    </button>
                </div>

                {/* Body scrollable */}
                <div className="overflow-y-auto custom-scrollbar p-6 space-y-8">
                    <form id="reportForm" onSubmit={handleSubmit} className="space-y-8">

                        {/* 1. Título Inteligente */}
                        <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5 space-y-3">
                            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                Nombre del Documento
                            </label>
                            <input
                                type="text"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-gym-orange focus:bg-black/60 outline-none transition-all placeholder-zinc-600 shadow-inner"
                                placeholder={getSmartPlaceholder()}
                                value={titulo}
                                onChange={(e) => setTitulo(e.target.value)}
                            />
                            <p className="text-[10px] text-zinc-500 font-medium">✨ Deja en blanco para usar la sugerencia generada por el sistema.</p>
                        </div>

                        {/* 2. Filtros de Tiempo Inteligentes */}
                        <div className="space-y-4">
                            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                <Clock size={14} className="text-blue-400" /> {getTimeLabel()}
                            </label>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <TimePresetCard active={timePreset === 'week'} onClick={() => handleTimePresetChange('week')} title="Últimos 7 Días" />
                                <TimePresetCard active={timePreset === 'month'} onClick={() => handleTimePresetChange('month')} title="Último Mes" />
                                <TimePresetCard active={timePreset === 'year'} onClick={() => handleTimePresetChange('year')} title="Este Año" />
                                <TimePresetCard active={timePreset === 'custom'} onClick={() => handleTimePresetChange('custom')} title="Personalizado" />
                            </div>

                            {/* Fechas Manuales */}
                            {timePreset === 'custom' && (
                                <div className="grid grid-cols-2 gap-4 pt-2 animate-in slide-in-from-top-2 duration-300">
                                    <div className="bg-black/40 p-1 rounded-xl border border-white/5 flex items-center pr-3 group focus-within:border-blue-500/50 transition-colors">
                                        <div className="p-2 text-zinc-500 group-focus-within:text-blue-400"><Calendar size={16} /></div>
                                        <input type="date" required className="bg-transparent text-sm text-white w-full outline-none [color-scheme:dark] font-mono" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
                                    </div>
                                    <div className="bg-black/40 p-1 rounded-xl border border-white/5 flex items-center pr-3 group focus-within:border-blue-500/50 transition-colors">
                                        <div className="p-2 text-zinc-500 group-focus-within:text-blue-400"><Calendar size={16} /></div>
                                        <input type="date" required className="bg-transparent text-sm text-white w-full outline-none [color-scheme:dark] font-mono" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 3. Segmentación Visual en Cascada */}
                        <div className="space-y-4">
                            <label className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                <Filter size={14} className="text-gym-orange" /> Criterios de Segmentación
                            </label>

                            {/* -- CLIENTES / COMUNIDAD -- */}
                            {tipoReporte === 'clientes' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <SegmentCard active={filtroExtra === 'all'} onClick={() => setFiltroExtra('all')} icon={<Users size={18} />} title="Directorio Completo" desc="Todos los registros" color="zinc" />
                                    <SegmentCard active={filtroExtra === 'active'} onClick={() => setFiltroExtra('active')} icon={<Activity size={18} />} title="Socios Vigentes" desc="Membresías activas" color="emerald" />
                                    <SegmentCard active={filtroExtra === 'expired'} onClick={() => setFiltroExtra('expired')} icon={<UserX size={18} />} title="Riesgo de Fuga" desc="Membresías vencidas" color="rose" />
                                    <SegmentCard active={filtroExtra === 'none'} onClick={() => setFiltroExtra('none')} icon={<UserMinus size={18} />} title="Prospectos" desc="Sin planes de pago" color="orange" />
                                </div>
                            )}

                            {/* -- FINANZAS -- */}
                            {tipoReporte === 'finanzas' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <SegmentCard active={filtroExtra === 'todos'} onClick={() => setFiltroExtra('todos')} icon={<Landmark size={18} />} title="Flujo de Caja Total" desc="Todas las vías de ingreso" color="emerald" />
                                    <SegmentCard active={filtroExtra === 'Tarjeta'} onClick={() => setFiltroExtra('Tarjeta')} icon={<CreditCard size={18} />} title="Digital / Tarjetas" desc="Transacciones por Webpay/POS" color="blue" />
                                    <SegmentCard active={filtroExtra === 'Efectivo'} onClick={() => setFiltroExtra('Efectivo')} icon={<Banknote size={18} />} title="Efectivo en Caja" desc="Pagos en mostrador" color="orange" />
                                    <SegmentCard active={filtroExtra === 'Transferencia'} onClick={() => setFiltroExtra('Transferencia')} icon={<FileSpreadsheet size={18} />} title="Transferencias" desc="Abonos a cuenta bancaria" color="purple" />
                                </div>
                            )}

                            {/* -- ASISTENCIA -- */}
                            {tipoReporte === 'asistencia' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <SegmentCard active={filtroExtra === 'todos'} onClick={() => setFiltroExtra('todos')} icon={<Activity size={18} />} title="Jornada Completa" desc="Todo el día" color="zinc" />
                                    <SegmentCard active={filtroExtra === 'mañana'} onClick={() => setFiltroExtra('mañana')} icon={<Sun size={18} />} title="Bloque Mañana" desc="06:00 a 13:59 hrs" color="orange" />
                                    <SegmentCard active={filtroExtra === 'tarde'} onClick={() => setFiltroExtra('tarde')} icon={<Moon size={18} />} title="Bloque Tarde" desc="14:00 a 22:00 hrs" color="blue" />
                                </div>
                            )}

                            {/* -- INVENTARIO -- */}
                            {tipoReporte === 'inventario' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <SegmentCard active={filtroExtra === 'todos'} onClick={() => setFiltroExtra('todos')} icon={<Wrench size={18} />} title="Inventario Global" desc="Parque completo de máquinas" color="zinc" />
                                    <SegmentCard active={filtroExtra === 'operativa'} onClick={() => setFiltroExtra('operativa')} icon={<CheckCircle size={18} />} title="Operativo" desc="Equipos en buen estado" color="emerald" />
                                    <SegmentCard active={filtroExtra === 'en_mantencion'} onClick={() => setFiltroExtra('en_mantencion')} icon={<AlertTriangle size={18} />} title="En Riesgo" desc="Requieren mantenimiento" color="rose" />
                                </div>
                            )}

                            {/* -- PLANES -- */}
                            {tipoReporte === 'planes' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <SegmentCard active={filtroExtra === 'todos'} onClick={() => setFiltroExtra('todos')} icon={<Tags size={18} />} title="Rendimiento Global" desc="Todos los planes" color="zinc" />
                                    <SegmentCard active={filtroExtra === 'activos'} onClick={() => setFiltroExtra('activos')} icon={<Activity size={18} />} title="Membresías Activas" desc="Distribución actual" color="emerald" />
                                    <SegmentCard active={filtroExtra === 'populares'} onClick={() => setFiltroExtra('populares')} icon={<Award size={18} />} title="Top Ventas" desc="Planes más solicitados" color="pink" />
                                </div>
                            )}

                            {/* -- STAFF / ENTRENADORES -- */}
                            {tipoReporte === 'entrenadores' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <SegmentCard active={filtroExtra === 'todos'} onClick={() => setFiltroExtra('todos')} icon={<Briefcase size={18} />} title="Desempeño Global" desc="Staff completo" color="zinc" />
                                    <SegmentCard active={filtroExtra === 'sueldo_fijo'} onClick={() => setFiltroExtra('sueldo_fijo')} icon={<Banknote size={18} />} title="Planta Fija" desc="Contratos base" color="blue" />
                                    <SegmentCard active={filtroExtra === 'porcentaje'} onClick={() => setFiltroExtra('porcentaje')} icon={<Percent size={18} />} title="Freelance" desc="Modelo por porcentaje" color="purple" />
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                {/* Footer / Actions */}
                <div className="p-6 border-t border-white/5 bg-black/40 flex justify-end gap-4 shrink-0">
                    <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-all">
                        Cancelar
                    </button>
                    <button form="reportForm" type="submit" className="bg-gym-orange hover:bg-orange-500 text-white px-8 py-3 rounded-xl text-sm font-black tracking-wide shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_30px_rgba(249,115,22,0.5)] transition-all active:scale-95 flex items-center gap-2">
                        <Sparkles size={18} /> Procesar Extracción
                    </button>
                </div>

            </div>
        </div>
    );
}

// ==========================================
// MICRO-COMPONENTES (Tarjetas Interactivas)
// ==========================================

function TimePresetCard({ title, active, onClick }) {
    return (
        <div
            onClick={onClick}
            className={`cursor-pointer p-3 rounded-xl border text-center transition-all duration-200 
                ${active
                    ? 'border-blue-500/50 bg-blue-500/10 text-blue-400 shadow-inner scale-[1.02] ring-1 ring-blue-500'
                    : 'border-white/5 bg-black/40 text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
                }
            `}
        >
            <p className="text-[11px] font-bold uppercase tracking-wider">{title}</p>
        </div>
    );
}

function SegmentCard({ title, desc, icon, active, onClick, color }) {
    const theme = {
        zinc: 'border-zinc-500/50 bg-zinc-500/10 text-zinc-300 ring-zinc-500',
        emerald: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 ring-emerald-500',
        rose: 'border-rose-500/50 bg-rose-500/10 text-rose-400 ring-rose-500',
        orange: 'border-orange-500/50 bg-orange-500/10 text-orange-400 ring-orange-500',
        blue: 'border-blue-500/50 bg-blue-500/10 text-blue-400 ring-blue-500',
        purple: 'border-purple-500/50 bg-purple-500/10 text-purple-400 ring-purple-500',
        pink: 'border-pink-500/50 bg-pink-500/10 text-pink-400 ring-pink-500',
        cyan: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400 ring-cyan-500',
    };

    return (
        <div
            onClick={onClick}
            className={`cursor-pointer p-4 rounded-xl border transition-all duration-200 flex items-center gap-4
                ${active
                    ? `${theme[color]} ring-1 shadow-lg scale-[1.02]`
                    : 'border-white/5 bg-black/40 text-zinc-500 hover:bg-white/5 hover:border-white/10'
                }
            `}
        >
            <div className={`p-2.5 rounded-xl ${active ? 'bg-white/10 shadow-inner' : 'bg-black/50 border border-white/5'}`}>
                {icon}
            </div>
            <div>
                <p className={`text-sm font-black tracking-tight ${active ? 'text-white' : 'text-zinc-400'}`}>{title}</p>
                <p className="text-[10px] mt-0.5 leading-tight opacity-70 font-medium">{desc}</p>
            </div>
        </div>
    );
}