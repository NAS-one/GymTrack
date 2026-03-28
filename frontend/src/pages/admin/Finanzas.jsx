import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from '../../api/axios';
import { toast } from 'sonner';
import { Search, Download, Calendar, DollarSign, CreditCard, Wallet, FilterX, Activity, FileSpreadsheet, Landmark, TrendingUp, Files } from 'lucide-react';

export function Finanzas() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();

    // Filtros Locales
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('all');

    // Fechas de Filtro
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    //  MOTOR DE REDIRECCIÓN    
    useEffect(() => {
        const yearParam = searchParams.get('year');
        const monthParam = searchParams.get('month');

        if (yearParam && monthParam) {
            const y = parseInt(yearParam, 10);
            const m = parseInt(monthParam, 10);

            if (!isNaN(y) && !isNaN(m)) {
                const paddedMonth = String(m).padStart(2, '0');
                const lastDay = new Date(y, m, 0).getDate();

                setDateStart(`${y}-${paddedMonth}-01`);
                setDateEnd(`${y}-${paddedMonth}-${lastDay}`);
            }
        }
    }, [searchParams]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/pagos');
            let data = res.data.body || res.data;
            if (data.body) data = data.body;

            setTransactions(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error cargando finanzas:", error);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    // --- LÓGICA DE FILTRADO FLUIDO ---
    const filteredData = useMemo(() => {
        return transactions.filter(t => {
            const term = searchTerm.toLowerCase();
            const matchesSearch =
                (t.nombre_cliente || '').toLowerCase().includes(term) ||
                (t.rut_cliente || '').toLowerCase().includes(term) ||
                (t.nombre_plan || '').toLowerCase().includes(term);

            const matchesMethod = paymentMethod === 'all' || t.metodo_pago === paymentMethod;

            let matchesDate = true;
            if (t.fecha_pago) {
                const tDate = new Date(t.fecha_pago).setHours(0, 0, 0, 0);
                if (dateStart) matchesDate = matchesDate && tDate >= new Date(`${dateStart}T00:00:00`).setHours(0, 0, 0, 0);
                if (dateEnd) matchesDate = matchesDate && tDate <= new Date(`${dateEnd}T23:59:59`).setHours(0, 0, 0, 0);
            }

            return matchesSearch && matchesMethod && matchesDate;
        });
    }, [transactions, searchTerm, paymentMethod, dateStart, dateEnd]);

    // --- NUEVOS KPIS JERÁRQUICOS ---
    const totalIncome = useMemo(() => filteredData.reduce((acc, t) => acc + (parseInt(t.monto) || 0), 0), [filteredData]);
    const countTx = filteredData.length;

    // Desglose Exacto
    const cashIncome = useMemo(() => filteredData.filter(t => t.metodo_pago === 'Efectivo').reduce((acc, t) => acc + (parseInt(t.monto) || 0), 0), [filteredData]);
    const cardIncome = useMemo(() => filteredData.filter(t => t.metodo_pago === 'Tarjeta').reduce((acc, t) => acc + (parseInt(t.monto) || 0), 0), [filteredData]);
    const transferIncome = useMemo(() => filteredData.filter(t => t.metodo_pago === 'Transferencia').reduce((acc, t) => acc + (parseInt(t.monto) || 0), 0), [filteredData]);

    //  MOTOR DE EXPORTACIÓN Y ARCHIVADO
    const handleExportAndSave = async () => {
        if (filteredData.length === 0) {
            return toast.warning("No hay datos en pantalla para exportar");
        }

        const toastId = toast.loading("Generando documento financiero...");

        try {
            let periodoTexto = "Histórico";
            if (dateStart && dateEnd) {
                if (dateStart === dateEnd) periodoTexto = `Día ${dateStart}`;
                else periodoTexto = `del ${dateStart} al ${dateEnd}`;
            } else if (dateStart) {
                periodoTexto = `desde el ${dateStart}`;
            }

            const tituloReporte = `Balance Financiero - ${periodoTexto}`;
            const dStart = dateStart || "2000-01-01";
            const dEnd = dateEnd || "2099-12-31";

            const formData = {
                titulo: tituloReporte,
                tipo: 'finanzas',
                fechaInicio: dStart,
                fechaFin: dEnd,
                // SOLUCIÓN: Traducimos 'all' a 'todos' para que el backend lo entienda
                filtroExtra: paymentMethod === 'all' ? 'todos' : paymentMethod
            };

            const response = await axios.post('/reportes', formData);
            const nuevoReporte = response.data.body || response.data;

            toast.success("Documento archivado en Centro de Reportes", { id: toastId });

            if (nuevoReporte && nuevoReporte.contenido) {
                descargarCSV(nuevoReporte);
            }
        } catch (error) {
            console.error(error);
            //  Mostrará el error exacto que envía el backend
            const mensajeBackend = error.response?.data?.error || "Error al generar el balance financiero";
            toast.error(mensajeBackend, { id: toastId });
        }
    };

    const descargarCSV = (reporte) => {
        let data = reporte.contenido;
        if (typeof data === 'string') data = JSON.parse(data);
        if (!data || data.length === 0) return;

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => `"${String(row[header] || '').replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${reporte.titulo.replace(/\s+/g, '_')}.csv`;
        link.click();
    };

    const clearFilters = () => {
        setSearchTerm('');
        setDateStart('');
        setDateEnd('');
        setPaymentMethod('all');
        setSearchParams({});
    };

    return (
        <div className="space-y-8 animate-fade-in-up pb-10">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <DollarSign className="text-gym-orange" size={28} />
                        Tesorería
                    </h2>
                    <p className="text-zinc-400 font-medium mt-1">Control detallado de ingresos y flujo de caja.</p>
                </div>
                {filteredData.length > 0 && (
                    <button onClick={handleExportAndSave} className="flex items-center gap-2 bg-gym-orange/10 hover:bg-gym-orange hover:text-white text-gym-orange border border-gym-orange/30 hover:border-gym-orange px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95">
                        <FileSpreadsheet size={16} /> Extraer Balance
                    </button>
                )}
            </div>

            {/* 🌟 NUEVA ARQUITECTURA DE KPIS (Jerarquía Visual) */}
            <div className="space-y-4">

                {/* FILA 1: Totales Globales */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Master Card: Dinero */}
                    <div className="lg:col-span-2 bg-gym-card border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
                        <div className="absolute -right-20 -top-20 w-64 h-64 blur-[80px] rounded-full bg-emerald-500/20 pointer-events-none transition-all duration-700 group-hover:bg-emerald-500/30"></div>
                        <div className="flex items-center justify-between relative z-10">
                            <div>
                                <h4 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                    <TrendingUp size={14} className="text-emerald-400" />
                                    Total Recaudado
                                </h4>
                                <div className="text-5xl font-black text-white tracking-tighter drop-shadow-md">
                                    ${totalIncome.toLocaleString()}
                                </div>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-2">
                                    Basado en los filtros actuales
                                </p>
                            </div>
                            <div className="hidden sm:flex p-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-inner">
                                <DollarSign size={40} strokeWidth={2} />
                            </div>
                        </div>
                    </div>

                    {/* Secondary Card: Registros */}
                    <div className="bg-gym-card border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-center">
                        <div className="absolute -right-10 -bottom-10 w-32 h-32 blur-[50px] rounded-full bg-blue-500/10 pointer-events-none"></div>
                        <div className="relative z-10 flex items-start gap-4">
                            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                                <Files size={24} />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.15em] mb-1">Volumen de Búsqueda</h4>
                                <div className="text-3xl font-black text-white tracking-tight">{countTx}</div>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Registros Hallados</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FILA 2: Desglose Interactivo (Click para filtrar) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div onClick={() => setPaymentMethod(paymentMethod === 'Efectivo' ? 'all' : 'Efectivo')} className={`cursor-pointer transition-all duration-300 active:scale-95 ${paymentMethod === 'Efectivo' ? 'ring-2 ring-yellow-500 ring-offset-2 ring-offset-[#09090b] rounded-2xl scale-[1.02]' : 'hover:-translate-y-1'}`}>
                        <StatCardBreakdown title="Efectivo Físico" value={`$${cashIncome.toLocaleString()}`} icon={<Wallet size={20} />} color="text-yellow-400" bg="bg-yellow-500" />
                    </div>

                    <div onClick={() => setPaymentMethod(paymentMethod === 'Transferencia' ? 'all' : 'Transferencia')} className={`cursor-pointer transition-all duration-300 active:scale-95 ${paymentMethod === 'Transferencia' ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#09090b] rounded-2xl scale-[1.02]' : 'hover:-translate-y-1'}`}>
                        <StatCardBreakdown title="Transferencias" value={`$${transferIncome.toLocaleString()}`} icon={<Landmark size={20} />} color="text-blue-400" bg="bg-blue-500" />
                    </div>

                    <div onClick={() => setPaymentMethod(paymentMethod === 'Tarjeta' ? 'all' : 'Tarjeta')} className={`cursor-pointer transition-all duration-300 active:scale-95 ${paymentMethod === 'Tarjeta' ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-[#09090b] rounded-2xl scale-[1.02]' : 'hover:-translate-y-1'}`}>
                        <StatCardBreakdown title="Tarjetas / POS" value={`$${cardIncome.toLocaleString()}`} icon={<CreditCard size={20} />} color="text-purple-400" bg="bg-purple-500" />
                    </div>
                </div>

            </div>

            {/* BARRA DE HERRAMIENTAS */}
            <div className="bg-gym-card border border-white/5 p-4 rounded-2xl flex flex-col xl:flex-row gap-4 items-center shadow-xl">

                {/* Fechas Rango */}
                <div className="flex gap-2 w-full xl:w-auto bg-black/40 p-1.5 rounded-xl border border-white/5 shadow-inner items-center px-3">
                    <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Desde</span>
                    <input type="date" className="bg-transparent text-white text-xs font-bold outline-none [color-scheme:dark] cursor-pointer" value={dateStart} onChange={e => setDateStart(e.target.value)} />
                    <div className="w-px h-4 bg-white/10 mx-1"></div>
                    <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Hasta</span>
                    <input type="date" className="bg-transparent text-white text-xs font-bold outline-none [color-scheme:dark] cursor-pointer" value={dateEnd} onChange={e => setDateEnd(e.target.value)} />
                </div>

                <div className="w-px h-8 bg-white/10 hidden xl:block"></div>

                {/* Filtro Método (Sincronizado con las tarjetas) */}
                <select className="w-full xl:w-48 bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-white text-xs font-bold uppercase tracking-wider outline-none cursor-pointer shadow-inner transition-colors focus:border-gym-orange" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                    <option value="all">Todas las vías</option>
                    <option value="Efectivo">💰 Solo Efectivo</option>
                    <option value="Tarjeta">💳 Solo Tarjetas</option>
                    <option value="Transferencia">🏦 Transferencias</option>
                </select>

                <div className="w-px h-8 bg-white/10 hidden xl:block"></div>

                {/* Buscador */}
                <div className="relative flex-1 w-full">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input type="text" placeholder="Buscar por Nombre de Cliente, RUT o Plan..." className="w-full bg-black/40 border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-white text-xs font-medium focus:border-gym-orange outline-none transition-all shadow-inner placeholder:text-zinc-600" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>

                {(searchTerm || dateStart || dateEnd || paymentMethod !== 'all') && (
                    <button onClick={clearFilters} className="p-2.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20" title="Reiniciar Filtros">
                        <FilterX size={18} />
                    </button>
                )}
            </div>

            {/* DATA GRID */}
            <div className="bg-gym-card border border-white/5 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-black/40 text-zinc-500 text-[10px] uppercase font-black tracking-widest border-b border-white/5">
                            <tr>
                                <th className="p-5">Fecha / Hora</th>
                                <th className="p-5">Cliente / RUT</th>
                                <th className="p-5">Membresía Adquirida</th>
                                <th className="p-5 text-center">Vía de Pago</th>
                                <th className="p-5 text-right">Monto Bruto</th>
                                <th className="p-5 text-center">Operador</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => <TableSkeleton key={i} />)
                            ) : filteredData.length > 0 ? (
                                filteredData.map((t) => (
                                    <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-5">
                                            <p className="text-white font-mono font-bold tracking-wider text-sm">{new Date(t.fecha_pago).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                            <p className="text-zinc-500 text-[10px] font-bold uppercase mt-0.5">{new Date(t.fecha_pago).toLocaleDateString()}</p>
                                        </td>
                                        <td className="p-5">
                                            <p className="text-white font-bold tracking-tight">{t.nombre_cliente || 'N/A'}</p>
                                            <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{t.rut_cliente || 'N/A'}</p>
                                        </td>
                                        <td className="p-5 text-zinc-300">
                                            <span className="bg-black/40 px-3 py-1.5 rounded-lg border border-white/5 text-[10px] uppercase font-black tracking-tight shadow-inner inline-block">
                                                {t.nombre_plan || 'Plan Borrado'}
                                            </span>
                                        </td>
                                        <td className="p-5 text-center">
                                            <button onClick={() => setPaymentMethod(t.metodo_pago)} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] uppercase font-black tracking-widest border hover:scale-105 transition-transform cursor-pointer
                                                ${t.metodo_pago === 'Efectivo' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20' :
                                                    t.metodo_pago === 'Transferencia' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20' :
                                                        'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20'}`}>
                                                {t.metodo_pago === 'Efectivo' ? <Wallet size={10} /> : t.metodo_pago === 'Transferencia' ? <Landmark size={10} /> : <CreditCard size={10} />}
                                                {t.metodo_pago}
                                            </button>
                                        </td>
                                        <td className="p-5 text-right font-mono font-black text-emerald-400 text-lg">
                                            ${parseInt(t.monto).toLocaleString()}
                                        </td>
                                        <td className="p-5 text-center">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-800 to-zinc-700 flex items-center justify-center text-xs font-bold text-white mx-auto shadow-lg border border-white/10" title={`Operador: ${t.nombre_admin || 'Sistema'}`}>
                                                {t.nombre_admin ? t.nombre_admin.charAt(0).toUpperCase() : 'S'}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6" className="p-16 text-center text-zinc-500 font-medium border-2 border-dashed border-white/5 bg-black/20 m-4 rounded-xl">No hay movimientos financieros con estos filtros.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && filteredData.length > 0 && (
                    <div className="bg-black/20 p-4 flex justify-between items-center border-t border-white/5 text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                        <span>Mostrando {filteredData.length} registros en pantalla</span>
                        <span className="text-white text-[11px]">Total: <span className="text-emerald-400 ml-1 font-black">${totalIncome.toLocaleString()}</span></span>
                    </div>
                )}
            </div>
        </div>
    );
}

// --- SUBCOMPONENTES UI ---

function StatCardBreakdown({ title, value, icon, color, bg }) {
    return (
        <div className="bg-gym-card border border-white/5 rounded-2xl p-4 shadow-lg relative overflow-hidden h-full flex items-center gap-4">
            <div className={`absolute -right-4 -top-4 w-16 h-16 blur-2xl rounded-full opacity-10 pointer-events-none ${bg}`}></div>
            <div className={`p-2.5 rounded-xl bg-white/5 border border-white/10 ${color} shrink-0 shadow-inner`}>
                {icon}
            </div>
            <div>
                <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.1em] mb-0.5">{title}</h4>
                <div className="text-lg font-black text-white tracking-tight leading-none">{value}</div>
            </div>
        </div>
    );
}

function TableSkeleton() {
    return (
        <tr className="animate-pulse border-b border-white/5">
            <td className="p-5"><div className="h-5 bg-white/5 rounded w-16 mb-2"></div><div className="h-3 bg-white/5 rounded w-20"></div></td>
            <td className="p-5"><div className="h-5 bg-white/5 rounded w-32 mb-2"></div><div className="h-3 bg-white/5 rounded w-24"></div></td>
            <td className="p-5"><div className="h-8 bg-white/5 rounded-lg w-28"></div></td>
            <td className="p-5 text-center"><div className="h-6 bg-white/5 rounded w-20 mx-auto"></div></td>
            <td className="p-5 text-right"><div className="h-6 bg-white/5 rounded w-16 ml-auto"></div></td>
            <td className="p-5"><div className="w-8 h-8 bg-white/5 rounded-full mx-auto"></div></td>
        </tr>
    );
}