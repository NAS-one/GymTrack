import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from '../../api/axios';
import { toast } from 'sonner';
import { Search, FilterX, MousePointerClick, CheckCircle2, XCircle, User, Briefcase, Dumbbell, Filter, Clock, Users, Activity, Target, Download } from 'lucide-react';

export function Asistencia() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    const [searchParams, setSearchParams] = useSearchParams();
    const hasParams = Array.from(searchParams.keys()).length > 0;
    const [hasSearched, setHasSearched] = useState(hasParams);

    const [searchTerm, setSearchTerm] = useState('');

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    const currentHour = now.getHours();

    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [selectedDay, setSelectedDay] = useState('');

    const [selectedType, setSelectedType] = useState('all');
    const [selectedHour, setSelectedHour] = useState('all');

    useEffect(() => {
        const filterType = searchParams.get('filter');
        const hourParam = searchParams.get('hour');
        const yearParam = searchParams.get('year');
        const monthParam = searchParams.get('month');

        if (filterType === 'today') {
            setSelectedYear(currentYear);
            setSelectedMonth(currentMonth);
            setSelectedDay(currentDay);
            if (hourParam) setSelectedHour(hourParam);

            setHasSearched(true);
            fetchLogs(currentYear, currentMonth, currentDay, 'all');

        } else if (yearParam && monthParam) {
            const y = parseInt(yearParam, 10);
            const m = parseInt(monthParam, 10);

            if (!isNaN(y) && !isNaN(m)) {
                setSelectedYear(y);
                setSelectedMonth(m);
                setSelectedDay('');
                setSelectedHour('all');

                setHasSearched(true);
                fetchLogs(y, m, '', 'all');
            }
        }
    }, [searchParams]);

    const fetchLogs = async (year, month, day = '', type = 'all') => {
        try {
            setLoading(true);
            setHasSearched(true);

            let query = `/acceso?year=${year}&month=${month}&type=${type}`;
            if (day) query += `&day=${day}`;

            const res = await axios.get(query);
            let data = res.data.body || res.data;
            if (data.body) data = data.body;

            setLogs(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    const handleManualFilter = () => {
        setSearchParams({});
        fetchLogs(selectedYear, selectedMonth, selectedDay, selectedType);
    };

    const clearFilters = () => {
        setLogs([]);
        setHasSearched(false);
        setSearchTerm('');
        setSelectedDay('');
        setSelectedType('all');
        setSelectedHour('all');
        setSearchParams({});
    };

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchText = log.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.rut?.toLowerCase().includes(searchTerm.toLowerCase());

            let matchHour = true;
            if (selectedHour !== 'all') {
                const logHour = new Date(log.fecha_entrada).getHours();
                matchHour = logHour === parseInt(selectedHour, 10);
            }

            let matchType = true;
            if (selectedType !== 'all') {
                matchType = log.tipo_usuario === selectedType;
            }

            return matchText && matchHour && matchType;
        });
    }, [logs, searchTerm, selectedHour, selectedType]);

    // 🌟 LÓGICA DE EXPORTACIÓN Y GUARDADO SIMULTÁNEO
    // 🌟 LÓGICA DE EXPORTACIÓN REUTILIZANDO EL ENDPOINT ORIGINAL DE REPORTES
    const handleExportAndSave = async () => {
        if (filteredLogs.length === 0) {
            return toast.warning("No hay datos en pantalla para exportar");
        }

        const toastId = toast.loading("Solicitando generación de reporte al servidor...");

        try {
            // 1. Armar el título dinámico
            const fechaString = selectedDay ? `${selectedDay}-${selectedMonth}-${selectedYear}` : `${selectedMonth}-${selectedYear}`;
            const tituloReporte = `Captura Asistencia - ${fechaString} (${new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })})`;

            // 2. Construir las fechas de inicio y fin basadas en los selectores
            // Si hay un día seleccionado, el reporte es de ese día. Si no, es de todo el mes.
            const paddedMonth = String(selectedMonth).padStart(2, '0');
            let fechaInicio, fechaFin;

            if (selectedDay) {
                const paddedDay = String(selectedDay).padStart(2, '0');
                fechaInicio = `${selectedYear}-${paddedMonth}-${paddedDay}`;
                fechaFin = `${selectedYear}-${paddedMonth}-${paddedDay}`;
            } else {
                // Primer día del mes
                fechaInicio = `${selectedYear}-${paddedMonth}-01`;
                // Último día del mes
                const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
                fechaFin = `${selectedYear}-${paddedMonth}-${lastDay}`;
            }

            // 3. Adaptar el filtro de "tipo" o "rol" al formato que espera el backend (filtroExtra)
            // Tu backend actual de reportes espera estadoAcceso y jornada.
            // Si en un futuro agregas 'rol' al reporteSchema, lo pasarías aquí.
            const formData = {
                titulo: tituloReporte,
                tipo: 'asistencia',
                fechaInicio: fechaInicio,
                fechaFin: fechaFin,
                estadoAcceso: 'todos', // Por defecto, o podrías mapearlo si agregas el filtro a la UI
                jornada: 'todos'       // Por defecto
            };

            // 4. Llamar al endpoint original de Reportes
            const response = await axios.post('/reportes', formData);
            const nuevoReporte = response.data.body || response.data;

            toast.success("Reporte generado en la Base de Datos", { id: toastId });

            // 5. (Opcional) Descargar automáticamente el archivo
            // Como el backend nos devuelve el reporte creado (con el contenido), podemos descargarlo
            if (nuevoReporte && nuevoReporte.contenido) {
                descargarCSV(nuevoReporte);
            }

        } catch (error) {
            console.error(error);
            toast.error("Error al generar el reporte en el servidor", { id: toastId });
        }
    };

    // Función auxiliar para transformar y descargar el reporte devuelto por el servidor
    const descargarCSV = (reporte) => {
        let data = reporte.contenido;
        if (typeof data === 'string') data = JSON.parse(data);
        if (!data || data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row =>
                headers.map(header => `"${String(row[header] || '').replace(/"/g, '""')}"`).join(',')
            )
        ].join('\n');

        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${reporte.titulo.replace(/\s+/g, '_')}.csv`;
        link.click();
    };

    const isTodaySelected = parseInt(selectedYear) === currentYear && parseInt(selectedMonth) === currentMonth && parseInt(selectedDay) === currentDay;
    const maxHourToShow = isTodaySelected ? currentHour : 23;
    const hours = Array.from({ length: 18 }, (_, i) => i + 6).filter(h => h <= maxHourToShow);

    const kpis = useMemo(() => {
        if (!hasSearched || logs.length === 0) return null;
        const approved = filteredLogs.filter(l => l.estado_acceso === 'aprobado').length;
        const denied = filteredLogs.length - approved;
        const approvalRate = filteredLogs.length > 0 ? Math.round((approved / filteredLogs.length) * 100) : 0;
        return { total: filteredLogs.length, approved, denied, approvalRate };
    }, [filteredLogs, hasSearched, logs]);

    const years = [2024, 2025, 2026];
    const months = [
        { v: 1, l: 'Enero' }, { v: 2, l: 'Febrero' }, { v: 3, l: 'Marzo' },
        { v: 4, l: 'Abril' }, { v: 5, l: 'Mayo' }, { v: 6, l: 'Junio' },
        { v: 7, l: 'Julio' }, { v: 8, l: 'Agosto' }, { v: 9, l: 'Septiembre' },
        { v: 10, l: 'Octubre' }, { v: 11, l: 'Noviembre' }, { v: 12, l: 'Diciembre' }
    ];

    const getTypeIcon = (type) => {
        switch (type) {
            case 'staff': return <Briefcase size={14} className="text-purple-400" />;
            case 'entrenador': return <Dumbbell size={14} className="text-orange-400" />;
            default: return <User size={14} className="text-blue-400" />;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up pb-10">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Users className="text-gym-orange" size={28} />
                        Centro de Asistencia
                    </h2>
                    <p className="text-zinc-400 font-medium mt-1">Monitoreo de flujo y control de acceso en tiempo real.</p>
                </div>

                {/* 🌟 BOTÓN DE EXPORTACIÓN */}
                {hasSearched && !loading && filteredLogs.length > 0 && (
                    <button
                        onClick={handleExportAndSave}
                        className="flex items-center gap-2 bg-white/5 hover:bg-gym-orange hover:text-white text-gym-orange border border-gym-orange/30 hover:border-gym-orange px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95"
                    >
                        <Download size={16} /> Guardar / Exportar
                    </button>
                )}
            </div>

            {hasSearched && !loading && kpis && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in zoom-in-95 duration-500">
                    <StatCardPremium title="Accesos Totales" value={kpis.total} icon={<Activity size={20} />} color="text-blue-500" bg="bg-blue-500" />
                    <StatCardPremium title="Tasa de Aprobación" value={`${kpis.approvalRate}%`} icon={<Target size={20} />} color="text-gym-orange" bg="bg-gym-orange" />
                    <StatCardPremium title="Accesos Denegados" value={kpis.denied} icon={<XCircle size={20} />} color="text-red-500" bg="bg-red-500" />
                </div>
            )}

            {/* BARRA DE HERRAMIENTAS */}
            <div className="bg-gym-card border border-white/5 p-4 rounded-2xl flex flex-col xl:flex-row gap-4 items-center shadow-xl">
                <div className="flex gap-2 w-full xl:w-auto bg-black/40 p-1.5 rounded-xl border border-white/5 shadow-inner">
                    <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} className="bg-transparent text-white text-xs font-bold px-2 py-1 outline-none cursor-pointer hover:bg-white/5 rounded transition-colors">
                        {years.map(y => <option key={y} value={y} className="text-black">{y}</option>)}
                    </select>
                    <div className="w-px bg-white/10 my-1"></div>
                    <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="bg-transparent text-white text-xs font-bold px-2 py-1 outline-none cursor-pointer hover:bg-white/5 rounded transition-colors">
                        {months.map(m => <option key={m.v} value={m.v} className="text-black">{m.l}</option>)}
                    </select>
                    <div className="w-px bg-white/10 my-1"></div>
                    <input type="number" placeholder="Día" min="1" max="31" value={selectedDay} onChange={e => setSelectedDay(e.target.value)} className="bg-transparent text-white text-xs px-2 py-1 w-14 outline-none placeholder:text-zinc-600 text-center hover:bg-white/5 rounded transition-colors" />
                </div>

                <button onClick={handleManualFilter} className="w-full xl:w-auto bg-gym-orange hover:bg-orange-500 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] border border-gym-orange/50 active:scale-95">
                    Extraer Datos
                </button>

                <div className="w-px h-8 bg-white/10 hidden xl:block"></div>

                <div className="flex w-full xl:w-auto gap-3">
                    <div className="flex-1 flex items-center gap-2 bg-black/40 border border-white/5 p-1.5 rounded-xl shadow-inner">
                        <Filter size={14} className="text-zinc-400 ml-2" />
                        <select value={selectedType} onChange={e => setSelectedType(e.target.value)} disabled={!hasSearched} className="bg-transparent text-white text-xs font-bold tracking-wider px-2 py-1 outline-none cursor-pointer rounded uppercase w-full disabled:opacity-50">
                            <option value="all" className="text-black">Rol: Todos</option>
                            <option value="cliente" className="text-black">Clientes</option>
                            <option value="staff" className="text-black">Staff</option>
                            <option value="entrenador" className="text-black">Entrenadores</option>
                        </select>
                    </div>

                    <div className="flex-1 flex items-center gap-2 bg-black/40 border border-white/5 p-1.5 rounded-xl shadow-inner">
                        <Clock size={14} className="text-zinc-400 ml-2" />
                        <select value={selectedHour} onChange={e => setSelectedHour(e.target.value)} disabled={!hasSearched} className="bg-transparent text-white text-xs font-bold tracking-wider px-2 py-1 outline-none cursor-pointer rounded uppercase w-full disabled:opacity-50">
                            <option value="all" className="text-black">Hora: Todas</option>
                            {hours.map(h => <option key={h} value={h} className="text-black">{h}:00 hrs</option>)}
                        </select>
                    </div>
                </div>

                <div className="w-px h-8 bg-white/10 hidden xl:block"></div>

                <div className="relative flex-1 w-full">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                        type="text" placeholder="Filtrar por Nombre o RUT..."
                        className="w-full bg-black/40 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-white text-xs font-medium focus:border-gym-orange outline-none transition-all shadow-inner placeholder:text-zinc-600 disabled:opacity-50"
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        disabled={!hasSearched}
                    />
                </div>

                {hasSearched && (
                    <button onClick={clearFilters} className="p-2.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20" title="Limpiar y Reiniciar">
                        <FilterX size={18} />
                    </button>
                )}
            </div>

            {!hasSearched && !loading && (
                <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01] animate-in zoom-in-95">
                    <div className="p-6 rounded-full bg-white/5 mb-5 shadow-xl">
                        <MousePointerClick size={40} className="text-zinc-600" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-lg font-bold text-white tracking-tight mb-2">Esperando parámetros</h3>
                    <p className="text-zinc-500 max-w-sm text-sm font-medium">Extrae los datos usando la barra superior para visualizar el historial.</p>
                </div>
            )}

            {hasSearched && (
                <div className="bg-gym-card border border-white/5 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-black/40 text-zinc-500 text-[10px] uppercase font-black tracking-widest border-b border-white/5">
                                <tr>
                                    <th className="p-5">Ingreso</th>
                                    <th className="p-5">Identidad</th>
                                    <th className="p-5 text-center">Clasificación</th>
                                    <th className="p-5 text-right">Resolución</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => <TableSkeleton key={i} />)
                                ) : filteredLogs.length === 0 ? (
                                    <tr><td colSpan="4" className="p-16 text-center text-zinc-500 font-medium border-2 border-dashed border-white/5 bg-black/20 m-4 rounded-xl">No hay accesos bajo estos parámetros.</td></tr>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="p-5">
                                                <p className="text-white font-mono font-bold tracking-wider text-sm">{new Date(log.fecha_entrada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                <p className="text-zinc-500 text-[10px] font-bold uppercase mt-0.5">{new Date(log.fecha_entrada).toLocaleDateString()}</p>
                                            </td>
                                            <td className="p-5">
                                                <p className="text-white font-bold tracking-tight">{log.nombre}</p>
                                                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{log.rut}</p>
                                            </td>
                                            <td className="p-5 text-center">
                                                <button onClick={() => setSelectedType(log.tipo_usuario)} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] uppercase font-black tracking-widest border hover:scale-105 transition-transform cursor-pointer
                                                    ${log.tipo_usuario === 'cliente' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20' :
                                                        log.tipo_usuario === 'entrenador' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20' :
                                                            'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20'}`}>
                                                    {getTypeIcon(log.tipo_usuario)} {log.tipo_usuario}
                                                </button>
                                            </td>
                                            <td className="p-5 text-right">
                                                {log.estado_acceso === 'aprobado'
                                                    ? <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-black tracking-wider border border-emerald-500/20"><CheckCircle2 size={12} strokeWidth={3} /> ACCESO OTORGADO</span>
                                                    : <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-[10px] font-black tracking-wider border border-red-500/20"><XCircle size={12} strokeWidth={3} /> BLOQUEADO</span>
                                                }
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCardPremium({ title, value, icon, color, bg }) {
    return (
        <div className="bg-gym-card border border-white/5 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
            <div className={`absolute -right-6 -top-6 w-24 h-24 blur-3xl rounded-full opacity-10 pointer-events-none ${bg}`}></div>
            <div className="flex items-center gap-4 relative z-10">
                <div className={`p-3 rounded-xl bg-white/5 border border-white/10 ${color}`}>{icon}</div>
                <div>
                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.15em] mb-1">{title}</h4>
                    <div className="text-2xl font-black text-white tracking-tight">{value}</div>
                </div>
            </div>
        </div>
    );
}

function TableSkeleton() {
    return (
        <tr className="animate-pulse border-b border-white/5">
            <td className="p-5"><div className="h-6 bg-white/5 rounded w-20 mb-2"></div><div className="h-3 bg-white/5 rounded w-16"></div></td>
            <td className="p-5"><div className="h-5 bg-white/5 rounded w-32 mb-2"></div><div className="h-3 bg-white/5 rounded w-24"></div></td>
            <td className="p-5 text-center"><div className="h-6 bg-white/5 rounded w-20 mx-auto"></div></td>
            <td className="p-5 text-right"><div className="h-8 bg-white/5 rounded-lg w-28 ml-auto"></div></td>
        </tr>
    );
}