import { useState, useEffect, useContext } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  CheckCircle2,
  DollarSign,
  Plus,
} from "lucide-react";
import axios from "../../../api/axios";
import { AuthContext } from "../../../contexts/AuthContext";
import { AgendarSesionModal } from "../../../components/admin/Entrenadores/AgendarSesionModal";

export function AgendaDiaria() {
  const { user } = useContext(AuthContext);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [sesiones, setSesiones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  //Formateamos la fecha para base de datos (YYYY-MM-DD)
  const getFechaBD = (date) => date.toISOString().split("T")[0];

  //Formateamos la hora - ahora viene pre-formateada del SQL con TO_CHAR
  const formatHora = (sesion) => {
    // Usamos el campo hora_formateada que viene directo de PostgreSQL (sin conversión de zona)
    return sesion.hora_formateada || "--:--";
  };

  const fetchAgenda = async () => {
    setLoading(true);
    try {
      const FechaBD = getFechaBD(fechaSeleccionada);
      //Buscamos las sesiones de hoy para este entrenador
      const res = await axios.get(
        `/sesiones/agenda/${user.id}?fecha=${FechaBD}`,
      );
      setSesiones(res.data.body || []);
    } catch (error) {
      console.error("Error cargando agenda:", error);
    } finally {
      setLoading(false);
    }
  };

  const confirmarSesion = async (idSesion) => {
    try {
      await axios.patch(`/sesiones/${idSesion}/estado`, {
        estado: "realizada",
      });
      fetchAgenda();
    } catch (error) {
      console.error("Error confirmando la sesión:", error);
      alert("Hubo un error al confirmar la clase.");
    }
  };

  //Recargar datos cada vez que el usuario cambie de dia
  useEffect(() => {
    if (user?.id) fetchAgenda();
  }, [fechaSeleccionada, user]);

  const cambiarDia = (offset) => {
    const nuevaFecha = new Date(fechaSeleccionada);
    nuevaFecha.setDate(nuevaFecha.getDate() + offset);
    setFechaSeleccionada(nuevaFecha);
  };

  const fechaFormateada = fechaSeleccionada.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* HEADER CON SELECTOR DE FECHA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gym-card p-6 rounded-2xl border border-white/5 shadow-lg">
        <div>
          <h2 className="text-2xl font-bold text-white capitalize">
            {fechaFormateada}
          </h2>
          <p className="text-gym-gray text-sm">
            Gestiona tus clases y comisiones del día.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full md:w-auto bg-gym-orange hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg"
          >
            <Plus size={20} /> Agendar Sesión
          </button>
        </div>

        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/10">
          <button
            onClick={() => cambiarDia(-1)}
            className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="px-4 py-1 flex items-center gap-2 text-sm font-bold text-orange-400 min-w-[100px] justify-center">
            <CalendarIcon size={16} /> Hoy
          </div>
          <button
            onClick={() => cambiarDia(1)}
            className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* TIMELINE DE SESIONES */}
      <div className="relative border-l-2 border-white/10 ml-4 md:ml-6 space-y-8 mt-8">
        {loading ? (
          <div className="pl-8 text-zinc-500 animate-pulse">
            Cargando agenda...
          </div>
        ) : sesiones.length === 0 ? (
          <div className="pl-8 text-zinc-500 italic flex items-center gap-2">
            No tienes sesiones agendadas para este día. ¡Día libre!
          </div>
        ) : (
          sesiones.map((sesion) => (
            <div key={sesion.id} className="relative pl-8">
              {/* Círculo indicador en la línea */}
              <div
                className={`absolute -left-[9px] top-4 w-4 h-4 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] ${
                  sesion.estado === "realizada"
                    ? "bg-green-500"
                    : sesion.estado === "cancelada"
                      ? "bg-red-500"
                      : "bg-orange-500"
                }`}
              ></div>

              <div className="bg-gym-card border border-white/5 p-5 rounded-2xl hover:border-orange-500/30 transition-all group max-w-2xl">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex gap-4">
                    {/* Inicial del cliente */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center text-white text-xl font-bold uppercase shadow-inner">
                      {sesion.nombre_cliente.charAt(0)}
                    </div>

                    <div>
                      <h3 className="text-white font-bold text-lg">
                        {sesion.nombre_cliente}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5">
                        <span className="flex items-center gap-1.5 text-xs text-zinc-400 bg-black/30 px-2 py-1 rounded-md">
                          <Clock size={14} className="text-orange-400" />
                          {formatHora(sesion)} ({sesion.duracion_minutos}{" "}
                          min)
                        </span>

                        {/* Estado Dinámico */}
                        <span
                          className={`flex items-center gap-1 text-xs font-medium ${
                            sesion.estado === "realizada"
                              ? "text-green-400"
                              : sesion.estado === "cancelada"
                                ? "text-red-400"
                                : "text-orange-400"
                          }`}
                        >
                          <CheckCircle2 size={14} />
                          {sesion.estado.charAt(0).toUpperCase() +
                            sesion.estado.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Etiqueta de Ganancia (Monto Entrenador) y Boton */}
                  <div className="flex flex-col items-end justify-center gap-3">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">
                        Tu Comisión
                      </span>
                      <span className="flex items-center text-green-400 font-mono font-bold text-lg bg-green-400/10 px-3 py-1 rounded-lg border border-green-400/20">
                        <DollarSign size={16} className="mr-0.5" />
                        {sesion.monto_entrenador}
                      </span>
                    </div>

                    {/* BOTON CONDICIONAL DE CONFIRMAR */}
                    {sesion.estado === "agendada" && (
                      <button
                        onClick={() => confirmarSesion(sesion.id)}
                        className="text-xs bg-green-500/20 hover:bg-green-500/40 text-green-400 px-3 py-1.5 rounded-lg transition-colors border border-green-500/30 flex items-center gap-1 font-bold shadow-[0_0_10px_rgba(34,197,94,0.1)]"
                      >
                        <CheckCircle2 size={14} /> Confirmar Clase
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <AgendarSesionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSesionAgendada={() => {
          //Cuando se guarda la sesion con exito, recargamos la lista
          fetchAgenda();
        }}
      />
    </div>
  );
}
