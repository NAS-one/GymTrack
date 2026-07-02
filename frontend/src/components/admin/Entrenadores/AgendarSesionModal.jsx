import { useState, useEffect } from "react";
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  DollarSign,
  User,
} from "lucide-react";
import axios from "../../../api/axios";

export function AgendarSesionModal({ isOpen, onClose, onSesionAgendada }) {
  const [clientes, setClientes] = useState([]);
  const [perfil, setPerfil] = useState(null);
  const [formData, setFormData] = useState({
    id_cliente: "",
    fecha: "",
    hora: "",
    duracion_minutos: 60,
    valor_cobrado: "",
    monto_gimnasio: "",
    monto_entrenador: "",
  });

  // Cada vez que se abra el Modal, cargamos los alumnos y el perfil
  useEffect(() => {
    if (isOpen) {
      axios
        .get("/entrenadores/mis-alumnos")
        .then((res) => setClientes(res.data.body || []))
        .catch(console.error);

      axios
        .get("/entrenadores/mi-perfil")
        .then((res) => setPerfil(res.data.body))
        .catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {

    console.log("Perfil Traído de BD:", perfil);
    console.log("¿Modelo de Contrato?:", perfil?.modelo_contrato);
    console.log("Monto escrito:", formData.valor_cobrado);

    if (perfil && formData.valor_cobrado !== "") {
      const valor = Number(formData.valor_cobrado);
      let pagoGym = 0;
      let pagoEntrenador = 0;

      if (perfil.modelo_contrato === "porcentaje") {
        pagoGym = Math.round(valor * Number(perfil.porcentaje_retencion));
        pagoEntrenador = valor - pagoGym;
      } else if (perfil.modelo_contrato === "sueldo_fijo") {
        pagoGym = valor;
        pagoEntrenador = 0;
      }

      setFormData((prev) => ({
        ...prev,
        monto_gimnasio: pagoGym,
        monto_entrenador: pagoEntrenador,
      }));
    }
  }, [formData.valor_cobrado, perfil]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    const todayStr = new Date().toISOString().split("T")[0];
    if (formData.fecha < todayStr) {
      alert("La fecha no puede ser en el pasado.");
      return;
    }

    const esFijo = perfil?.modelo_contrato === "sueldo_fijo";
    if (!esFijo && Number(formData.valor_cobrado) < 10000) {
      alert("El valor cobrado debe ser al menos 10000.");
      return;
    }

    try {
      // Postgres necesita Fecha y Hora juntos
      const fechaHora = `${formData.fecha} ${formData.hora}:00`;

      const esFijo = perfil?.modelo_contrato === "sueldo_fijo";

      await axios.post("/sesiones", {
        id_cliente: formData.id_cliente,
        fecha: fechaHora,
        duracion_minutos: Number(formData.duracion_minutos),
        valor_cobrado: esFijo ? 0 : Number(formData.valor_cobrado),
        monto_gimnasio: esFijo ? 0 : Number(formData.monto_gimnasio),
        monto_entrenador: esFijo ? 0 : Number(formData.monto_entrenador),
      });

      onSesionAgendada(); // Refresca la tabla del Entrenador
      onClose(); // Cierra el Modal
    } catch (error) {
      console.error("Error al agendar:", error);
      alert("Hubo un error al intentar agendar la sesión");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in text-white">
      <div className="bg-gym-card rounded-2xl shadow-xl w-full max-w-lg border border-white/5 overflow-hidden">
        {/* HEADER MODAL */}
        <div className="flex justify-between items-center p-6 border-b border-white/5">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CalendarIcon className="text-orange-400" />
            Agendar Nueva Sesión
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY MODAL */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-zinc-400 font-bold mb-2">
              Cliente
            </label>
            <div className="relative">
              <User
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <select
                name="id_cliente"
                required
                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white hover:border-orange-500/50 focus:border-orange-500 focus:outline-none transition-colors"
                onChange={handleChange}
              >
                <option value="">Selecciona un alumno...</option>
                {clientes.filter(c => c.estado === "active").map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
              {clientes.length > 0 && clientes.filter(c => c.estado === "active").length === 0 && (
                <p className="text-red-400 text-xs mt-2">⚠️ Ninguno de tus alumnos tiene un plan activo.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 font-bold mb-2">
                Fecha
              </label>
              <input
                type="date"
                name="fecha"
                required
                min={new Date().toISOString().split("T")[0]}
                onChange={handleChange}
                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white hover:border-orange-500/50 focus:border-orange-500 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-zinc-400 font-bold mb-2">
                Hora
              </label>
              <input
                type="time"
                name="hora"
                required
                onChange={handleChange}
                className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white hover:border-orange-500/50 focus:border-orange-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {perfil?.modelo_contrato === "porcentaje" && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] tracking-wider text-zinc-400 font-bold mb-2">
                  Monto Cobrado
                </label>
                <input
                  type="number"
                  name="valor_cobrado"
                  min="10000"
                  value={formData.valor_cobrado}
                  placeholder="Ej: 20000"
                  onChange={handleChange}
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-2 px-3 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] tracking-wider text-zinc-400 font-bold mb-2">
                  Retención Gym
                </label>
                <input
                  type="number"
                  name="monto_gimnasio"
                  value={formData.monto_gimnasio}
                  readOnly
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-2 px-3 text-white text-sm opacity-50 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-[10px] tracking-wider text-orange-400 font-bold mb-2">
                  Comisión Entrenador
                </label>
                <input
                  type="number"
                  name="monto_entrenador"
                  value={formData.monto_entrenador}
                  readOnly
                  className="w-full bg-orange-400/10 border border-orange-400/20 rounded-xl py-2 px-3 text-green-400 font-bold text-sm cursor-not-allowed"
                />
              </div>
            </div>
          )}

          {/* FOOTER MODAL */}
          <div className="flex gap-3 pt-6 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-orange-500 hover:bg-orange-600 shadow-[0_0_15px_rgba(249,115,22,0.4)] text-white rounded-xl font-medium transition-all"
            >
              Guardar Sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
