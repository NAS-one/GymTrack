import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from '../../api/axios';
import { Search, Plus, Calendar, Dumbbell, Edit, Trash2, Filter, ArrowUpDown, XCircle, Users, Activity, UserX, Download, FileSpreadsheet } from 'lucide-react';
import { ClientModal } from '../../components/admin/Clientes/ClientModal';
import { ClientDetailModal } from '../../components/admin/Clientes/ClientDetailModal';
import { useConfirm } from '../../contexts/ConfirmContext';
import { toast } from 'sonner';

export function Clientes() {
  const confirm = useConfirm();
  const [clients, setClients] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("none");

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [detailClient, setDetailClient] = useState(null);

  // 🌟 RECEPCIÓN DE PARÁMETROS DESDE DASHBOARD
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setFilterStatus(statusParam);
    }
    fetchData();
  }, [searchParams]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resClients, resCoaches] = await Promise.all([
        axios.get('/clientes'),
        axios.get('/entrenadores').catch(() => ({ data: { body: [] } }))
      ]);

      let clientsData = resClients.data.body || resClients.data || [];
      if (clientsData.body) clientsData = clientsData.body;

      let coachesData = resCoaches.data.body || resCoaches.data || [];
      if (coachesData.body) coachesData = coachesData.body;

      setClients(Array.isArray(clientsData) ? clientsData : []);
      setCoaches(Array.isArray(coachesData) ? coachesData : []);
    } catch (error) {
      console.error("Error datos:", error);
      toast.error("Error de conexión", { description: "No se pudieron cargar los datos de la comunidad." });
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (newStatus) => {
    setFilterStatus(newStatus);
    if (newStatus !== 'all') setSearchParams({ status: newStatus });
    else setSearchParams({});
  };

  const handleClearFilters = () => {
    setFilterStatus('all');
    setSearchTerm('');
    setSortOrder('none');
    setSearchParams({});
  };

  const handleSave = async (formData) => {
    try {
      if (selectedClient) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        await axios.patch(`/clientes/${selectedClient.id}`, payload);
        toast.success("Perfil actualizado", { description: `Los datos de ${formData.nombre} fueron guardados.` });
      } else {
        await axios.post('/clientes', formData);
        toast.success("Cliente registrado", { description: `${formData.nombre} ha sido añadido al sistema.` });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.error || "Error interno del servidor";
      toast.error("Error al guardar ficha", { description: errorMsg });
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: '¿Desactivar Cliente?',
      description: 'El cliente perderá acceso al sistema y sus planes activos serán cancelados.',
      confirmText: 'Sí, desactivar',
      cancelText: 'Cancelar',
      type: 'danger'
    });

    if (!isConfirmed) return;

    const deletePromise = axios.delete(`/clientes/${id}`);
    toast.promise(deletePromise, {
      loading: 'Desactivando cliente...',
      success: () => {
        fetchData();
        return 'Cliente desactivado correctamente';
      },
      error: 'Hubo un problema al intentar desactivar al cliente',
    });
  };

  // --- HERRAMIENTA DE DESCARGA CSV ---
  const descargarCSV = (reporte) => {
    try {
      // Nos aseguramos de que el contenido sea un array de objetos
      const datos = typeof reporte.contenido === 'string' ? JSON.parse(reporte.contenido) : reporte.contenido;

      if (!datos || !Array.isArray(datos) || datos.length === 0) {
        return toast.error("El reporte está vacío, no hay datos para exportar.");
      }

      // Extraemos los encabezados (las llaves del primer objeto)
      const headers = Object.keys(datos[0]);

      // Construimos las filas del CSV
      const csvContent = [
        headers.join(","), // Fila 1: Encabezados
        ...datos.map(row =>
          headers.map(header => `"${row[header] ? String(row[header]).replace(/"/g, '""') : ''}"`).join(",")
        ) // Fila 2+: Datos
      ].join("\n");

      // Truco para que Excel lea la Ñ y los tildes correctamente (\uFEFF)
      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      // Limpiamos el título para que sea un nombre de archivo válido
      const nombreArchivo = reporte.titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.setAttribute("download", `${nombreArchivo}.csv`);

      // Forzamos la descarga oculta
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error al generar CSV:", error);
      toast.error("Ocurrió un problema al construir el archivo descargable.");
    }
  };

  // --- MOTOR DE EXPORTACIÓN ---
  const handleExportAndSave = async () => {
    if (filteredClients.length === 0) {
      return toast.warning("No hay datos en pantalla para exportar");
    }

    const toastId = toast.loading("Procesando directorio...");

    try {
      // 1. Armamos la tabla exactamente como se ve en pantalla
      const datosListos = filteredClients.map(c => ({
        "Nombre del Socio": c.nombre,
        "RUT": c.rut,
        "Email": c.email,
        "Estatus": getRealStatus(c) === 'active' ? 'VIGENTE' : getRealStatus(c) === 'expired' ? 'VENCIDO' : 'SIN PLAN',
        "Vencimiento": c.vencimiento_plan ? new Date(c.vencimiento_plan).toLocaleDateString('es-CL') : 'N/A',
        "Entrenador Asignado": c.nombre_entrenador || 'Sin Asignar'
      }));

      // 2. Construimos el título considerando la búsqueda
      let tituloReporte = `Directorio - Filtro: ${filterStatus === 'all' ? 'Todos' : filterStatus}`;
      if (searchTerm) tituloReporte += ` - Búsqueda: "${searchTerm}"`;

      // 3. Enviamos todo el paquete pre-procesado al backend
      const formData = {
        titulo: tituloReporte,
        tipo: 'clientes',
        datosPreCargados: datosListos
      };

      const response = await axios.post('/reportes', formData);
      const nuevoReporte = response.data.body || response.data;

      toast.success("Directorio archivado en el Historial", { id: toastId });

      // 4. Detonamos la descarga en el navegador
      if (nuevoReporte) {
        descargarCSV({
          titulo: nuevoReporte.titulo || formData.titulo,
          contenido: nuevoReporte.contenido || formData.datosPreCargados
        });
      }
    } catch (error) {
      console.error(error);
      const mensajeBackend = error.response?.data?.error || "Error al procesar el documento. Verifica los permisos.";
      toast.error(mensajeBackend, { id: toastId });
    }
  };


  // --- HELPERS ---
  const getRealStatus = (client) => {
    if (!client.estado_membresia) return 'none';
    if (client.estado_membresia !== 'active') return client.estado_membresia;
    if (!client.vencimiento_plan) return 'none';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const vencimiento = new Date(client.vencimiento_plan);
    vencimiento.setHours(0, 0, 0, 0);

    return vencimiento < today ? 'expired' : 'active';
  };

  const renderExpirationText = (client) => {
    if (!client.vencimiento_plan) return <span className="text-zinc-600 font-mono tracking-widest">--/--/--</span>;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const vencimiento = new Date(client.vencimiento_plan);
    vencimiento.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((vencimiento - today) / (1000 * 60 * 60 * 24));
    const dateStr = vencimiento.toLocaleDateString();
    const realStatus = getRealStatus(client);

    if (realStatus === 'active') {
      return (
        <div className="flex flex-col">
          <span className="text-zinc-300 font-mono">{dateStr}</span>
          <span className="text-[9px] text-emerald-400 font-black uppercase tracking-wider">
            {diffDays === 0 ? 'Vence hoy' : `${diffDays} días restantes`}
          </span>
        </div>
      );
    } else if (realStatus === 'expired') {
      return (
        <div className="flex flex-col">
          <span className="text-zinc-500 font-mono">{dateStr}</span>
          <span className="text-[9px] text-rose-400 font-black uppercase tracking-wider">
            Venció hace {Math.abs(diffDays)} días
          </span>
        </div>
      );
    }
    return <span className="text-zinc-300 font-mono">{dateStr}</span>;
  };

  // --- FILTRADO DINÁMICO Y KPIS ---
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchesSearch = c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || c.rut?.includes(searchTerm);
      if (filterStatus === 'all') return matchesSearch;
      return matchesSearch && getRealStatus(c) === filterStatus;
    }).sort((a, b) => {
      if (sortOrder === 'none') return 0;
      const dateA = a.vencimiento_plan ? new Date(a.vencimiento_plan).getTime() : 0;
      const dateB = b.vencimiento_plan ? new Date(b.vencimiento_plan).getTime() : 0;
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [clients, searchTerm, filterStatus, sortOrder]);

  const kpis = useMemo(() => {
    let active = 0, expired = 0, none = 0;
    clients.forEach(c => {
      const s = getRealStatus(c);
      if (s === 'active') active++;
      else if (s === 'expired') expired++;
      else none++;
    });
    return { total: clients.length, active, expired, none };
  }, [clients]);

  return (
    <div className="space-y-8 animate-fade-in pb-10 select-none">

      {/* 1. HEADER LIMPIO Y ORDENADO */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 px-4 pt-2">
        <div className="space-y-1">
          <h2 className="text-5xl font-black text-white tracking-tighter italic">
            Gestión de <span className="text-zinc-700 not-italic">Comunidad</span>
          </h2>
          <p className="text-zinc-500 font-bold text-xs uppercase tracking-[0.3em] mt-2">
            Directorio y control de membresías
          </p>
        </div>

        <div className="flex items-center gap-3">
          {filteredClients.length > 0 && (
            <button
              onClick={handleExportAndSave}
              className="bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.05] px-5 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-xl transition-all active:scale-95"
            >
              <FileSpreadsheet size={18} className="text-gym-orange" /> Exportar
            </button>
          )}
          <button
            onClick={() => { setSelectedClient(null); setIsModalOpen(true); }}
            className="bg-gym-orange hover:bg-orange-500 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all active:scale-95 group"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform" /> Nuevo Socio
          </button>
        </div>
      </header>

      {/* 2. KPIS COMPACTOS (Menos espacio vertical, más precisos) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-4">
        <CompactKpiCard
          active={filterStatus === 'all'}
          onClick={() => handleStatusChange('all')}
          title="Base Total"
          value={kpis.total}
          icon={<Users size={18} />}
          color="orange"
        />
        <CompactKpiCard
          active={filterStatus === 'active'}
          onClick={() => handleStatusChange('active')}
          title="Vigentes"
          value={kpis.active}
          icon={<Activity size={18} />}
          color="green"
        />
        <CompactKpiCard
          active={filterStatus === 'expired'}
          onClick={() => handleStatusChange('expired')}
          title="Vencidos"
          value={kpis.expired}
          icon={<UserX size={18} />}
          color="red"
        />
        <CompactKpiCard
          active={filterStatus === 'none'}
          onClick={() => handleStatusChange('none')}
          title="Sin Plan"
          value={kpis.none}
          icon={<XCircle size={18} />}
          color="zinc"
        />
      </section>

      {/* 3. BARRA DE HERRAMIENTAS (Bordes Orgánicos) */}
      <div className="px-4">
        <div className="bg-white/[0.01] border border-white/[0.03] p-3 rounded-[3rem] flex flex-col lg:flex-row gap-4 items-center shadow-2xl backdrop-blur-xl">

          {/* Buscador Integrado */}
          <div className="relative flex-1 w-full pl-2">
            <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text" placeholder="Búsqueda rápida por nombre o RUT..."
              className="w-full bg-black/40 border border-white/5 rounded-full pl-12 pr-4 py-3 text-sm font-bold text-white focus:border-gym-orange outline-none transition-colors shadow-inner"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="w-px h-8 bg-white/10 hidden lg:block"></div>

          {/* Ordenamiento Suave */}
          <div className="flex items-center gap-2 w-full lg:w-auto px-2">
            <ArrowUpDown size={16} className="text-zinc-500 ml-2 shrink-0" />
            <select
              className="bg-black/40 border border-white/5 rounded-full px-4 py-3 text-xs font-black uppercase tracking-wider text-white outline-none cursor-pointer w-full lg:w-56 transition-colors focus:border-gym-orange shadow-inner"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="none">Orden: Registro</option>
              <option value="asc">⏳ Vencimiento Próximo</option>
              <option value="desc">📅 Vencimiento Lejano</option>
            </select>
          </div>

          {(filterStatus !== 'all' || searchTerm !== '' || sortOrder !== 'none') && (
            <button onClick={handleClearFilters} className="p-3 mr-2 text-rose-500 hover:bg-rose-500/10 rounded-full transition-all border border-transparent hover:border-rose-500/20" title="Limpiar todos los filtros">
              <XCircle size={20} />
            </button>
          )}
        </div>
      </div>

      {/* 4. DATA GRID (Contenedor "Hoja") */}
      <div className="px-4">
        <div className="bg-white/[0.01] border border-white/[0.03] rounded-[3rem] overflow-hidden shadow-2xl backdrop-blur-xl">
          <div className="overflow-x-auto p-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/40 text-zinc-500 text-[10px] uppercase font-black tracking-widest border-b border-white/5">
                  <th className="p-5 pl-8 rounded-tl-[2rem]">Identidad del Socio</th>
                  <th className="p-5 text-center">Estatus</th>
                  <th className="p-5 hidden md:table-cell">Entrenador a Cargo</th>
                  <th className="p-5 hidden lg:table-cell">Ciclo de Facturación</th>
                  <th className="p-5 text-right pr-8 rounded-tr-[2rem]">Controles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan="5" className="p-16 text-center text-zinc-500 font-bold uppercase tracking-widest animate-pulse">Cargando directorio...</td></tr>
                ) : filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-16">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Search size={40} className="text-zinc-600 mb-2 stroke-[1.5]" />
                        <p className="text-zinc-400 font-medium">El radar no encontró coincidencias.</p>
                        {(filterStatus !== 'all' || searchTerm !== '') && (
                          <button onClick={handleClearFilters} className="text-gym-orange hover:text-orange-400 font-black text-xs uppercase tracking-wider mt-2 transition-colors">Restablecer Búsqueda</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => {
                    const realStatus = getRealStatus(client);
                    return (
                      <tr key={client.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="p-5 pl-8">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-zinc-800 to-zinc-700 border border-white/10 flex items-center justify-center text-white font-black text-sm shadow-xl group-hover:scale-105 transition-transform">
                              {client.nombre.charAt(0)}
                            </div>
                            <div>
                              <p className="font-black text-white text-base tracking-tight group-hover:text-gym-orange transition-colors">{client.nombre}</p>
                              <p className="text-xs text-zinc-500 font-medium">{client.email}</p>
                              <p className="text-[10px] text-zinc-600 md:hidden mt-1 font-mono">{client.rut}</p>
                            </div>
                          </div>
                        </td>

                        <td className="p-5 text-center"><StatusBadge status={realStatus} /></td>

                        <td className="p-5 hidden md:table-cell">
                          {client.nombre_entrenador
                            ? <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-zinc-300 shadow-inner"><Dumbbell size={14} className="text-gym-orange" /> {client.nombre_entrenador}</span>
                            : <span className="text-[10px] uppercase font-black tracking-widest text-zinc-600 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">Sin Asignar</span>
                          }
                        </td>

                        <td className="p-5 hidden lg:table-cell">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-500 shadow-inner"><Calendar size={16} /></div>
                            {renderExpirationText(client)}
                          </div>
                        </td>

                        <td className="p-5 text-right pr-8">
                          <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                            <button onClick={() => setDetailClient(client)} className="p-2.5 bg-white/5 hover:bg-emerald-500/20 rounded-xl text-zinc-400 hover:text-emerald-400 font-bold transition-all shadow-lg border border-transparent hover:border-emerald-500/30" title="Ver Finanzas">$</button>
                            <button onClick={() => { setSelectedClient(client); setIsModalOpen(true); }} className="p-2.5 bg-white/5 hover:bg-blue-500/20 rounded-xl text-zinc-400 hover:text-blue-400 transition-all shadow-lg border border-transparent hover:border-blue-500/30" title="Editar Perfil"><Edit size={16} /></button>
                            <button onClick={() => handleDelete(client.id)} className="p-2.5 bg-white/5 hover:bg-rose-500/20 rounded-xl text-zinc-400 hover:text-rose-400 transition-all shadow-lg border border-transparent hover:border-rose-500/30" title="Revocar Acceso"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {!loading && filteredClients.length > 0 && (
            <div className="bg-black/20 p-5 flex justify-between items-center border-t border-white/5">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Mostrando {filteredClients.length} perfiles en pantalla</span>
            </div>
          )}
        </div>
      </div>

      {/* MODALES */}
      <ClientModal
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        clientToEdit={selectedClient} onSave={handleSave} coaches={coaches}
      />

      <ClientDetailModal
        isOpen={!!detailClient} onClose={() => setDetailClient(null)}
        client={detailClient} onUpdate={fetchData}
      />
    </div>
  );
}

// --- SUBCOMPONENTES ---

// 🌟 NUEVO: Tarjeta de KPI Compacta (Ocupa la mitad del espacio vertical)
function CompactKpiCard({ title, value, icon, color, active, onClick }) {
  const theme = {
    orange: { text: "text-gym-orange", bg: "bg-gym-orange/10", border: "border-gym-orange/30", ring: "ring-gym-orange" },
    green: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", ring: "ring-emerald-500" },
    red: { text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30", ring: "ring-rose-500" },
    zinc: { text: "text-zinc-400", bg: "bg-zinc-500/10", border: "border-zinc-500/30", ring: "ring-zinc-500" }
  };
  const t = theme[color];

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer transition-all duration-300 ease-out bg-white/[0.01] border border-white/[0.05] rounded-3xl p-4 flex items-center gap-4 hover:bg-white/[0.03] active:scale-95 shadow-xl backdrop-blur-md
        ${active ? `ring-2 ${t.ring} ring-offset-4 ring-offset-[#09090b] bg-white/[0.03] scale-[1.02]` : ''}`}
    >
      <div className={`p-3 rounded-2xl ${t.bg} ${t.text} border ${t.border} shadow-inner shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-0.5">{title}</p>
        <p className="text-2xl font-black text-white tracking-tighter leading-none">{value}</p>
      </div>
    </div>
  );
}

// Badge Refinado
function StatusBadge({ status }) {
  const config = {
    active: { style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Vigente', dot: 'bg-emerald-400' },
    expired: { style: 'bg-rose-500/10 text-rose-400 border-rose-500/20', label: 'Vencido', dot: 'bg-rose-500' },
    none: { style: 'bg-white/5 text-zinc-400 border-white/10', label: 'Sin Plan', dot: 'bg-zinc-500' }
  };
  const { style, label, dot } = config[status] || config.none;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest shadow-inner ${style}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} shadow-[0_0_8px_currentColor] ${status === 'active' ? 'animate-pulse' : ''}`}></span>
      {label}
    </div>
  );
}