import { useEffect, useState, useMemo } from 'react';
import axios from '../../api/axios';
import { Search, Download, Calendar, DollarSign, CreditCard, Wallet, FilterX } from 'lucide-react';

export function Finanzas() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('all');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/pagos');
            // Normalización segura: Soporte para { body: [...] } o [...] directo
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

    // --- LÓGICA DE FILTRADO ---
    const filteredData = useMemo(() => {
        return transactions.filter(t => {
            // 1. Filtro Texto (Cliente o Plan)
            const term = searchTerm.toLowerCase();
            const matchesSearch =
                (t.nombre_cliente || '').toLowerCase().includes(term) ||
                (t.rut_cliente || '').toLowerCase().includes(term) ||
                (t.nombre_plan || '').toLowerCase().includes(term);

            // 2. Filtro Método
            const matchesMethod = paymentMethod === 'all' || t.metodo_pago === paymentMethod;

            // 3. Filtro Fecha (Normalizada a medianoche)
            let matchesDate = true;
            if (t.fecha_pago) {
                const tDate = new Date(t.fecha_pago).setHours(0, 0, 0, 0);
                if (dateStart) matchesDate = matchesDate && tDate >= new Date(dateStart).setHours(0, 0, 0, 0);
                if (dateEnd) matchesDate = matchesDate && tDate <= new Date(dateEnd).setHours(0, 0, 0, 0);
            }

            return matchesSearch && matchesMethod && matchesDate;
        });
    }, [transactions, searchTerm, paymentMethod, dateStart, dateEnd]);

    // 1. KPI: Total Filtrado
    const totalIncome = useMemo(() => filteredData.reduce((acc, t) => acc + (parseInt(t.monto) || 0), 0), [filteredData]);
    const countTx = filteredData.length;

    // 2. KPI: Ingresos Mes Actual (Real)
    const currentMonthIncome = useMemo(() => {
        const now = new Date();
        // Primer día del mes actual a las 00:00:00
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        return transactions
            .filter(t => {
                const d = new Date(t.fecha_pago);
                return d >= firstDay && d <= lastDay;
            })
            .reduce((acc, t) => acc + (parseInt(t.monto) || 0), 0);
    }, [transactions]);

    // Exportar a CSV
    const handleExport = () => {
        const headers = ["Fecha", "Hora", "Cliente", "RUT", "Plan", "Método", "Monto", "Atendido Por"];
        const rows = filteredData.map(t => [
            new Date(t.fecha_pago).toLocaleDateString(),
            new Date(t.fecha_pago).toLocaleTimeString(),
            `"${t.nombre_cliente || 'N/A'}"`, // Comillas para evitar errores con comas en nombres
            t.rut_cliente || 'N/A',
            t.nombre_plan || 'N/A',
            t.metodo_pago || 'N/A',
            t.monto,
            `"${t.nombre_admin || 'Sistema'}"`
        ]);

        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" // BOM para Excel
            + headers.join(",") + "\n"
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `reporte_financiero_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 animate-fade-in-up pb-10">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Finanzas y Caja</h2>
                    <p className="text-gym-gray text-sm">Control detallado de ingresos y flujo de caja.</p>
                </div>
                <button
                    onClick={handleExport}
                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all"
                >
                    <Download size={18} /> Exportar Reporte
                </button>
            </div>

            {/* KPIS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* KPI 1: Total Filtrado */}
                <div className="bg-gym-card border border-white/10 p-5 rounded-2xl flex items-center justify-between shadow-lg">
                    <div>
                        <p className="text-xs text-gym-gray uppercase font-bold tracking-wider">Total Vista Actual</p>
                        <h3 className="text-2xl font-bold text-white">${totalIncome.toLocaleString()}</h3>
                        <p className="text-xs text-zinc-500 mt-1">{countTx} transacciones</p>
                    </div>
                    <div className="p-3 bg-green-500/10 text-green-500 rounded-xl"><DollarSign size={24} /></div>
                </div>

                {/* KPI 2: MES ACTUAL */}
                <div className="bg-gym-card border border-white/10 p-5 rounded-2xl flex items-center justify-between shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 bg-blue-500 w-16 h-16 blur-2xl opacity-20 -mr-4 -mt-4"></div>
                    <div className="relative z-10">
                        <p className="text-xs text-blue-400 uppercase font-bold tracking-wider">Ingresos Este Mes</p>
                        <h3 className="text-2xl font-bold text-white">${currentMonthIncome.toLocaleString()}</h3>
                        <p className="text-xs text-zinc-500 mt-1">Acumulado mensual</p>
                    </div>
                    <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl relative z-10"><Calendar size={24} /></div>
                </div>

                {/* KPI 3: Efectivo */}
                <div className="bg-gym-card border border-white/10 p-5 rounded-2xl flex items-center justify-between shadow-lg">
                    <div>
                        <p className="text-xs text-gym-gray uppercase font-bold tracking-wider">Caja Efectivo</p>
                        <h3 className="text-2xl font-bold text-white">
                            ${filteredData.filter(t => t.metodo_pago === 'Efectivo').reduce((acc, t) => acc + (parseInt(t.monto) || 0), 0).toLocaleString()}
                        </h3>
                        <p className="text-[10px] text-zinc-500 mt-1">En selección actual</p>
                    </div>
                    <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-xl"><Wallet size={24} /></div>
                </div>

                {/* KPI 4: Digital */}
                <div className="bg-gym-card border border-white/10 p-5 rounded-2xl flex items-center justify-between shadow-lg">
                    <div>
                        <p className="text-xs text-gym-gray uppercase font-bold tracking-wider">Digital / Banco</p>
                        <h3 className="text-2xl font-bold text-white">
                            ${filteredData.filter(t => t.metodo_pago !== 'Efectivo').reduce((acc, t) => acc + (parseInt(t.monto) || 0), 0).toLocaleString()}
                        </h3>
                        <p className="text-[10px] text-zinc-500 mt-1">En selección actual</p>
                    </div>
                    <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl"><CreditCard size={24} /></div>
                </div>

            </div>

            {/* BARRA DE HERRAMIENTAS */}
            <div className="bg-gym-card border border-white/10 p-4 rounded-xl flex flex-col md:flex-row gap-4 items-center">

                {/* Buscador */}
                <div className="relative flex-1 w-full">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gym-gray" />
                    <input
                        type="text"
                        placeholder="Buscar cliente, rut o plan..."
                        className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white text-sm outline-none focus:border-gym-orange transition-colors"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Filtro Fecha */}
                <div className="flex items-center gap-2 w-full md:w-auto bg-black/20 p-1 rounded-lg border border-white/5">
                    <div className="relative flex-1 min-w-[130px]">
                        <input
                            type="date"
                            className="w-full bg-transparent text-white text-xs px-2 py-1.5 outline-none [color-scheme:dark]"
                            value={dateStart}
                            onChange={e => setDateStart(e.target.value)}
                        />
                    </div>
                    <span className="text-zinc-600">-</span>
                    <div className="relative flex-1 min-w-[130px]">
                        <input
                            type="date"
                            className="w-full bg-transparent text-white text-xs px-2 py-1.5 outline-none [color-scheme:dark]"
                            value={dateEnd}
                            onChange={e => setDateEnd(e.target.value)}
                        />
                    </div>
                </div>

                {/* Filtro Método */}
                <select
                    className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-gym-orange cursor-pointer"
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                >
                    <option value="all">Todos los Métodos</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta / Débito</option>
                    <option value="Transferencia">Transferencia</option>
                </select>

                {/* Botón Limpiar */}
                {(searchTerm || dateStart || dateEnd || paymentMethod !== 'all') && (
                    <button
                        onClick={() => { setSearchTerm(''); setDateStart(''); setDateEnd(''); setPaymentMethod('all'); }}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Limpiar filtros"
                    >
                        <FilterX size={20} />
                    </button>
                )}
            </div>

            {/* DATA GRID */}
            <div className="bg-gym-card border border-white/10 rounded-2xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-white/5 text-gym-gray uppercase text-xs font-bold border-b border-white/5">
                            <tr>
                                <th className="p-4">Fecha</th>
                                <th className="p-4">Cliente</th>
                                <th className="p-4">Detalle Plan</th>
                                <th className="p-4">Método</th>
                                <th className="p-4 text-right">Monto</th>
                                <th className="p-4 text-center">Admin</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-zinc-500">Cargando transacciones...</td></tr>
                            ) : filteredData.length > 0 ? (
                                filteredData.map((t) => (
                                    <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="p-4 text-zinc-400 whitespace-nowrap">
                                            {new Date(t.fecha_pago).toLocaleDateString()}
                                            <span className="text-[10px] ml-2 opacity-50 font-mono">{new Date(t.fecha_pago).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-white font-medium group-hover:text-gym-orange transition-colors">{t.nombre_cliente}</p>
                                            <p className="text-[10px] text-zinc-500 font-mono">{t.rut_cliente}</p>
                                        </td>
                                        <td className="p-4 text-zinc-300">
                                            <span className="bg-white/5 px-2 py-1 rounded border border-white/5 text-xs inline-flex items-center gap-1">
                                                {t.nombre_plan || 'Plan Borrado'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full border uppercase tracking-wider ${t.metodo_pago === 'Efectivo'
                                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                                }`}>
                                                {t.metodo_pago}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-mono font-bold text-white">
                                            ${parseInt(t.monto).toLocaleString()}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-400 mx-auto border border-white/5" title={`Atendido por: ${t.nombre_admin}`}>
                                                {t.nombre_admin ? t.nombre_admin.charAt(0) : 'S'}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6" className="p-12 text-center text-zinc-500 italic">No se encontraron transacciones.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Totales */}
                {!loading && filteredData.length > 0 && (
                    <div className="bg-white/5 p-4 flex justify-between items-center border-t border-white/5 text-sm">
                        <span className="text-gym-gray">Mostrando {filteredData.length} registros</span>
                        <div className="flex gap-4">
                            <span className="text-white font-bold">Total Vista: <span className="text-green-400">${totalIncome.toLocaleString()}</span></span>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}