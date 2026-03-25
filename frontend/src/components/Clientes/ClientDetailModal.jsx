import { useState, useEffect } from 'react';
import { X, User, CreditCard, Activity, Calendar, CheckCircle, MapPin, Ban, History, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import axios from '../../api/axios';
import { useConfirm } from '../../contexts/ConfirmContext';
import { toast } from 'sonner'; // <-- IMPORTACIÓN CORRECTA

export function ClientDetailModal({ isOpen, onClose, client, onUpdate }) {
  const confirm = useConfirm();

  const [activeTab, setActiveTab] = useState('profile');
  const [processing, setProcessing] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);

  // Estado del Formulario de Pago
  const [paymentData, setPaymentData] = useState({
    id_plan: '',
    nombre_plan: '',
    meses: 1,
    monto: 0,
    metodo: 'Efectivo'
  });

  // Datos del Backend
  const [history, setHistory] = useState([]);
  const [weightData, setWeightData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [availablePlans, setAvailablePlans] = useState([]);

  // --- CARGA DE DATOS ---
  useEffect(() => {
    if (isOpen && client) {
      setActiveTab('profile'); // Reset tab al abrir
      fetchStats();
    }
  }, [isOpen, client]);

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
        setPaymentData(prev => ({
          ...prev,
          id_plan: first.id,
          nombre_plan: first.nombre,
          monto: first.precio,
          meses: first.duracion_meses
        }));
      }

      const formattedWeight = medidas ? medidas.map(m => ({
        fecha: new Date(m.fecha_registro).toLocaleDateString('es-CL', { month: 'short', day: 'numeric' }),
        peso: parseFloat(m.peso),
        grasa: parseFloat(m.porcentaje_grasa)
      })) : [];
      setWeightData(formattedWeight);

      const visitsByMonth = asistencia ? asistencia.reduce((acc, curr) => {
        const dateObj = new Date(curr.fecha_entrada);
        const month = dateObj.toLocaleDateString('es-CL', { month: 'short' });
        const key = `${month}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}) : {};

      const formattedAttendance = Object.keys(visitsByMonth).map(key => ({
        mes: key,
        visitas: visitsByMonth[key]
      }));
      setAttendanceData(formattedAttendance);

    } catch (error) {
      console.error("Error cargando stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (!isOpen || !client) return null;

  // --- LÓGICA DE NEGOCIO ---

  const handlePlanSelect = (planObj) => {
    setPaymentData(prev => ({
      ...prev,
      id_plan: planObj.id,
      nombre_plan: planObj.nombre,
      monto: planObj.precio,
      meses: planObj.duracion_meses
    }));
  };

  const handlePayment = async (e) => {
    e.preventDefault();

    // REEMPLAZO 1: alert() por toast.warning()
    if (!paymentData.id_plan) {
      return toast.warning("Seleccione un plan primero", {
        description: "Debe seleccionar un plan de la lista para continuar."
      });
    }

    const isConfirmed = await confirm({
      title: 'Confirmar Pago',
      description: `¿Registrar renovación del ${paymentData.nombre_plan} por un monto de $${parseInt(paymentData.monto).toLocaleString()}?`,
      confirmText: 'Sí, confirmar pago',
      cancelText: 'Cancelar',
      type: 'success'
    });

    if (!isConfirmed) return;

    setProcessing(true);
    try {
      const payload = {
        id_cliente: client.id,
        id_plan: paymentData.id_plan,
        meses_duracion: paymentData.meses,
        monto: paymentData.monto,
        metodo_pago: paymentData.metodo
      };

      await axios.post('/pagos/renovar', payload);

      // REEMPLAZO 2: alert() por toast.success()
      toast.success("Membresía Renovada", {
        description: `El pago de $${parseInt(paymentData.monto).toLocaleString()} ha sido registrado.`
      });

      fetchStats();
      if (onUpdate) onUpdate();
      onClose();
    } catch (error) {
      console.error("Error pago:", error);
      const msg = error.response?.data?.error || error.response?.data?.message || "Error al procesar pago";

      // REEMPLAZO 3: alert() por toast.error()
      toast.error("Error al registrar el pago", {
        description: msg
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelMembership = async () => {
    const isConfirmed = await confirm({
      title: '¿Cancelar Membresía?',
      description: 'El cliente perderá el acceso inmediato a las instalaciones y no se podrá revertir esta acción.',
      confirmText: 'Sí, cancelar plan',
      cancelText: 'Volver',
      type: 'danger'
    });

    if (!isConfirmed) return;

    setProcessing(true);
    try {
      await axios.post('/pagos/cancelar', { id_cliente: client.id });

      // REEMPLAZO 4: alert() por toast.success()
      toast.success("Membresía Cancelada", {
        description: "El cliente ha perdido el acceso al gimnasio."
      });

      if (onUpdate) onUpdate();
      onClose();
    } catch (error) {
      // REEMPLAZO 5: alert() por toast.error()
      toast.error("Error al cancelar la membresía", {
        description: "Ocurrió un problema de comunicación con el servidor."
      });
    } finally {
      setProcessing(false);
    }
  };

  const calculateAge = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const today = new Date();
      const birthDate = new Date(dateString);
      let age = today.getFullYear() - birthDate.getFullYear();
      if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) age--;
      return `${age} años`;
    } catch { return 'N/A'; }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-gym-card border border-white/10 w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">

        {/* SIDEBAR (PERFIL RÁPIDO) */}
        <div className="w-full md:w-1/3 bg-black/20 border-r border-white/5 p-6 flex flex-col items-center text-center overflow-y-auto">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-lg shadow-blue-500/20">
            {client.nombre.charAt(0)}
          </div>
          <h2 className="text-xl font-bold text-white leading-tight">{client.nombre}</h2>
          <p className="text-gym-gray text-sm mb-6 mt-1">{client.rut}</p>

          <div className="w-full space-y-3">
            <div className={`p-3 rounded-xl border border-white/5 ${client.estado_membresia === 'active' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
              <p className="text-xs text-gym-gray uppercase font-bold">Estado Membresía</p>
              <p className={`font-bold text-lg ${client.estado_membresia === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                {client.estado_membresia === 'active' ? 'ACTIVO' : 'INACTIVO'}
              </p>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
              <p className="text-xs text-gym-gray uppercase font-bold">Entrenador</p>
              <p className="text-white font-medium">{client.nombre_entrenador || 'Sin asignar'}</p>
            </div>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex-1 flex flex-col bg-gym-dark min-w-0">

          {/* TABS */}
          <div className="flex border-b border-white/5 bg-black/10 shrink-0">
            <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User size={18} />} label="Perfil" />
            <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<Activity size={18} />} label="Progreso" />
            <TabButton active={activeTab === 'payment'} onClick={() => setActiveTab('payment')} icon={<CreditCard size={18} />} label="Pagos" />
            <button onClick={onClose} className="p-4 text-gym-gray hover:text-white border-l border-white/5 hover:bg-white/5 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* BODY SCROLLABLE */}
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar relative">
            {loadingStats && <div className="absolute inset-0 bg-gym-dark/80 z-20 flex items-center justify-center text-gym-orange font-bold animate-pulse">Cargando datos...</div>}

            {/* 1. PERFIL COMPLETO */}
            {activeTab === 'profile' && (
              <div className="space-y-6 animate-fade-in">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><User size={20} className="text-gym-orange" /> Datos Personales</h3>
                <div className="grid grid-cols-2 gap-6">
                  <InfoField label="Edad" value={calculateAge(client.fecha_nacimiento)} />
                  <InfoField label="Género" value={client.genero || '--'} />
                  <InfoField label="Nacimiento" value={client.fecha_nacimiento ? new Date(client.fecha_nacimiento).toLocaleDateString() : '--'} />
                  <InfoField label="Email" value={client.email} />
                </div>
                <div className="pt-4 border-t border-white/5">
                  <InfoField label="Dirección" value={client.direccion || 'Sin dirección registrada'} />
                </div>
                <div className="pt-4">
                  <InfoField label="Objetivo" value={client.objetivo || 'No definido'} />
                </div>
              </div>
            )}

            {/* 2. PROGRESO (Gráficos) */}
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-fade-in">

                {/* Gráfico Peso */}
                <div className="bg-black/20 p-4 rounded-xl border border-white/5 h-64">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm font-bold text-white flex items-center gap-2"><TrendingUp size={16} className="text-blue-400" /> Evolución de Peso</p>
                    {weightData.length > 0 && <span className="text-xs text-green-400 font-bold">Último: {weightData[weightData.length - 1].peso}kg</span>}
                  </div>
                  {weightData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weightData}>
                        <defs>
                          <linearGradient id="colorPeso" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="fecha" stroke="#666" tick={{ fontSize: 10 }} />
                        <YAxis domain={['dataMin - 2', 'dataMax + 2']} stroke="#666" tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }} />
                        <Area type="monotone" dataKey="peso" stroke="#3B82F6" fillOpacity={1} fill="url(#colorPeso)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gym-gray text-sm">
                      <Activity size={32} className="mb-2 opacity-20" />
                      Sin registros de peso
                    </div>
                  )}
                </div>

                {/* Gráfico Asistencia */}
                <div className="bg-black/20 p-4 rounded-xl border border-white/5 h-56">
                  <p className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Calendar size={16} className="text-gym-orange" /> Asistencias por Mes</p>
                  {attendanceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={attendanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="mes" stroke="#666" tick={{ fontSize: 10 }} />
                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }} />
                        <Bar dataKey="visitas" fill="#F97316" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gym-gray text-sm">
                      <Clock size={32} className="mb-2 opacity-20" />
                      Sin asistencias recientes
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. PAGOS Y RENOVACIÓN */}
            {activeTab === 'payment' && (
              <div className="animate-fade-in space-y-6">

                <div className="bg-black/20 p-5 rounded-xl border border-white/5">
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><CreditCard size={16} /> Renovar / Nuevo Plan</h3>
                  <form onSubmit={handlePayment} className="space-y-4">

                    {/* GRID DE PLANES DINÁMICO */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {availablePlans.length > 0 ? availablePlans.map(plan => (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => handlePlanSelect(plan)}
                          className={`py-2 px-1 rounded text-xs font-bold border transition-all truncate flex flex-col items-center justify-center gap-1 h-16
                                        ${paymentData.id_plan === plan.id
                              ? 'bg-gym-orange border-gym-orange text-white ring-2 ring-orange-500/30'
                              : 'border-white/10 text-gym-gray hover:border-white/30 hover:bg-white/5'}`
                          }
                        >
                          <span className="truncate w-full text-center">{plan.nombre}</span>
                          <span className="opacity-80 font-mono">${parseInt(plan.precio).toLocaleString()}</span>
                        </button>
                      )) : <p className="col-span-3 text-xs text-red-400 text-center py-2 bg-red-500/10 rounded">No hay planes configurados en el sistema</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-gym-gray uppercase font-bold mb-1 block">Monto a Pagar ($)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                          <input
                            type="text"
                            className="w-full bg-gym-dark border border-white/10 rounded-lg pl-6 pr-3 py-2 text-white text-sm font-mono font-bold"
                            value={parseInt(paymentData.monto).toLocaleString()}
                            readOnly
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-gym-gray uppercase font-bold mb-1 block">Método de Pago</label>
                        <select
                          className="w-full bg-gym-dark border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-gym-orange cursor-pointer"
                          value={paymentData.metodo}
                          onChange={(e) => setPaymentData({ ...paymentData, metodo: e.target.value })}
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
                      {processing ? 'Procesando...' : <><CheckCircle size={18} /> Confirmar Pago</>}
                    </button>
                  </form>
                </div>

                {/* Tabla Historial */}
                <div>
                  <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><History size={16} /> Historial de Pagos</h3>
                  <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden max-h-40 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-white/5 text-gym-gray sticky top-0">
                        <tr><th className="p-3">Fecha</th><th className="p-3">Plan</th><th className="p-3 text-right">Monto</th></tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {history.length > 0 ? history.map((pago, i) => (
                          <tr key={i} className="hover:bg-white/5 transition-colors">
                            <td className="p-3 text-white">{new Date(pago.fecha_pago).toLocaleDateString()}</td>
                            <td className="p-3 text-white">{pago.tipo_plan || 'Plan Antiguo'}</td>
                            <td className="p-3 text-right text-green-400 font-mono">${parseInt(pago.monto).toLocaleString()}</td>
                          </tr>
                        )) : <tr><td colSpan="3" className="p-4 text-center text-gym-gray">Sin pagos registrados</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Botón Cancelar (Zona de Peligro) */}
                {client.estado_membresia === 'active' && (
                  <div className="pt-4 border-t border-white/10">
                    <button onClick={handleCancelMembership} disabled={processing} className="w-full py-3 text-xs text-red-500 hover:text-white font-bold border border-red-500/30 rounded-xl hover:bg-red-500 transition-colors flex items-center justify-center gap-2">
                      <Ban size={14} /> CANCELAR MEMBRESÍA ACTUAL
                    </button>
                    <p className="text-[10px] text-zinc-500 text-center mt-2">Esta acción desactivará el acceso del cliente inmediatamente.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helpers
function TabButton({ active, onClick, icon, label }) {
  return <button onClick={onClick} className={`flex-1 p-4 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-all ${active ? 'text-gym-orange border-gym-orange bg-white/5' : 'text-gym-gray border-transparent hover:text-white hover:bg-white/5'}`}>{icon} {label}</button>;
}
function InfoField({ label, value }) {
  return <div><p className="text-[10px] text-gym-gray uppercase font-bold mb-0.5">{label}</p><p className="text-white text-sm font-medium break-words">{value}</p></div>;
}