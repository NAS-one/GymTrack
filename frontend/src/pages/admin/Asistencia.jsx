import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from '../../api/axios';
import { Search, FilterX, MousePointerClick, CheckCircle2, XCircle, User, Briefcase, Dumbbell, Filter } from 'lucide-react';

export function Asistencia() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const [searchParams, setSearchParams] = useSearchParams();
    const [searchTerm, setSearchTerm] = useState('');

    // --- FILTROS DE FECHA ---
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedDay, setSelectedDay] = useState('');

    // --- NUEVO FILTRO DE ROL (AQUÍ ESTABA FALTANDO VISIBILIDAD) ---
    const [selectedType, setSelectedType] = useState('all'); // 'all', 'cliente', 'staff', 'entrenador'

    useEffect(() => {
        const filterType = searchParams.get('filter');
        if (filterType === 'today') {
            const now = new Date();
            setSelectedYear(now.getFullYear());
            setSelectedMonth(now.getMonth() + 1);
            setSelectedDay(now.getDate());
            fetchLogs(now.getFullYear(), now.getMonth() + 1, now.getDate(), 'all');
        }
    }, [searchParams]);

    const fetchLogs = async (year, month, day = '', type = 'all') => {
        try {
            setLoading(true);
            setHasSearched(true);

            // Enviamos el parámetro 'type' al backend
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

    // Botón Consultar
    const handleManualFilter = () => {
        fetchLogs(selectedYear, selectedMonth, selectedDay, selectedType);
    };

    const clearFilters = () => {
        setLogs([]);
        setHasSearched(false);
        setSearchTerm('');
        setSelectedDay('');
        setSelectedType('all');
        setSearchParams({});
    };

    // Filtrado local por texto (Nombre/RUT)
    const filteredLogs = logs.filter(log =>
        log.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.rut?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Datos para selects
    const years = [2024, 2025, 2026];
    const months = [
        { v: 1, l: 'Enero' }, { v: 2, l: 'Febrero' }, { v: 3, l: 'Marzo' },
        { v: 4, l: 'Abril' }, { v: 5, l: 'Mayo' }, { v: 6, l: 'Junio' },
        { v: 7, l: 'Julio' }, { v: 8, l: 'Agosto' }, { v: 9, l: 'Septiembre' },
        { v: 10, l: 'Octubre' }, { v: 11, l: 'Noviembre' }, { v: 12, l: 'Diciembre' }
    ];

    // Iconos según tipo
    const getTypeIcon = (type) => {
        switch (type) {
            case 'staff': return <Briefcase size={14} className="text-purple-400" />;
            case 'entrenador': return <Dumbbell size={14} className="text-orange-400" />;
            default: return <User size={14} className="text-blue-400" />;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up pb-10">

            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">Historial de Accesos</h2>
                    <p className="text-gym-gray">Control de asistencia unificado.</p>
                </div>
            </div>

            {/* BARRA DE HERRAMIENTAS (REDDISEÑADA PARA VISIBILIDAD) */}
            <div className="bg-gym-card border border-white/10 p-4 rounded-xl flex flex-col lg:flex-row gap-4 items-center">

                {/* BLOQUE 1: FECHAS */}
                <div className="flex gap-2 w-full lg:w-auto bg-black/20 p-1 rounded-lg border border-white/5">
                    <select
                        value={selectedYear}
                        onChange={e => setSelectedYear(e.target.value)}
                        className="bg-transparent text-white text-sm font-bold px-3 py-2 outline-none cursor-pointer hover:bg-white/5 rounded"
                    >
                        {years.map(y => <option key={y} value={y} className="text-black">{y}</option>)}
                    </select>

                    <div className="w-px bg-white/10"></div>

                    <select
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(e.target.value)}
                        className="bg-transparent text-white text-sm font-bold px-3 py-2 outline-none cursor-pointer hover:bg-white/5 rounded"
                    >
                        {months.map(m => <option key={m.v} value={m.v} className="text-black">{m.l}</option>)}
                    </select>

                    <div className="w-px bg-white/10"></div>

                    <input
                        type="number"
                        placeholder="Día"
                        min="1" max="31"
                        value={selectedDay}
                        onChange={e => setSelectedDay(e.target.value)}
                        className="bg-transparent text-white text-sm px-3 py-2 w-16 outline-none placeholder:text-zinc-600 text-center"
                    />
                </div>

                {/* BLOQUE 2: FILTRO DE TIPO (DESTACADO) */}
                <div className="flex items-center gap-2 bg-gym-orange/10 border border-gym-orange/30 p-1 rounded-lg">
                    <Filter size={16} className="text-gym-orange ml-2" />
                    <select
                        value={selectedType}
                        onChange={e => setSelectedType(e.target.value)}
                        className="bg-transparent text-gym-orange text-sm font-bold px-3 py-2 outline-none cursor-pointer rounded uppercase"
                    >
                        <option value="all" className="text-black">Todos</option>
                        <option value="cliente" className="text-black">Clientes</option>
                        <option value="staff" className="text-black">Staff</option>
                        <option value="entrenador" className="text-black">Entrenadores</option>
                    </select>
                </div>

                <button
                    onClick={handleManualFilter}
                    className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg font-bold text-sm transition-all shadow border border-white/5"
                >
                    Buscar
                </button>

                <div className="w-px h-8 bg-white/10 hidden lg:block"></div>

                {/* BLOQUE 3: BUSCADOR TEXTO */}
                <div className="relative flex-1 w-full">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gym-gray" />
                    <input
                        type="text" placeholder="Filtrar por nombre o RUT..."
                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:border-gym-orange outline-none transition-colors"
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        disabled={!hasSearched}
                    />
                </div>

                {hasSearched && (
                    <button onClick={clearFilters} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Limpiar todo">
                        <FilterX size={20} />
                    </button>
                )}
            </div>

            {/* ESTADO INICIAL VACÍO */}
            {!hasSearched && !loading && (
                <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-white/5 rounded-2xl bg-white/[0.02]">
                    <div className="p-6 rounded-full bg-white/5 mb-4">
                        <MousePointerClick size={48} className="text-gym-orange opacity-80" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Define tu búsqueda</h3>
                    <p className="text-zinc-500 max-w-sm">
                        Selecciona Fecha y Tipo de Usuario para ver los registros.
                    </p>
                </div>
            )}

            {/* TABLA DE RESULTADOS */}
            {hasSearched && (
                <div className="bg-gym-card border border-white/10 rounded-2xl overflow-hidden shadow-xl animate-fade-in">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-white/5 text-gym-gray uppercase text-xs font-bold tracking-wider">
                                <tr>
                                    <th className="p-4 border-b border-white/5">Hora</th>
                                    <th className="p-4 border-b border-white/5">Fecha</th>
                                    <th className="p-4 border-b border-white/5">Usuario</th>
                                    <th className="p-4 border-b border-white/5 text-center">Rol</th>
                                    <th className="p-4 border-b border-white/5 text-right">Acceso</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr><td colSpan="5" className="p-12 text-center text-gym-gray">Cargando registros...</td></tr>
                                ) : filteredLogs.length === 0 ? (
                                    <tr><td colSpan="5" className="p-12 text-center text-zinc-500">No se encontraron accesos con estos filtros.</td></tr>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4 text-white font-mono whitespace-nowrap">
                                                {new Date(log.fecha_entrada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </td>
                                            <td className="p-4 text-zinc-400 whitespace-nowrap">
                                                {new Date(log.fecha_entrada).toLocaleDateString()}
                                            </td>
                                            <td className="p-4">
                                                <p className="text-white font-medium">{log.nombre}</p>
                                                <p className="text-xs text-gym-gray font-mono">{log.rut}</p>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${log.tipo_usuario === 'cliente' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                                    log.tipo_usuario === 'entrenador' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                                        'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                    }`}>
                                                    {getTypeIcon(log.tipo_usuario)} {log.tipo_usuario}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                {log.estado_acceso === 'aprobado'
                                                    ? <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20"><CheckCircle2 size={12} /> APROBADO</span>
                                                    : <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20"><XCircle size={12} /> DENEGADO</span>
                                                }
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {!loading && filteredLogs.length > 0 && (
                        <div className="p-4 border-t border-white/5 bg-white/5 text-xs text-zinc-400 flex justify-between">
                            <span>Viendo {filteredLogs.length} registros</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}