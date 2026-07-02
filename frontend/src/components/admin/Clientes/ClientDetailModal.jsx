import { useState, useEffect } from "react";
import { AddMeasurementsModal } from "./AddMeasurementsModal";
import {
  X,
  User,
  CreditCard,
  Activity,
  Calendar,
  CheckCircle,
  MapPin,
  Ban,
  History,
  TrendingUp,
  Clock,
  AlertTriangle,
  Dumbbell,
  Target,
  Scale,
  Ruler,
  Percent,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import axios from "../../../api/axios";
import { useConfirm } from "../../../contexts/ConfirmContext";
import { toast } from "sonner";
import { RutinaModal } from "./RutinaModal";

export function ClientDetailModal({
  isOpen,
  onClose,
  client,
  onUpdate,
  modoEntrenador = false,
  initialTab = "profile",
}) {
  const confirm = useConfirm();

  const [activeTab, setActiveTab] = useState("profile");
  const [processing, setProcessing] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  // Estado del modal de rutinas
  const [isRutinaModalOpen, setIsRutinaModalOpen] = useState(false);
  const [showMeasurementsModal, setShowMeasurementsModal] = useState(false);
  const [rutinaParaEditar, setRutinaParaEditar] = useState(null);
  const [expandedRutinaId, setExpandedRutinaId] = useState(null);

  // Estado del Formulario de Pago
  const [paymentData, setPaymentData] = useState({
    id_plan: "",
    nombre_plan: "",
    meses: 1,
    monto: 0,
    metodo: "Efectivo",
  });

  // Datos del Backend
  const [history, setHistory] = useState([]);
  const [weightData, setWeightData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [rutinasActivas, setRutinasActivas] = useState(null);

  // --- CARGA DE DATOS ---
  useEffect(() => {
    if (isOpen && client) {
      setActiveTab(initialTab || "profile");
      setRutinasActivas(null);
      fetchStats();
      fetchRutinaActual();
    }
  }, [isOpen, client, initialTab]);

  const fetchRutinaActual = async () => {
    if (!client?.id) return;
    try {
      const res = await axios.get(`/rutinas/active/${client.id}`);
      let data = res.data.body || res.data;
      if (data?.body) data = data.body;
      setRutinasActivas(Array.isArray(data) ? data : []);
    } catch {
      setRutinasActivas([]);
    }
  };

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const response = await axios.get(`/clientes/${client.id}/stats`);

      let data = response.data.body || response.data;
      if (data.body) data = data.body;

      const { pagos, medidas, asistencia, planesDisponibles } = data;

      setHistory(pagos || []);
      setAvailablePlans(planesDisponibles || []);

      if (planesDisponibles && planesDisponibles.length > 0) {
        const first = planesDisponibles[0];
        setPaymentData((prev) => ({
          ...prev,
          id_plan: first.id,
          nombre_plan: first.nombre,
          monto: first.precio,
          meses: first.duracion_meses,
        }));
      }

      const formattedWeight = medidas
        ? medidas.map((m) => ({
            fecha: new Date(m.fecha_registro).toLocaleDateString("es-CL", {
              month: "short",
              day: "numeric",
            }),
            peso: parseFloat(m.peso),
            grasa: parseFloat(m.porcentaje_grasa),
            altura: parseFloat(m.altura),
            cintura: parseFloat(m.circunferencia_cintura),
          }))
        : [];
      setWeightData(formattedWeight);

      const visitsByMonth = asistencia
        ? asistencia.reduce((acc, curr) => {
            const dateObj = new Date(curr.fecha_entrada);
            const month = dateObj.toLocaleDateString("es-CL", {
              month: "short",
            });
            const key = `${month}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {})
        : {};

      const formattedAttendance = Object.keys(visitsByMonth).map((key) => ({
        mes: key,
        visitas: visitsByMonth[key],
      }));
      setAttendanceData(formattedAttendance);
    } catch (error) {
      console.error("Error cargando stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (!isOpen || !client) return null;

  // --- DATOS MOCK PARA GRAFICOS DEL ENTRENADOR (Moveremos esto a la BD luego) ---
  const mockLoadData = [
    { fecha: "Sem 1", sentadilla: 80, pressBanca: 60, pesoMuerto: 100 },
    { fecha: "Sem 2", sentadilla: 85, pressBanca: 62.5, pesoMuerto: 105 },
    { fecha: "Sem 3", sentadilla: 85, pressBanca: 65, pesoMuerto: 110 },
    { fecha: "Sem 4", sentadilla: 90, pressBanca: 67.5, pesoMuerto: 115 },
  ];

  const mockVolumeData = [
    { semana: "Sem 1", volumen: 8500 },
    { semana: "Sem 2", volumen: 9200 },
    { semana: "Sem 3", volumen: 10500 },
    { semana: "Sem 4", volumen: 11200 },
  ];

  // --- LÓGICA DE NEGOCIO ---

  const handlePlanSelect = (planObj) => {
    setPaymentData((prev) => ({
      ...prev,
      id_plan: planObj.id,
      nombre_plan: planObj.nombre,
      monto: planObj.precio,
      meses: planObj.duracion_meses,
    }));
  };

  const handlePayment = async (e) => {
    e.preventDefault();

    // REEMPLAZO 1: alert() por toast.warning()
    if (!paymentData.id_plan) {
      return toast.warning("Seleccione un plan primero", {
        description: "Debe seleccionar un plan de la lista para continuar.",
      });
    }

    const isConfirmed = await confirm({
      title: "Confirmar Pago",
      description: `¿Registrar renovación del ${paymentData.nombre_plan} por un monto de $${parseInt(paymentData.monto).toLocaleString()}?`,
      confirmText: "Sí, confirmar pago",
      cancelText: "Cancelar",
      type: "success",
    });

    if (!isConfirmed) return;

    setProcessing(true);
    try {
      const payload = {
        id_cliente: client.id,
        id_plan: paymentData.id_plan,
        meses_duracion: paymentData.meses,
        monto: paymentData.monto,
        metodo_pago: paymentData.metodo,
      };

      await axios.post("/pagos/renovar", payload);

      // REEMPLAZO 2: alert() por toast.success()
      toast.success("Membresía Renovada", {
        description: `El pago de $${parseInt(paymentData.monto).toLocaleString()} ha sido registrado.`,
      });

      fetchStats();
      if (onUpdate) onUpdate();
      onClose();
    } catch (error) {
      console.error("Error pago:", error);
      const msg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        "Error al procesar pago";

      // REEMPLAZO 3: alert() por toast.error()
      toast.error("Error al registrar el pago", {
        description: msg,
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelMembership = async () => {
    const isConfirmed = await confirm({
      title: "¿Cancelar Membresía?",
      description:
        "El cliente perderá el acceso inmediato a las instalaciones y no se podrá revertir esta acción.",
      confirmText: "Sí, cancelar plan",
      cancelText: "Volver",
      type: "danger",
    });

    if (!isConfirmed) return;

    setProcessing(true);
    try {
      await axios.post("/pagos/cancelar", { id_cliente: client.id });

      // REEMPLAZO 4: alert() por toast.success()
      toast.success("Membresía Cancelada", {
        description: "El cliente ha perdido el acceso al gimnasio.",
      });

      if (onUpdate) onUpdate();
      onClose();
    } catch (error) {
      // REEMPLAZO 5: alert() por toast.error()
      toast.error("Error al cancelar la membresía", {
        description: "Ocurrió un problema de comunicación con el servidor.",
      });
    } finally {
      setProcessing(false);
    }
  };

  const calculateAge = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const today = new Date();
      const birthDate = new Date(dateString);
      let age = today.getFullYear() - birthDate.getFullYear();
      if (
        today.getMonth() < birthDate.getMonth() ||
        (today.getMonth() === birthDate.getMonth() &&
          today.getDate() < birthDate.getDate())
      )
        age--;
      return `${age} años`;
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-gym-card border border-white/10 w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* SIDEBAR (PERFIL RÁPIDO) */}
        <div className="w-full md:w-1/3 bg-black/20 border-r border-white/5 p-6 flex flex-col items-center text-center overflow-y-auto">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-lg shadow-blue-500/20">
            {client.nombre.charAt(0)}
          </div>
          <h2 className="text-xl font-bold text-white leading-tight">
            {client.nombre}
          </h2>
          <p className="text-gym-gray text-sm mb-6 mt-1">{client.rut}</p>

          <div className="w-full space-y-3">
            <div
              className={`p-3 rounded-xl border border-white/5 ${client.estado_membresia === "active" || client.estado === "active" ? "bg-green-500/10" : "bg-red-500/10"}`}
            >
              <p className="text-xs text-gym-gray uppercase font-bold">
                Estado Membresía
              </p>
              <p
                className={`font-bold text-lg ${client.estado_membresia === "active" || client.estado === "active" ? "text-green-400" : "text-red-400"}`}
              >
                {client.estado_membresia === "active" ||
                client.estado === "active"
                  ? "ACTIVO"
                  : "INACTIVO"}
              </p>
            </div>

            {modoEntrenador && (
              <div className="bg-orange-500/10 p-3 rounded-xl border border-orange-500/20">
                <p className="text-xs text-orange-500/80 uppercase font-bold flex items-center justify-center gap-1">
                  <Target size={14} /> Objetivo
                </p>
                <p className="text-orange-400 font-bold">
                  {client.objetivo || "Hipertrofia Muscular"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex-1 flex flex-col bg-gym-dark min-w-0">
          {/* TABS */}
          <div className="flex border-b border-white/5 bg-black/10 shrink-0">
            <TabButton
              active={activeTab === "profile"}
              onClick={() => setActiveTab("profile")}
              icon={<User size={18} />}
              label="Perfil"
            />
            <TabButton
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
              icon={<Activity size={18} />}
              label="Progreso"
            />
            {modoEntrenador ? (
              <TabButton
                active={activeTab === "routines"}
                onClick={() => setActiveTab("routines")}
                icon={<Dumbbell size={18} />}
                label="Rutinas"
              />
            ) : (
              <TabButton
                active={activeTab === "payment"}
                onClick={() => setActiveTab("payment")}
                icon={<CreditCard size={18} />}
                label="Pagos"
              />
            )}
            <button
              onClick={onClose}
              className="p-4 text-gym-gray hover:text-white border-l border-white/5 hover:bg-white/5 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* BODY SCROLLABLE */}
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar relative">
            {loadingStats && (
              <div className="absolute inset-0 bg-gym-dark/80 z-20 flex items-center justify-center text-gym-orange font-bold animate-pulse">
                Cargando datos...
              </div>
            )}

            {/* 1. PERFIL COMPLETO */}
            {/* 1. PERFIL COMPLETO (Énfasis en Datos y Objetivo) */}
            {activeTab === "profile" && (
              <div className="space-y-8 animate-fade-in">
                {/* A. Datos Personales */}
                <div>
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <User size={20} className="text-gym-orange" /> Ficha de
                    Datos Personales
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-black/20 p-5 rounded-2xl border border-white/5">
                    <InfoField
                      label="Edad"
                      value={calculateAge(client.fecha_nacimiento)}
                    />
                    <InfoField label="Género" value={client.genero || "--"} />
                    <InfoField
                      label="Nacimiento"
                      value={
                        client.fecha_nacimiento
                          ? new Date(
                              client.fecha_nacimiento,
                            ).toLocaleDateString()
                          : "--"
                      }
                    />
                    <InfoField label="Email" value={client.email} />
                  </div>
                </div>

                {/* B. Ubicación y Contacto */}
                <div className="pt-6 border-t border-white/5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoField
                      label="Dirección Actual"
                      value={client.direccion || "Sin dirección registrada"}
                    />
                    <InfoField
                      label="Teléfono"
                      value={client.telefono || "Sin teléfono"}
                    />
                  </div>
                </div>

                {/* C. Medidas Físicas Actuales */}
                <div className="pt-6 border-t border-white/5">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Scale size={18} className="text-gym-orange" /> Últimas
                    Medidas Registradas
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
                      <p className="text-[10px] text-gym-gray uppercase font-bold mb-1">
                        Peso
                      </p>
                      <p className="text-xl font-black text-white">
                        {weightData.length > 0 &&
                        weightData[weightData.length - 1].peso
                          ? weightData[weightData.length - 1].peso
                          : "--"}{" "}
                        <span className="text-xs font-normal text-zinc-500">
                          kg
                        </span>
                      </p>
                    </div>
                    <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
                      <p className="text-[10px] text-gym-gray uppercase font-bold mb-1">
                        Estatura
                      </p>
                      <p className="text-xl font-black text-white">
                        {weightData.length > 0 &&
                        weightData[weightData.length - 1].altura
                          ? weightData[weightData.length - 1].altura
                          : "--"}{" "}
                        <span className="text-xs font-normal text-zinc-500">
                          m
                        </span>
                      </p>
                    </div>
                    <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
                      <p className="text-[10px] text-gym-gray uppercase font-bold mb-1">
                        % Grasa
                      </p>
                      <p className="text-xl font-black text-white">
                        {weightData.length > 0 &&
                        weightData[weightData.length - 1].grasa
                          ? weightData[weightData.length - 1].grasa
                          : "--"}{" "}
                        <span className="text-xs font-normal text-zinc-500">
                          %
                        </span>
                      </p>
                    </div>
                    <div className="bg-black/20 p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
                      <p className="text-[10px] text-gym-gray uppercase font-bold mb-1">
                        Cintura
                      </p>
                      <p className="text-xl font-black text-white">
                        {weightData.length > 0 &&
                        weightData[weightData.length - 1].cintura
                          ? weightData[weightData.length - 1].cintura
                          : "--"}{" "}
                        <span className="text-xs font-normal text-zinc-500">
                          cm
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Botón Registrar Nuevas Medidas */}
                  <button
                    onClick={() => setShowMeasurementsModal(true)}
                    className="w-full mt-4 py-3 border border-dashed border-blue-500/30 rounded-xl text-blue-400 hover:text-white hover:bg-blue-500/10 hover:border-blue-500/50 transition-all text-sm font-bold flex items-center justify-center gap-2"
                  >
                    <Scale size={16} /> Registrar Nuevas Medidas
                  </button>
                </div>
              </div>
            )}

            {/* 2. PROGRESO (Gráficos en Grid 2x2) */}
            {activeTab === "overview" && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Gráfico Peso */}
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5 h-52">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <TrendingUp size={14} className="text-blue-400" />
                        Evolución de Peso
                      </p>
                      {weightData.length > 0 && (
                        <span className="text-[10px] text-green-400 font-bold">
                          {weightData[weightData.length - 1].peso}kg
                        </span>
                      )}
                    </div>
                    {weightData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="85%">
                        <AreaChart data={weightData}>
                          <defs>
                            <linearGradient
                              id="colorPeso"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#3B82F6"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor="#3B82F6"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#333"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="fecha"
                            stroke="#666"
                            tick={{ fontSize: 9 }}
                          />
                          <YAxis
                            domain={["dataMin - 2", "dataMax + 2"]}
                            stroke="#666"
                            tick={{ fontSize: 9 }}
                            width={35}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1a1a1a",
                              border: "1px solid #333",
                              borderRadius: "8px",
                              fontSize: "12px",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="peso"
                            stroke="#3B82F6"
                            fillOpacity={1}
                            fill="url(#colorPeso)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gym-gray text-xs">
                        <Activity size={28} className="mb-2 opacity-20" />
                        Sin registros de peso
                      </div>
                    )}
                  </div>

                  {/* Gráfico Asistencia */}
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5 h-52">
                    <p className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                      <Calendar size={14} className="text-gym-orange" />
                      Asistencias por Mes
                    </p>
                    {attendanceData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="85%">
                        <BarChart data={attendanceData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#333"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="mes"
                            stroke="#666"
                            tick={{ fontSize: 9 }}
                          />
                          <Tooltip
                            cursor={{ fill: "transparent" }}
                            contentStyle={{
                              backgroundColor: "#1a1a1a",
                              border: "1px solid #333",
                              fontSize: "12px",
                            }}
                          />
                          <Bar
                            dataKey="visitas"
                            fill="#F97316"
                            radius={[4, 4, 0, 0]}
                            barSize={30}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gym-gray text-xs">
                        <Clock size={28} className="mb-2 opacity-20" />
                        Sin asistencias recientes
                      </div>
                    )}
                  </div>

                  {/* Gráfico % Grasa */}
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5 h-52">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Percent size={14} className="text-orange-400" />% Grasa
                        Corporal
                      </p>
                      {weightData.length > 0 &&
                        weightData[weightData.length - 1].grasa && (
                          <span className="text-[10px] text-orange-400 font-bold">
                            {weightData[weightData.length - 1].grasa}%
                          </span>
                        )}
                    </div>
                    {weightData.some((d) => d.grasa) ? (
                      <ResponsiveContainer width="100%" height="85%">
                        <AreaChart data={weightData}>
                          <defs>
                            <linearGradient
                              id="colorGrasa"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#F97316"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor="#F97316"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#333"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="fecha"
                            stroke="#666"
                            tick={{ fontSize: 9 }}
                          />
                          <YAxis
                            domain={["dataMin - 1", "dataMax + 1"]}
                            stroke="#666"
                            tick={{ fontSize: 9 }}
                            width={35}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1a1a1a",
                              border: "1px solid #333",
                              borderRadius: "8px",
                              fontSize: "12px",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="grasa"
                            stroke="#F97316"
                            fillOpacity={1}
                            fill="url(#colorGrasa)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gym-gray text-xs">
                        <Percent size={28} className="mb-2 opacity-20" />
                        Sin registros de grasa
                      </div>
                    )}
                  </div>

                  {/* Gráfico Cintura */}
                  <div className="bg-black/20 p-4 rounded-xl border border-white/5 h-52">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Ruler size={14} className="text-purple-400" />
                        Cintura
                      </p>
                      {weightData.length > 0 &&
                        weightData[weightData.length - 1].cintura && (
                          <span className="text-[10px] text-purple-400 font-bold">
                            {weightData[weightData.length - 1].cintura}cm
                          </span>
                        )}
                    </div>
                    {weightData.some((d) => d.cintura) ? (
                      <ResponsiveContainer width="100%" height="85%">
                        <AreaChart data={weightData}>
                          <defs>
                            <linearGradient
                              id="colorCintura"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#8B5CF6"
                                stopOpacity={0.3}
                              />
                              <stop
                                offset="95%"
                                stopColor="#8B5CF6"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#333"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="fecha"
                            stroke="#666"
                            tick={{ fontSize: 9 }}
                          />
                          <YAxis
                            domain={["dataMin - 5", "dataMax + 5"]}
                            stroke="#666"
                            tick={{ fontSize: 9 }}
                            width={35}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1a1a1a",
                              border: "1px solid #333",
                              borderRadius: "8px",
                              fontSize: "12px",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="cintura"
                            stroke="#8B5CF6"
                            fillOpacity={1}
                            fill="url(#colorCintura)"
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gym-gray text-xs">
                        <Ruler size={28} className="mb-2 opacity-20" />
                        Sin registros de cintura
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* 3. RUTINAS - TAB EXCLUSIVO DEL ENTRENADOR                     */}
            {/* ============================================================ */}
            {activeTab === "routines" && modoEntrenador && (
              <div className="space-y-6 animate-fade-in">
                {/* Header con acción */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-orange-500/10 p-5 rounded-xl border border-orange-500/20">
                  <div>
                    <h3 className="text-lg font-bold text-orange-400 mb-1">
                      Plan de Entrenamiento
                    </h3>
                    <p className="text-sm text-orange-500/80">
                      {rutinasActivas === null
                        ? ""
                        : rutinasActivas.length > 0
                          ? `${rutinasActivas.length} rutina(s) activa(s) — máx. 7`
                          : "El alumno no tiene rutinas asignadas."}
                    </p>
                  </div>
                  {(!rutinasActivas || rutinasActivas.length < 7) && (
                    <button
                      onClick={() => {
                        setRutinaParaEditar(null);
                        setIsRutinaModalOpen(true);
                      }}
                      className="bg-gym-orange hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 text-sm whitespace-nowrap"
                    >
                      <Plus size={18} /> Asignar Nueva Rutina
                    </button>
                  )}
                </div>

                {/* Lista de rutinas */}
                {rutinasActivas === null ? (
                  <div className="bg-black/20 border border-white/5 rounded-xl p-8 flex items-center justify-center text-zinc-500 text-sm">
                    Cargando...
                  </div>
                ) : rutinasActivas.length > 0 ? (
                  <div className="space-y-4">
                    {rutinasActivas.map((rutina) => (
                      <div key={rutina.id} className="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
                        {/* Cabecera de cada rutina */}
                        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-white/[0.02]">
                          <div>
                            <h4 className="text-sm font-bold text-white">{rutina.nombre}</h4>
                            <p className="text-[10px] text-zinc-500">
                              Creada: {new Date(rutina.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setRutinaParaEditar(rutina);
                                setIsRutinaModalOpen(true);
                              }}
                              className="px-3 py-1.5 text-xs font-bold text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/10 transition-all"
                            >
                              Editar
                            </button>
                            <button
                              onClick={async () => {
                                const ok = await confirm({
                                  title: "¿Eliminar esta rutina?",
                                  description: `Se eliminará "${rutina.nombre}" permanentemente.`,
                                  confirmText: "Sí, eliminar",
                                  cancelText: "Cancelar",
                                  type: "danger",
                                });
                                if (ok) {
                                  try {
                                    await axios.delete(`/rutinas/${rutina.id}`);
                                    toast.success("Rutina eliminada");
                                    fetchRutinaActual();
                                  } catch {
                                    toast.error("Error al eliminar la rutina");
                                  }
                                }
                              }}
                              className="px-3 py-1.5 text-xs font-bold text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-all"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                        {/* Botón Acordeón */}
                        {rutina.plan?.length > 0 && (
                          <button
                            onClick={() => setExpandedRutinaId(prev => prev === rutina.id ? null : rutina.id)}
                            className="w-full flex items-center justify-between p-3 bg-black/10 hover:bg-white/5 transition-colors border-b border-white/5 text-xs text-zinc-400 font-bold tracking-wide"
                          >
                            <span>VER EJERCICIOS ({rutina.plan.length})</span>
                            {expandedRutinaId === rutina.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        )}
                        
                        {/* Tabla de ejercicios */}
                        {rutina.plan?.length > 0 && expandedRutinaId === rutina.id && (
                          <div className="animate-fade-in max-h-64 overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left text-sm">
                              <thead className="bg-white/5 text-gym-gray text-xs uppercase tracking-wider sticky top-0 backdrop-blur-md">
                                <tr>
                                  <th className="p-3">Día</th>
                                  <th className="p-3">Músculo</th>
                                  <th className="p-3">Ejercicio</th>
                                  <th className="p-3 text-center">Series</th>
                                  <th className="p-3 text-center">Reps</th>
                                  <th className="p-3 text-right">Carga</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-white/5">
                                {rutina.plan.map((row, i) => (
                                  <tr key={i} className="hover:bg-white/5 transition-colors">
                                    <td className="p-3 font-bold text-gym-orange text-xs">{row.dia}</td>
                                    <td className="p-3 text-zinc-400 text-xs">{row.grupo_muscular || "--"}</td>
                                    <td className="p-3 text-white">{row.nombre_ejercicio || row.ejercicio?.nombre || "Ejercicio " + row.id_ejercicio}</td>
                                    <td className="p-3 text-center text-zinc-400 font-mono">{row.series}</td>
                                    <td className="p-3 text-center text-zinc-400 font-mono">{row.repeticiones}</td>
                                    <td className="p-3 text-right">
                                      <span className="bg-zinc-800 text-gym-orange px-2 py-1 rounded font-mono border border-zinc-700 text-xs">
                                        {row.carga_proyectada || "Peso Corporal"}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-black/20 border border-white/5 rounded-xl p-10 flex flex-col items-center justify-center text-center">
                    <Dumbbell size={40} className="text-zinc-600 mb-3" />
                    <p className="text-gym-gray">Este alumno aún no tiene rutinas asignadas.</p>
                    <p className="text-xs text-zinc-600 mt-1">Haz clic en "Asignar Nueva Rutina" para comenzar.</p>
                  </div>
                )}
              </div>
            )}

            {/* 4. PAGOS Y RENOVACIÓN */}
            {activeTab === "payment" && (
              <div className="animate-fade-in space-y-6">
                <div className="bg-black/20 p-5 rounded-xl border border-white/5">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <CreditCard size={16} /> Renovar / Nuevo Plan
                  </h3>
                  <form onSubmit={handlePayment} className="space-y-4">
                    {/* GRID DE PLANES DINÁMICO */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {availablePlans.length > 0 ? (
                        availablePlans.map((plan) => (
                          <button
                            key={plan.id}
                            type="button"
                            onClick={() => handlePlanSelect(plan)}
                            className={`py-2 px-1 rounded text-xs font-bold border transition-all truncate flex flex-col items-center justify-center gap-1 h-16
                                        ${
                                          paymentData.id_plan === plan.id
                                            ? "bg-gym-orange border-gym-orange text-white ring-2 ring-orange-500/30"
                                            : "border-white/10 text-gym-gray hover:border-white/30 hover:bg-white/5"
                                        }`}
                          >
                            <span className="truncate w-full text-center">
                              {plan.nombre}
                            </span>
                            <span className="opacity-80 font-mono">
                              ${parseInt(plan.precio).toLocaleString()}
                            </span>
                          </button>
                        ))
                      ) : (
                        <p className="col-span-3 text-xs text-red-400 text-center py-2 bg-red-500/10 rounded">
                          No hay planes configurados en el sistema
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-gym-gray uppercase font-bold mb-1 block">
                          Monto a Pagar ($)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                            $
                          </span>
                          <input
                            type="text"
                            className="w-full bg-gym-dark border border-white/10 rounded-lg pl-6 pr-3 py-2 text-white text-sm font-mono font-bold"
                            value={parseInt(paymentData.monto).toLocaleString()}
                            readOnly
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-gym-gray uppercase font-bold mb-1 block">
                          Método de Pago
                        </label>
                        <select
                          className="w-full bg-gym-dark border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-gym-orange cursor-pointer"
                          value={paymentData.metodo}
                          onChange={(e) =>
                            setPaymentData({
                              ...paymentData,
                              metodo: e.target.value,
                            })
                          }
                        >
                          <option value="Efectivo">Efectivo</option>
                          <option value="Transferencia">Transferencia</option>
                          <option value="Debito">Débito</option>
                          <option value="Credito">Crédito</option>
                        </select>
                      </div>
                    </div>

                    <button
                      disabled={processing || availablePlans.length === 0}
                      type="submit"
                      className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processing ? (
                        "Procesando..."
                      ) : (
                        <>
                          <CheckCircle size={18} /> Confirmar Pago
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Tabla Historial */}
                <div>
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <History size={16} /> Historial de Pagos
                  </h3>
                  <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden max-h-40 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 text-gym-gray sticky top-0">
                        <tr>
                          <th className="p-3">Fecha</th>
                          <th className="p-3">Plan</th>
                          <th className="p-3 text-right">Monto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {history.length > 0 ? (
                          history.map((pago, i) => (
                            <tr
                              key={i}
                              className="hover:bg-white/5 transition-colors"
                            >
                              <td className="p-3 text-white">
                                {new Date(pago.fecha_pago).toLocaleDateString()}
                              </td>
                              <td className="p-3 text-white">
                                {pago.tipo_plan || "Plan Antiguo"}
                              </td>
                              <td className="p-3 text-right text-green-400 font-mono">
                                ${parseInt(pago.monto).toLocaleString()}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="3"
                              className="p-4 text-center text-gym-gray"
                            >
                              Sin pagos registrados
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Botón Cancelar (Zona de Peligro) */}
                {client.estado_membresia === "active" && (
                  <div className="pt-4 border-t border-white/10">
                    <button
                      onClick={handleCancelMembership}
                      disabled={processing}
                      className="w-full py-3 text-xs text-red-500 hover:text-white font-bold border border-red-500/30 rounded-xl hover:bg-red-500 transition-colors flex items-center justify-center gap-2"
                    >
                      <Ban size={14} /> CANCELAR MEMBRESÍA ACTUAL
                    </button>
                    <p className="text-[10px] text-zinc-500 text-center mt-2">
                      Esta acción desactivará el acceso del cliente
                      inmediatamente.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para crear/editar rutina */}
      <RutinaModal
        isOpen={isRutinaModalOpen}
        onClose={() => {
          setIsRutinaModalOpen(false);
          setRutinaParaEditar(null);
        }}
        client={client}
        rutinaExistente={rutinaParaEditar}
        onSave={() => {
          fetchRutinaActual();
          if (onUpdate) onUpdate();
        }}
      />
      {/* Modal para registrar nuevas medidas */}
      <AddMeasurementsModal
        isOpen={showMeasurementsModal}
        onClose={() => setShowMeasurementsModal(false)}
        client={client}
        onSave={() => {
          fetchStats();
          if (onUpdate) onUpdate();
        }}
      />
    </div>
  );
}

// Helpers
function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 p-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-all ${active ? "text-gym-orange border-gym-orange bg-white/5" : "text-gym-gray border-transparent hover:text-white hover:bg-white/5"}`}
    >
      {icon} {label}
    </button>
  );
}
function InfoField({ label, value }) {
  return (
    <div>
      <p className="text-[10px] text-gym-gray uppercase font-bold mb-0.5">
        {label}
      </p>
      <p className="text-white text-sm font-medium break-words">{value}</p>
    </div>
  );
}
