import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "../../api/axios";
import {
  Search,
  Plus,
  Calendar,
  Dumbbell,
  Edit,
  Trash2,
  Filter,
  ArrowUpDown,
  XCircle,
  Users,
  Activity,
  Eye,
} from "lucide-react";
import { ClientModal } from "../../components/admin/Clientes/ClientModal";
import { ClientDetailModal } from "../../components/admin/Clientes/ClientDetailModal";
import { useConfirm } from "../../contexts/ConfirmContext";
import { AddMeasurementsModal } from "../../components/admin/Clientes/AddMeasurementsModal";
// 👇 Importamos toast
import { toast } from "sonner";

export function Clientes({ modoEntrenador = false }) {
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
  const [initialTab, setInitialTab] = useState("profile"); //Estado para controlar qué pestaña abrir en modal
  const [measurementsClient, setMeasurementsClient] = useState(null);

  useEffect(() => {
    const statusParam = searchParams.get("estado");
    if (statusParam) setFilterStatus(statusParam);
    fetchData();
  }, [searchParams, modoEntrenador]); //Agregamos el modoEntrenador a las dependencias

  const fetchData = async () => {
    try {
      setLoading(true);
      //Si es entrenador llamamos a la ruta mis alumnos
      const urlClientes = modoEntrenador
        ? "/entrenadores/mis-alumnos"
        : "/clientes";
      const [resClients, resCoaches] = await Promise.all([
        axios.get(urlClientes),
        axios.get("/entrenadores").catch(() => ({ data: { body: [] } })),
      ]);

      let clientsData = resClients.data.body || resClients.data || [];
      if (clientsData.body) clientsData = clientsData.body;

      let coachesData = resCoaches.data.body || resCoaches.data || [];
      if (coachesData.body) coachesData = coachesData.body;

      setClients(Array.isArray(clientsData) ? clientsData : []);
      setCoaches(Array.isArray(coachesData) ? coachesData : []);
    } catch (error) {
      console.error("Error datos:", error);
      toast.error("Error de conexión", {
        description: "No se pudieron cargar los datos de los clientes.",
      });
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (newStatus) => {
    setFilterStatus(newStatus);
    if (newStatus !== "all") setSearchParams({ estado: newStatus });
    else setSearchParams({});
  };

  const handleClearFilters = () => {
    setFilterStatus("all");
    setSearchTerm("");
    setSortOrder("none");
    setSearchParams({});
  };

  const handleSave = async (formData) => {
    try {
      if (selectedClient) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        await axios.patch(`/clientes/${selectedClient.id}`, payload);
        toast.success("Perfil actualizado", {
          description: `Los datos de ${formData.nombre} fueron guardados.`,
        });
      } else {
        await axios.post("/clientes", formData);
        toast.success("Cliente registrado", {
          description: `${formData.nombre} ha sido añadido al sistema.`,
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      const errorMsg =
        error.response?.data?.error || "Error interno del servidor";
      toast.error("Error al guardar ficha", { description: errorMsg });
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: "¿Desactivar Cliente?",
      description:
        "El cliente perderá acceso al sistema y sus planes activos serán cancelados.",
      confirmText: "Sí, desactivar",
      cancelText: "Cancelar",
      type: "danger",
    });

    if (!isConfirmed) return;

    // Promesa para Toast de Carga
    const deletePromise = axios.delete(`/clientes/${id}`);

    toast.promise(deletePromise, {
      loading: "Desactivando cliente...",
      success: () => {
        fetchData();
        return "Cliente desactivado correctamente";
      },
      error: "Hubo un problema al intentar desactivar al cliente",
    });
  };

  // --- HELPER: Evaluar Estado Real ---
  const getRealStatus = (client) => {
    if (modoEntrenador && client.estado) return client.estado;
    if (!client.estado_membresia) return "none";
    if (client.estado_membresia !== "active") return client.estado_membresia;

    if (!client.vencimiento_plan) return "none";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const vencimiento = new Date(client.vencimiento_plan);
    vencimiento.setHours(0, 0, 0, 0);

    return vencimiento < today ? "expired" : "active";
  };

  // --- HELPER: Texto de Vencimiento Dinámico ---
  const renderExpirationText = (client) => {
    //Simplificamos para la vista del entrenador
    if (modoEntrenador && client.plan)
      return <span className="text-zinc-300">{client.plan}</span>;
    if (!client.vencimiento_plan)
      return <span className="text-zinc-600">--</span>;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const vencimiento = new Date(client.vencimiento_plan);
    vencimiento.setHours(0, 0, 0, 0);

    const diffTime = vencimiento - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const dateStr = vencimiento.toLocaleDateString();
    const realStatus = getRealStatus(client);

    if (realStatus === "active") {
      return (
        <div className="flex flex-col">
          <span className="text-zinc-300">{dateStr}</span>
          <span className="text-[10px] text-green-400 font-medium">
            {diffDays === 0 ? "(Vence hoy)" : `(Quedan ${diffDays} días)`}
          </span>
        </div>
      );
    } else if (realStatus === "expired") {
      return (
        <div className="flex flex-col">
          <span className="text-zinc-500">{dateStr}</span>
          <span className="text-[10px] text-red-400 font-medium">
            (Hace {Math.abs(diffDays)} días)
          </span>
        </div>
      );
    }

    return <span className="text-zinc-300">{dateStr}</span>;
  };

  // --- FILTRADO DINÁMICO ---
  const filteredClients = clients
    .filter((c) => {
      const matchesSearch =
        c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.rut?.includes(searchTerm);
      if (filterStatus === "all") return matchesSearch;

      const realStatus = getRealStatus(c);
      return matchesSearch && realStatus === filterStatus;
    })
    .sort((a, b) => {
      if (sortOrder === "none") return 0;
      const dateA = a.vencimiento_plan
        ? new Date(a.vencimiento_plan).getTime()
        : 0;
      const dateB = b.vencimiento_plan
        ? new Date(b.vencimiento_plan).getTime()
        : 0;
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

  //Funcion para abrir modal en pestaña especifica
  const openModalOnTab = (client, tabName) => {
    setInitialTab(tabName);
    setDetailClient(client);
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      {/* HEADER CON CONTADOR DINÁMICO ESTÉTICO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Clientes
            </h2>

            {/* BADGE DE RESULTADOS ESTÉTICO */}
            <div className="bg-gym-orange/10 border border-gym-orange/30 text-gym-orange px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-[0_0_15px_rgba(249,115,22,0.15)] transition-all">
              <Users size={16} className="opacity-80" />
              <span className="font-black text-xl leading-none">
                {filteredClients.length}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-70 mt-0.5">
                Resultados
              </span>
            </div>
          </div>
          <p className="text-gym-gray mt-1">
            {modoEntrenador
              ? "Gestiona a tus clientes, revisa sus rutinas y monitorea su progreso."
              : "Administra perfiles y membresías"}
            .
          </p>
        </div>

        {!modoEntrenador && (
          <button
            onClick={() => {
              setSelectedClient(null);
              setIsModalOpen(true);
            }}
            className="bg-gym-orange hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95"
          >
            <Plus size={20} /> Nuevo Cliente
          </button>
        )}
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-gym-card p-4 rounded-xl border border-white/5 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gym-gray"
          />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-gym-orange outline-none transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter size={18} className="text-gym-gray" />
          <select
            className={`border rounded-lg px-3 py-2 text-sm outline-none cursor-pointer w-full md:w-40 transition-colors ${filterStatus !== "all"
                ? "bg-gym-orange/10 border-gym-orange text-gym-orange"
                : "bg-black/20 border-white/10 text-white"
              }`}
            value={filterStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="active">🟢 Activos</option>
            <option value="expired">🔴 Vencidos</option>
            <option value="none">⚪ Sin Plan</option>
          </select>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <ArrowUpDown size={18} className="text-gym-gray" />
          <select
            className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none cursor-pointer w-full md:w-48 transition-colors focus:border-gym-orange"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="none">Orden: Registro</option>
            <option value="asc">📅 Vence Pronto</option>
            <option value="desc">📅 Vence Lejos</option>
          </select>
        </div>

        {(filterStatus !== "all" ||
          searchTerm !== "" ||
          sortOrder !== "none") && (
            <button
              onClick={handleClearFilters}
              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Limpiar filtros"
            >
              <XCircle size={20} />
            </button>
          )}
      </div>

      {/* TABLA */}
      <div className="bg-gym-card rounded-2xl border border-white/5 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5 text-gym-gray text-xs uppercase tracking-wider">
                <th className="p-4 font-semibold">Cliente</th>
                <th className="p-4 font-semibold">Estado</th>
                {!modoEntrenador && (
                  <th className="p-4 font-semibold hidden md:table-cell">
                    Entrenador
                  </th>
                )}
                <th className="p-4 font-semibold hidden lg:table-cell">
                  {modoEntrenador ? "Plan Vigente" : "Vencimiento"}
                </th>
                <th className="p-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gym-gray">
                    Cargando datos...
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-zinc-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search size={32} className="opacity-20 mb-2" />
                      No se encontraron clientes con estos filtros.
                      {(filterStatus !== "all" || searchTerm !== "") && (
                        <button
                          onClick={handleClearFilters}
                          className="text-gym-orange hover:underline text-xs mt-2"
                        >
                          Limpiar búsqueda
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const realStatus = getRealStatus(client);

                  return (
                    <tr
                      key={client.id}
                      className="hover:bg-white/5 transition-colors group"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-white/10 flex items-center justify-center text-white font-bold text-sm shadow-md">
                            {client.nombre.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-white group-hover:text-gym-orange transition-colors">
                              {client.nombre}
                            </p>
                            <p className="text-xs text-gym-gray">
                              {client.email}
                            </p>
                            <p className="text-[10px] text-zinc-500 md:hidden mt-0.5">
                              {client.rut}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <StatusBadge status={realStatus} />
                      </td>
                      {!modoEntrenador && (
                        <td className="p-4 hidden md:table-cell text-sm text-zinc-300">
                          {client.nombre_entrenador ? (
                            <span className="flex items-center gap-1">
                              <Dumbbell size={14} className="text-gym-orange" />{" "}
                              {client.nombre_entrenador}
                            </span>
                          ) : (
                            <span className="opacity-50 italic">
                              Sin asignar
                            </span>
                          )}
                        </td>
                      )}

                      <td className="p-4 hidden lg:table-cell text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-zinc-500" />
                          {renderExpirationText(client)}
                        </div>
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          {modoEntrenador ? (
                            <>
                              <button
                                onClick={() =>
                                  openModalOnTab(client, "profile")
                                }
                                className="p-2 hover:bg-zinc-700/50 rounded-lg text-zinc-400 hover:text-white transition-colors"
                                title="Ver Perfil"
                              >
                                <Eye size={18} />
                              </button>
                              <button
                                onClick={() => setMeasurementsClient(client)}
                                className="p-2 hover:bg-blue-500/10 rounded-lg text-zinc-400 hover:text-blue-400 transition-colors"
                                title="Anotar Nuevas Medidas"
                              >
                                <Activity size={18} />
                              </button>
                              <button
                                onClick={() =>
                                  openModalOnTab(client, "routines")
                                }
                                className="p-2 hover:bg-orange-500/10 rounded-lg text-zinc-400 hover:text-orange-400 transition-colors"
                                title="Rutinas"
                              >
                                <Dumbbell size={18} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() =>
                                  openModalOnTab(client, "payment")
                                }
                                className="p-2 hover:bg-green-500/10 rounded-lg text-zinc-400 hover:text-green-400 font-bold transition-colors"
                                title="Ver Detalle/Pagos"
                              >
                                $
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedClient(client);
                                  setIsModalOpen(true);
                                }}
                                className="p-2 hover:bg-blue-500/10 rounded-lg text-zinc-400 hover:text-blue-400 transition-colors"
                                title="Editar Perfil"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(client.id)}
                                className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-400 hover:text-red-400 transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        clientToEdit={selectedClient}
        onSave={handleSave}
        coaches={coaches}
      />

      <ClientDetailModal
        isOpen={!!detailClient}
        onClose={() => setDetailClient(null)}
        client={detailClient}
        onUpdate={fetchData}
        modoEntrenador={modoEntrenador}
        initialTab={initialTab}
      />

      <AddMeasurementsModal
        isOpen={!!measurementsClient}
        onClose={() => setMeasurementsClient(null)}
        client={measurementsClient}
        onSave={fetchData}
      />
    </div>
  );
}

function StatusBadge({ status }) {
  const config = {
    active: {
      style: "bg-green-500/10 text-green-400 border-green-500/20",
      label: "Vigente",
      dot: "bg-green-400",
    },
    expired: {
      style: "bg-red-500/10 text-red-400 border-red-500/20",
      label: "Vencido",
      dot: "bg-red-500",
    },
    cancelled: {
      style: "bg-red-900/30 text-red-500 border-red-500/50",
      label: "Cancelado",
      dot: "bg-red-500",
    },
    none: {
      style: "bg-zinc-800/50 text-zinc-400 border-zinc-700",
      label: "Sin Plan",
      dot: "bg-zinc-500",
    },
  };
  const { style, label, dot } = config[status] || config.none;

  return (
    <span
      className={`px-2 py-1 rounded border flex items-center gap-1.5 w-fit text-[10px] font-bold uppercase tracking-wider ${style}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot} animate-pulse`}></span>
      {label}
    </span>
  );
}
