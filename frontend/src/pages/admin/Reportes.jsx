import { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { toast } from 'sonner';
import {
    FileText, Download, Trash2, Search, DollarSign, Users, Wrench,
    ChevronRight, FileSpreadsheet, TrendingUp, TrendingDown, Minus, Filter, X
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

            // 1. Guardamos el historial de reportes
            setReportes(reportesRes.data.body || reportesRes.data || []);

            // 2. Extracción segura del Dashboard (Previendo el doble "body")
            let rawStats = statsRes.data.body || statsRes.data;
            if (rawStats && rawStats.body) {
                rawStats = rawStats.body;
            }

            // 3. Forzamos la conversión a Número para evitar bugs de PostgreSQL
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
            loading: 'Extrayendo datos de la Base de Datos...',
            success: `Reporte "${formData.titulo}" generado y guardado con éxito`,
            error: (err) => err.response?.data?.error || 'Error al generar el reporte'
        });
    };

    // 3. ELIMINAR REPORTE
    const handleDelete = async (id) => {
        const isConfirmed = await confirm({
            title: '¿Eliminar Reporte?',
            description: 'El reporte será eliminado permanentemente. No podrás recuperarlo.',
            confirmText: 'Sí, eliminar',
            cancelText: 'Cancelar',
            type: 'danger'
        });

        if (isConfirmed) {
            try {
                await axios.delete(`/reportes/${id}`);
                setReportes(reportes.filter(r => r.id !== id));
                toast.success("Reporte eliminado correctamente");
            } catch (error) {
                toast.error("Error al eliminar el reporte");
            }
        }
    };

    // 4. DESCARGAR CSV REAL (Del JSONB a Excel)
    const handleDownloadCSV = (reporte) => {
        try {
            // 1. Validar que tenga contenido
            let data = reporte.contenido;

            // A veces la BD devuelve el JSON como string, lo parseamos si es necesario
            if (typeof data === 'string') {
                data = JSON.parse(data);
            }

            if (!data || !Array.isArray(data) || data.length === 0) {
                return toast.warning("El reporte no contiene datos para exportar");
            }

            // 2. Extraer los nombres de las columnas (keys)
            const headers = Object.keys(data[0]);

            // 3. Formatear a CSV (Separado por comas)
            const csvContent = [
                headers.join(','), // Fila 1: Cabeceras
                ...data.map(row =>
                    headers.map(header => {
                        // Limpiamos los datos por si tienen comas internas o son nulos
                        const cellData = row[header] === null || row[header] === undefined ? '' : row[header];
                        return `"${String(cellData).replace(/"/g, '""')}"`;
                    }).join(',')
                )
            ].join('\n');

            // 4. Forzar la descarga en el navegador
            const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); // \uFEFF soporta acentos (UTF-8)
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `${reporte.titulo.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success(`Descarga de "${reporte.titulo}" iniciada`);
        } catch (error) {
            console.error(error);
            toast.error("Error al procesar el archivo CSV");
        }
    };

    // ==========================================
    // LÓGICA DE FILTROS ACTIVOS (CHIPS)
    // ==========================================
    const activeFilters = [];
    if (searchTerm) activeFilters.push({ id: 'search', label: `Buscando: "${searchTerm}"` });
    if (activeTab !== 'todos') activeFilters.push({ id: 'tab', label: `Categoría: ${activeTab}` });

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
        const matchesTab = activeTab === 'todos' || r.tipo === activeTab;
        return matchesSearch && matchesTab;
    });

    return (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300 pb-10">

            {/* HEADER */}
            <div>
                <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                    <FileText className="text-gym-orange" size={32} />
                    Centro de Inteligencia
                </h2>
                <p className="text-gym-gray mt-1">Supervisa KPIs en tiempo real y extrae reportes gerenciales detallados.</p>
            </div>

            {/* 1. PREMIUM STAT CARDS (Con datos reales del Backend) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <PremiumStatCard
                    title="MRR (Ingresos Mes)"
                    value={kpis.income.toLocaleString()} prefix="$"
                    trend={12.5} trendText="vs mes anterior"
                    icon={<DollarSign size={20} className="text-emerald-400" />}
                    colorClass="text-emerald-400 bg-emerald-400"
                />
                <PremiumStatCard
                    title="Afluencia de Hoy"
                    value={kpis.attendance} suffix=" pax"
                    trend={0} trendText="Ingresos diarios"
                    icon={<Users size={20} className="text-blue-400" />}
                    colorClass="text-blue-400 bg-blue-400"
                />
                <PremiumStatCard
                    title="Inventario Fallido"
                    value={kpis.machinesBroken} suffix=" fallas"
                    trend={kpis.machinesBroken > 0 ? -1 : 0} trendText="Máquinas inoperativas"
                    icon={<Wrench size={20} className="text-purple-400" />}
                    colorClass="text-purple-400 bg-purple-400"
                />
            </div>

            {/* 2. GENERADORES RÁPIDOS DE REPORTES */}
            <div>
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">Herramientas de Extracción</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <GeneratorCard
                        icon={<DollarSign size={24} />} title="Balance Financiero" color="text-emerald-400" bg="bg-emerald-500/10" border="border-emerald-500/20"
                        onClick={() => { setTipoSeleccionado('finanzas'); setIsModalOpen(true); }}
                    />
                    <GeneratorCard
                        icon={<Users size={24} />} title="Métricas de Afluencia" color="text-blue-400" bg="bg-blue-500/10" border="border-blue-500/20"
                        onClick={() => { setTipoSeleccionado('asistencia'); setIsModalOpen(true); }}
                    />
                    <GeneratorCard
                        icon={<Wrench size={24} />} title="Estado de Inventario" color="text-purple-400" bg="bg-purple-500/10" border="border-purple-500/20"
                        onClick={() => { setTipoSeleccionado('inventario'); setIsModalOpen(true); }}
                    />
                </div>
            </div>

            {/* 3. HISTORIAL DE DOCUMENTOS (Con Smart Filters) */}
            <div className="bg-gym-card rounded-2xl border border-white/5 overflow-hidden shadow-2xl mt-8">

                {/* Top Bar: Buscador y Pestañas */}
                <div className="p-5 border-b border-white/5 bg-white/5 space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <FileSpreadsheet size={18} className="text-zinc-400" /> Historial de Documentos
                        </h3>

                        <div className="relative w-full md:w-72">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input
                                type="text" placeholder="Buscar por título..."
                                className="w-full bg-[#09090b] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-gym-orange outline-none transition-all placeholder-zinc-600"
                                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex overflow-x-auto gap-2 custom-scrollbar pb-1">
                        <TabButton active={activeTab === 'todos'} onClick={() => setActiveTab('todos')} label="Todos" />
                        <TabButton active={activeTab === 'finanzas'} onClick={() => setActiveTab('finanzas')} label="Finanzas" />
                        <TabButton active={activeTab === 'asistencia'} onClick={() => setActiveTab('asistencia')} label="Asistencia" />
                        <TabButton active={activeTab === 'inventario'} onClick={() => setActiveTab('inventario')} label="Inventario" />
                    </div>
                </div>

                {/* BARRA DE FILTROS ACTIVOS (CHIPS) */}
                {activeFilters.length > 0 && (
                    <div className="flex items-center gap-3 py-3 px-5 bg-black/40 border-b border-white/5 overflow-x-auto custom-scrollbar">
                        <div className="flex items-center gap-1.5 text-zinc-500 text-[10px] font-bold uppercase tracking-wider shrink-0">
                            <Filter size={12} /> Filtros activos:
                        </div>
                        <div className="flex items-center gap-2">
                            {activeFilters.map((filter) => (
                                <div key={filter.id} className="flex items-center gap-1.5 px-3 py-1 bg-gym-orange/10 border border-gym-orange/20 text-gym-orange text-xs font-medium rounded-full shrink-0 animate-in zoom-in duration-200">
                                    <span>{filter.label}</span>
                                    <button onClick={() => removeFilter(filter.id)} className="hover:bg-gym-orange/20 p-0.5 rounded-full transition-colors text-gym-orange/70 hover:text-gym-orange">
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button onClick={clearAllFilters} className="ml-auto text-xs text-zinc-500 hover:text-white underline decoration-zinc-600 hover:decoration-white underline-offset-4 transition-all shrink-0">
                            Limpiar todos
                        </button>
                    </div>
                )}

                {/* TABLA DE DATOS */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 text-zinc-500 text-xs uppercase tracking-wider bg-black/20">
                                <th className="p-4 font-bold">Documento</th>
                                <th className="p-4 font-bold">Categoría</th>
                                <th className="p-4 font-bold hidden md:table-cell">Generado el</th>
                                <th className="p-4 font-bold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                Array.from({ length: 3 }).map((_, i) => <TableSkeleton key={i} />)
                            ) : filteredReportes.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="p-12 text-center text-zinc-500">
                                        <FileText size={48} className="mx-auto mb-4 opacity-20" />
                                        <p className="text-base font-medium text-zinc-400">No se encontraron reportes</p>
                                        <p className="text-sm mt-1">Modifica los filtros o genera un documento nuevo.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredReportes.map((reporte) => (
                                    <tr key={reporte.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4 flex items-center gap-3">
                                            <div className="p-2 bg-black/40 rounded border border-white/5 text-zinc-400 group-hover:text-gym-orange transition-colors">
                                                <FileText size={16} />
                                            </div>
                                            <span className="text-sm font-bold text-white group-hover:text-gym-orange transition-colors">{reporte.titulo}</span>
                                        </td>
                                        <td className="p-4"><StatusBadge tipo={reporte.tipo} /></td>
                                        <td className="p-4 hidden md:table-cell text-sm text-zinc-400 font-medium">
                                            {new Date(reporte.fecha_generacion).toLocaleDateString('es-CL')}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleDownloadCSV(reporte)} className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:text-white bg-white/5 hover:bg-gym-orange/20 border border-white/5 hover:border-gym-orange/50 rounded-lg transition-all" title="Descargar CSV">
                                                    <Download size={14} /> <span className="hidden sm:inline">CSV</span>
                                                </button>
                                                <button onClick={() => handleDelete(reporte.id)} className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20" title="Eliminar reporte">
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
// MICRO-COMPONENTES (Limpian el archivo principal)
// ==========================================

function PremiumStatCard({ title, value, prefix = "", suffix = "", trend, trendText, icon, colorClass, progress }) {
    const isPositive = trend > 0;
    const isNeutral = trend === 0;
    const TrendIcon = isPositive ? TrendingUp : isNeutral ? Minus : TrendingDown;
    const trendColor = isPositive ? "text-emerald-400 bg-emerald-400/10" : isNeutral ? "text-zinc-400 bg-zinc-400/10" : "text-red-400 bg-red-400/10";

    return (
        <div className="bg-gym-card border border-white/5 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className={`absolute -right-6 -top-6 w-24 h-24 blur-3xl rounded-full opacity-10 pointer-events-none ${colorClass}`}></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`p-2.5 rounded-xl ${colorClass.split(' ')[0]} bg-white/5 border border-white/5`}>{icon}</div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold ${trendColor}`}>
                    <TrendIcon size={12} strokeWidth={3} />
                    {trend > 0 ? '+' : ''}{trend}%
                </div>
            </div>
            <div className="relative z-10">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{title}</h4>
                <div className="text-2xl font-black text-white">{prefix}{value}{suffix}</div>
                <p className="text-[10px] text-zinc-500 mt-1">{trendText}</p>
            </div>
        </div>
    );
}

