import { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { toast } from 'sonner';
import {
    FileText, Download, Trash2, Search, DollarSign, Users, Wrench,
    ChevronRight, FileSpreadsheet, TrendingUp, TrendingDown, Minus, Filter, X, UserCheck, Tags, Briefcase, Activity
} from 'lucide-react';
import { useConfirm } from '../../contexts/ConfirmContext';
import { GenerateReportModal } from '../../components/admin/Reportes/GenerateReportModal';

export function Reportes() {
    const confirm = useConfirm();

    // Estados de Datos Reales
    const [reportes, setReportes] = useState([]);
    const [kpis, setKpis] = useState({ income: 0, attendance: 0, machinesBroken: 0 });
    const [loading, setLoading] = useState(true);

    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('todos');

    // Estados del Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [tipoSeleccionado, setTipoSeleccionado] = useState('finanzas');

    useEffect(() => {
        fetchData();
    }, []);

    // 1. CARGA DE DATOS REALES (Historial + KPIs)
    const fetchData = async () => {
        try {
            setLoading(true);

            const [reportesRes, statsRes] = await Promise.all([
                axios.get('/reportes'),
                axios.get('/dashboard/summary')
            ]);

            setReportes(reportesRes.data.body || reportesRes.data || []);

            let rawStats = statsRes.data.body || statsRes.data;
            if (rawStats && rawStats.body) {
                rawStats = rawStats.body;
            }

            const dataKpi = rawStats?.kpi || {};

            setKpis({
                income: Number(dataKpi.income || dataKpi.monthlyRevenue || 0),
                attendance: Number(dataKpi.todayAttendance || 0),
                machinesBroken: Number(dataKpi.machinesBroken || dataKpi.machinesMaintenance || 0)
            });

        } catch (error) {
            console.error("Error detallado al cargar KPIs:", error);
            toast.error("Error al cargar las estadísticas superiores");
        } finally {
            setLoading(false);
        }
    };

    // 2. GENERAR NUEVO REPORTE EN LA BD
    const handleGenerate = async (formData) => {
        const generationPromise = axios.post('/reportes', formData).then((res) => {
            fetchData(); // Recargamos la tabla al terminar
            return res.data.body;
        });

        toast.promise(generationPromise, {
            loading: 'Generando inteligencia de datos...',
            success: `Reporte "${formData.titulo}" archivado con éxito`,
            error: (err) => err.response?.data?.error || 'Error al generar el documento'
        });
    };

    // 3. ELIMINAR REPORTE
    const handleDelete = async (id) => {
        const isConfirmed = await confirm({
            title: '¿Destruir Documento?',
            description: 'El reporte será eliminado permanentemente del historial gerencial.',
            confirmText: 'Sí, destruir',
            cancelText: 'Cancelar',
            type: 'danger'
        });

        if (isConfirmed) {
            try {
                await axios.delete(`/reportes/${id}`);
                setReportes(reportes.filter(r => r.id !== id));
                toast.success("Documento destruido correctamente");
            } catch (error) {
                toast.error("Error de acceso al eliminar");
            }
        }
    };

    // 4. DESCARGAR CSV REAL
    const handleDownloadCSV = (reporte) => {
        try {
            let data = reporte.contenido;

            if (typeof data === 'string') data = JSON.parse(data);

            if (!data || !Array.isArray(data) || data.length === 0) {
                return toast.warning("El reporte está vacío");
            }

            const headers = Object.keys(data[0]);

            const csvContent = [
                headers.join(','),
                ...data.map(row =>
                    headers.map(header => {
                        const cellData = row[header] === null || row[header] === undefined ? '' : row[header];
                        return `"${String(cellData).replace(/"/g, '""')}"`;
                    }).join(',')
                )
            ].join('\n');

            const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `${reporte.titulo.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success(`Exportación de "${reporte.titulo}" completada`);
        } catch (error) {
            console.error(error);
            toast.error("Error de codificación en el archivo CSV");
        }
    };

    // ==========================================
    // LÓGICA DE FILTROS ACTIVOS (CHIPS)
    // ==========================================
    const activeFilters = [];
    if (searchTerm) activeFilters.push({ id: 'search', label: `Buscando: "${searchTerm}"` });
    if (activeTab !== 'todos') activeFilters.push({ id: 'tab', label: `Módulo: ${activeTab}` });

    const removeFilter = (id) => {
        if (id === 'search') setSearchTerm('');
        if (id === 'tab') setActiveTab('todos');
    };

    const clearAllFilters = () => {
        setSearchTerm('');
        setActiveTab('todos');
    };

    const filteredReportes = reportes.filter(r => {
        const matchesSearch = r.titulo.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTab = activeTab === 'todos' || r.tipo === activeTab || (activeTab === 'comunidad' && r.tipo === 'clientes') || (activeTab === 'staff' && r.tipo === 'entrenadores');
        return matchesSearch && matchesTab;
    });

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300 pb-10">

            {/* HEADER */}
            <div>
                <h2 className="text-4xl font-black text-white tracking-tighter flex items-center gap-3">
                    <div className="p-2.5 bg-gym-orange/10 rounded-xl border border-gym-orange/20 shadow-inner">
                        <FileText className="text-gym-orange" size={28} />
                    </div>
                    Centro de Inteligencia
                </h2>
                <p className="text-zinc-400 mt-2 font-medium">Motor de extracción de datos y supervisión de KPIs en tiempo real.</p>
            </div>

            {/* 1. PREMIUM STAT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <PremiumStatCard
                    title="MRR (Ingresos Mes)"
                    value={kpis.income.toLocaleString()} prefix="$"
                    trend={12.5} trendText="vs mes anterior"
                    icon={<DollarSign size={20} className="text-emerald-400" />}
                    glowColor="bg-emerald-500"
                    trendColor="text-emerald-400 bg-emerald-400/10"
                    iconBg="bg-emerald-500/10 border-emerald-500/20"
                />
                <PremiumStatCard
                    title="Afluencia de Hoy"
                    value={kpis.attendance} suffix=" pases"
                    trend={0} trendText="Ingresos diarios"
                    icon={<Users size={20} className="text-blue-400" />}
                    glowColor="bg-blue-500"
                    trendColor="text-blue-400 bg-blue-400/10"
                    iconBg="bg-blue-500/10 border-blue-500/20"
                />
                <PremiumStatCard
                    title="Inventario Fallido"
                    value={kpis.machinesBroken} suffix=" fallas"
                    trend={kpis.machinesBroken > 0 ? -1 : 0} trendText="Máquinas inoperativas"
                    icon={<Wrench size={20} className="text-purple-400" />}
                    glowColor="bg-purple-500"
                    trendColor="text-rose-400 bg-rose-400/10"
                    iconBg="bg-purple-500/10 border-purple-500/20"
                />
            </div>

            {/* 2. GENERADORES RÁPIDOS DE REPORTES (Ahora 6 Módulos) */}
            <div>
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Filter size={14} /> Módulos de Extracción de Datos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    <GeneratorCard
                        icon={<DollarSign size={24} />} title="Balance Financiero" desc="Ingresos y medios de pago"
                        textColor="text-emerald-400" iconBg="bg-emerald-500/10 border-emerald-500/20" hoverGlow="to-emerald-500/10"
                        onClick={() => { setTipoSeleccionado('finanzas'); setIsModalOpen(true); }}
                    />
                    <GeneratorCard
                        icon={<Activity size={24} />} title="Métricas de Afluencia" desc="Accesos y bloques horarios"
                        textColor="text-blue-400" iconBg="bg-blue-500/10 border-blue-500/20" hoverGlow="to-blue-500/10"
                        onClick={() => { setTipoSeleccionado('asistencia'); setIsModalOpen(true); }}
                    />
                    <GeneratorCard
                        icon={<UserCheck size={24} />} title="Directorio Comunidad" desc="Vigencia y riesgo de fuga"
                        textColor="text-orange-400" iconBg="bg-orange-500/10 border-orange-500/20" hoverGlow="to-orange-500/10"
                        onClick={() => { setTipoSeleccionado('clientes'); setIsModalOpen(true); }}
                    />
                    <GeneratorCard
                        icon={<Wrench size={24} />} title="Estado de Inventario" desc="Maquinaria y mantenciones"
                        textColor="text-purple-400" iconBg="bg-purple-500/10 border-purple-500/20" hoverGlow="to-purple-500/10"
                        onClick={() => { setTipoSeleccionado('inventario'); setIsModalOpen(true); }}
                    />
                    <GeneratorCard
                        icon={<Tags size={24} />} title="Rendimiento de Planes" desc="Membresías más vendidas"
                        textColor="text-pink-400" iconBg="bg-pink-500/10 border-pink-500/20" hoverGlow="to-pink-500/10"
                        onClick={() => { setTipoSeleccionado('planes'); setIsModalOpen(true); }}
                    />
                    <GeneratorCard
                        icon={<Briefcase size={24} />} title="Eficiencia de Staff" desc="Carga de clientes y retención"
                        textColor="text-cyan-400" iconBg="bg-cyan-500/10 border-cyan-500/20" hoverGlow="to-cyan-500/10"
                        onClick={() => { setTipoSeleccionado('entrenadores'); setIsModalOpen(true); }}
                    />
                </div>
            </div>

            {/* 3. HISTORIAL DE DOCUMENTOS */}
            <div className="bg-[#0c0c0e] rounded-3xl border border-white/5 overflow-hidden shadow-2xl mt-8">

                {/* Top Bar: Buscador y Pestañas */}
                <div className="p-6 border-b border-white/5 bg-black/20 space-y-5">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h3 className="text-xl font-black text-white flex items-center gap-2 tracking-tight">
                            <FileSpreadsheet size={20} className="text-gym-orange" /> Bóveda de Documentos
                        </h3>

                        <div className="relative w-full md:w-80 group">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-gym-orange transition-colors" />
                            <input
                                type="text" placeholder="Rastrear por título de reporte..."
                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm font-bold text-white focus:border-gym-orange outline-none transition-all placeholder-zinc-600 shadow-inner"
                                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex overflow-x-auto gap-2 custom-scrollbar pb-2">
                        <TabButton active={activeTab === 'todos'} onClick={() => setActiveTab('todos')} label="Todos" />
                        <TabButton active={activeTab === 'finanzas'} onClick={() => setActiveTab('finanzas')} label="Finanzas" />
                        <TabButton active={activeTab === 'asistencia'} onClick={() => setActiveTab('asistencia')} label="Asistencia" />
                        <TabButton active={activeTab === 'comunidad'} onClick={() => setActiveTab('comunidad')} label="Comunidad" />
                        <TabButton active={activeTab === 'inventario'} onClick={() => setActiveTab('inventario')} label="Inventario" />
                        <TabButton active={activeTab === 'planes'} onClick={() => setActiveTab('planes')} label="Planes" />
                        <TabButton active={activeTab === 'staff'} onClick={() => setActiveTab('staff')} label="Staff" />
                    </div>
                </div>

                {/* BARRA DE FILTROS ACTIVOS */}
                {activeFilters.length > 0 && (
                    <div className="flex items-center gap-3 py-3 px-6 bg-gym-orange/5 border-b border-white/5 overflow-x-auto custom-scrollbar">
                        <div className="flex items-center gap-1.5 text-gym-orange text-[10px] font-black uppercase tracking-widest shrink-0">
                            <Filter size={12} /> Filtros:
                        </div>
                        <div className="flex items-center gap-2">
                            {activeFilters.map((filter) => (
                                <div key={filter.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-gym-orange border border-gym-orange/50 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg shrink-0 animate-in zoom-in duration-200 shadow-lg shadow-orange-500/20">
                                    <span>{filter.label}</span>
                                    <button onClick={() => removeFilter(filter.id)} className="hover:bg-white/20 p-0.5 rounded transition-colors text-white/70 hover:text-white">
                                        <X size={12} strokeWidth={3} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button onClick={clearAllFilters} className="ml-auto text-[10px] uppercase font-bold tracking-wider text-zinc-500 hover:text-white transition-all shrink-0">
                            Borrar Búsqueda
                        </button>
                    </div>
                )}

                {/* TABLA DE DATOS */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 text-zinc-500 text-[10px] uppercase font-black tracking-widest bg-black/40">
                                <th className="p-5 pl-6 whitespace-nowrap">Nombre del Documento</th>
                                <th className="p-5 whitespace-nowrap">Módulo Origen</th>
                                <th className="p-5 hidden md:table-cell whitespace-nowrap">Fecha Extracción</th>
                                <th className="p-5 text-right pr-6 whitespace-nowrap">Controles</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => <TableSkeleton key={i} />)
                            ) : filteredReportes.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-16 text-center text-zinc-500">
                                        <div className="w-20 h-20 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-4 border border-white/10 shadow-inner">
                                            <FileText size={32} className="opacity-40" />
                                        </div>
                                        <p className="text-xl font-black text-white tracking-tight">Bóveda Vacía</p>
                                        <p className="text-xs font-medium text-zinc-500 mt-2 max-w-sm mx-auto">Aún no hay documentos en este módulo. Usa las herramientas superiores para generar un nuevo reporte.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredReportes.map((reporte) => (
                                    <tr key={reporte.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-5 pl-6 flex items-center gap-4">
                                            <div className="p-2.5 bg-black/40 rounded-xl border border-white/5 text-zinc-400 group-hover:text-gym-orange transition-colors shadow-inner">
                                                <FileText size={18} />
                                            </div>
                                            <span className="text-sm font-bold text-white group-hover:text-gym-orange transition-colors line-clamp-1">{reporte.titulo}</span>
                                        </td>
                                        <td className="p-5"><StatusBadge tipo={reporte.tipo} /></td>
                                        <td className="p-5 hidden md:table-cell text-xs text-zinc-400 font-mono font-medium">
                                            {new Date(reporte.fecha_generacion).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })} hrs
                                        </td>
                                        <td className="p-5 text-right pr-6">
                                            <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                                                <button onClick={() => handleDownloadCSV(reporte)} className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider text-emerald-400 hover:text-white bg-emerald-500/10 hover:bg-emerald-500 rounded-xl transition-all border border-emerald-500/20" title="Descargar CSV">
                                                    <Download size={14} strokeWidth={3} /> <span className="hidden sm:inline">Exportar</span>
                                                </button>
                                                <button onClick={() => handleDelete(reporte.id)} className="p-2 text-zinc-500 hover:text-white hover:bg-rose-500 rounded-xl transition-all border border-transparent hover:border-rose-500" title="Eliminar reporte">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <GenerateReportModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                tipoReporte={tipoSeleccionado}
                onGenerate={handleGenerate}
            />
        </div>
    );
}

// ==========================================
// MICRO-COMPONENTES
// ==========================================

function PremiumStatCard({ title, value, prefix = "", suffix = "", trend, trendText, icon, glowColor, trendColor, iconBg }) {
    const isNeutral = trend === 0;
    const TrendIcon = trend > 0 ? TrendingUp : isNeutral ? Minus : TrendingDown;

    return (
        <div className="bg-[#0c0c0e] border border-white/5 rounded-[2rem] p-6 shadow-xl relative overflow-hidden group hover:border-white/10 transition-all hover:shadow-2xl">
            <div className={`absolute -right-6 -top-6 w-32 h-32 blur-[50px] rounded-full opacity-10 pointer-events-none transition-opacity group-hover:opacity-20 ${glowColor}`}></div>
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className={`p-3 rounded-2xl border shadow-inner ${iconBg}`}>{icon}</div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-current/10 ${trendColor}`}>
                    <TrendIcon size={12} strokeWidth={3} />
                    {trend > 0 ? '+' : ''}{trend}%
                </div>
            </div>
            <div className="relative z-10">
                <h4 className="text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">{title}</h4>
                <div className="text-3xl font-black text-white tracking-tighter">{prefix}{value}{suffix}</div>
                <p className="text-[10px] font-bold text-zinc-600 mt-2 uppercase tracking-wider">{trendText}</p>
            </div>
        </div>
    );
}

function GeneratorCard({ icon, title, desc, textColor, iconBg, hoverGlow, onClick }) {
    return (
        <button onClick={onClick} className="p-5 rounded-[1.5rem] bg-[#0c0c0e] border border-white/5 hover:border-white/20 transition-all text-left flex items-center justify-between group shadow-lg hover:shadow-2xl relative overflow-hidden">
            {/* Fondo gradiente seguro para Tailwind (inyectando la clase explícita enviada por hoverGlow) */}
            <div className={`absolute inset-0 bg-gradient-to-r from-transparent ${hoverGlow} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
            <div className="flex items-center gap-4 relative z-10">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner ${textColor} ${iconBg}`}>{icon}</div>
                <div>
                    <p className="text-sm font-black text-white group-hover:text-gym-orange transition-colors tracking-tight">{title}</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5 line-clamp-1">{desc}</p>
                </div>
            </div>
            <ChevronRight size={20} className="text-zinc-600 group-hover:text-gym-orange transition-colors transform group-hover:translate-x-1 relative z-10" strokeWidth={3} />
        </button>
    );
}

function TabButton({ active, onClick, label }) {
    return (
        <button onClick={onClick} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border ${active ? 'bg-gym-orange text-white border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.3)]' : 'bg-black/40 text-zinc-500 hover:text-white hover:bg-white/5 border-white/5 shadow-inner'}`}>
            {label}
        </button>
    );
}

function StatusBadge({ tipo }) {
    const styles = {
        finanzas: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        asistencia: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        inventario: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        clientes: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        comunidad: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
        planes: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
        entrenadores: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        staff: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
    };

    const labelMap = { clientes: 'Comunidad', entrenadores: 'Staff Operativo' };

    return (
        <span className={`px-3 py-1.5 border rounded-lg flex w-fit items-center gap-2 text-[9px] uppercase font-black tracking-widest shadow-inner ${styles[tipo] || styles.finanzas}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_5px_currentColor]"></span>
            {labelMap[tipo] || tipo}
        </span>
    );
}

function TableSkeleton() {
    return (
        <tr className="animate-pulse border-b border-white/5 bg-white/[0.01]">
            <td className="p-5 pl-6"><div className="h-5 bg-white/5 rounded-lg w-3/4"></div></td>
            <td className="p-5"><div className="h-6 bg-white/5 rounded-lg w-24"></div></td>
            <td className="p-5 hidden md:table-cell"><div className="h-4 bg-white/5 rounded-lg w-32"></div></td>
            <td className="p-5 pr-6"><div className="h-8 bg-white/5 rounded-xl w-24 ml-auto"></div></td>
        </tr>
    );
}