function GeneratorCard({ icon, title, color, bg, border, onClick }) {
    return (
        <button onClick={onClick} className="p-4 rounded-xl bg-[#09090b] border border-white/5 hover:border-white/20 transition-all text-left flex items-center justify-between group shadow-lg">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${bg} ${color} ${border}`}>{icon}</div>
                <div>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Extraer</p>
                    <p className="text-sm font-bold text-white group-hover:text-gym-orange transition-colors">{title}</p>
                </div>
            </div>
            <ChevronRight size={18} className="text-zinc-600 group-hover:text-gym-orange transition-colors transform group-hover:translate-x-1" />
        </button>
    );
}

function TabButton({ active, onClick, label }) {
    return (
        <button onClick={onClick} className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${active ? 'bg-gym-orange text-white shadow-md shadow-orange-500/20' : 'bg-[#09090b] text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5'}`}>
            {label}
        </button>
    );
}

function StatusBadge({ tipo }) {
    const styles = { finanzas: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', asistencia: 'bg-blue-500/10 text-blue-400 border-blue-500/20', inventario: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
    return (
        <span className={`px-2.5 py-1 border rounded flex w-fit items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider ${styles[tipo] || styles.finanzas}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>{tipo}
        </span>
    );
}

function TableSkeleton() {
    return (
        <tr className="animate-pulse border-b border-white/5">
            <td className="p-4"><div className="h-5 bg-white/5 rounded w-3/4"></div></td>
            <td className="p-4"><div className="h-5 bg-white/5 rounded w-20"></div></td>
            <td className="p-4 hidden md:table-cell"><div className="h-4 bg-white/5 rounded w-32"></div></td>
            <td className="p-4"><div className="h-8 bg-white/5 rounded w-24 ml-auto"></div></td>
        </tr>
    );
}