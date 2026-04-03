import { useState, useEffect } from "react";
import {
  Plus,
  Dumbbell,
  CalendarDays,
  Edit3,
  UserCheck,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import axios from "../api/axios";
import { toast } from "sonner";
import { RutinaModal } from "../components/admin/Clientes/RutinaModal";

export function EntrenadorRutinas() {
  const [plantillas, setPlantillas] = useState([]);
  const [alumnos, setAlumnos] = useState([]); // Nueva variable para guardar a los alumnos
  const [loading, setLoading] = useState(true);

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlantilla, setEditingPlantilla] = useState(null);

  // Modal de Asignación
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [plantillaToAssign, setPlantillaToAssign] = useState(null);
  const [selectedAlumno, setSelectedAlumno] = useState("");
  const [assigning, setAssigning] = useState(false);

  const fetchDatos = async () => {
    setLoading(true);
    try {
      // Cargamos plantillas y alumnos al mismo tiempo
      const [resPlantillas, resAlumnos] = await Promise.all([
        axios.get("/rutinas/plantillas/mis-plantillas"),
        axios.get("/entrenadores/mis-alumnos"),
      ]);

      setPlantillas(resPlantillas.data.body || []);

      let alumnosData = resAlumnos.data.body || resAlumnos.data || [];
      if (alumnosData.body) alumnosData = alumnosData.body;
      setAlumnos(Array.isArray(alumnosData) ? alumnosData : []);
    } catch (error) {
      console.error("Error al cargar datos", error);
      toast.error("Error al cargar la información");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatos();
  }, []);

  // --- ACCIONES DE PLANTILLAS ---
  const openCreateModal = () => {
    setEditingPlantilla(null);
    setIsModalOpen(true);
  };

  const openEditModal = (plantilla) => {
    setEditingPlantilla(plantilla);
    setIsModalOpen(true);
  };

  const eliminarPlantilla = async (id, nombre) => {
    if (
      !window.confirm(
        `¿Estás seguro de que deseas eliminar permanentemente la plantilla "${nombre}"?`,
      )
    )
      return;

    try {
      await axios.delete(`/rutinas/${id}`);
      toast.success("Plantilla eliminada correctamente");
      fetchDatos();
    } catch (error) {
      toast.error("Error al eliminar la plantilla");
    }
  };

  // --- LÓGICA DE ASIGNACIÓN ---
  const openAssignModal = (plantilla) => {
    setPlantillaToAssign(plantilla);
    setSelectedAlumno("");
    setIsAssignModalOpen(true);
  };

  const handleAssign = async () => {
    if (!selectedAlumno) return toast.warning("Debes seleccionar un alumno");

    setAssigning(true);
    try {
      await axios.post(`/rutinas/${plantillaToAssign.id}/asignar`, {
        id_cliente: selectedAlumno,
      });
      toast.success("¡Rutina asignada!", {
        description: `Se creó una copia de la rutina para el alumno.`,
      });
      setIsAssignModalOpen(false);
    } catch (error) {
      const msg =
        error.response?.data?.error || "Error al asignar la plantilla";
      toast.error("Fallo al asignar", { description: msg });
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gym-card p-6 rounded-2xl border border-white/5 shadow-lg relative overflow-hidden">
        <div className="relative z-10 w-full md:w-auto">
          <h2 className="text-2xl font-bold text-white mb-1">
            Mis Plantillas Master
          </h2>
          <p className="text-zinc-400 text-sm">
            Diseña tus rutinas secretas y clónalas al instante a cualquier
            alumno.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="relative z-10 w-full md:w-auto bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-95"
        >
          <Plus size={20} className="stroke-[3]" /> Crear Plantilla Básica
        </button>

        <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-orange-500/10 to-transparent pointer-events-none" />
        <Dumbbell className="absolute -right-8 -bottom-8 text-white/5 w-40 h-40 transform -rotate-45 pointer-events-none" />
      </div>

      {/* GRID DE TARJETAS */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-orange-500">
          <Loader2 className="w-12 h-12 animate-spin" />
        </div>
      ) : plantillas.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/5 mt-6">
          <h3 className="text-lg font-bold text-white mb-2">
            Tu librería está vacía
          </h3>
          <p className="text-zinc-500 text-sm">
            Empieza a diseñar tus rutinas maestras para asignar rápidamente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {plantillas.map((p) => {
            const diasUnicos = new Set((p.plan || []).map((d) => d.dia)).size;

            return (
              <div
                key={p.id}
                className="relative bg-gym-card rounded-2xl p-5 border border-white/10 shadow-lg flex flex-col group hover:border-orange-500/30 transition-all"
              >
                {/* Botón Eliminar en la esquina superior derecha */}
                <button
                  onClick={() => eliminarPlantilla(p.id, p.nombre)}
                  className="absolute top-3 right-3 p-2 bg-black/40 text-zinc-500 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors"
                  title="Eliminar plantilla"
                >
                  <Trash2 size={16} />
                </button>

                <div className="flex justify-between items-start mb-4 pr-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                      <Dumbbell size={20} className="text-orange-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white group-hover:text-orange-400 transition-colors uppercase tracking-wide">
                        {p.nombre}
                      </h3>
                      <p className="text-xs text-zinc-500 font-medium">
                        Plantilla Master
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex bg-black/40 rounded-xl p-3 mb-6 border border-white/5 divide-x divide-white/10">
                  <div className="flex-1 flex flex-col items-center">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">
                      Ejercicios
                    </span>
                    <span className="text-white font-bold">
                      {p.total_ejercicios || 0}
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col items-center">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">
                      Días x Sem
                    </span>
                    <span className="text-white font-bold flex items-center gap-1">
                      <CalendarDays size={14} className="text-orange-500" />{" "}
                      {diasUnicos}
                    </span>
                  </div>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-3">
                  <button
                    onClick={() => openEditModal(p)}
                    className="py-2.5 rounded-xl border border-white/10 text-white hover:bg-white/10 text-sm font-medium flex items-center justify-center gap-2 transition-all"
                  >
                    <Edit3 size={16} /> Editar
                  </button>
                  <button
                    onClick={() => openAssignModal(p)}
                    className="py-2.5 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/40 text-sm font-medium flex items-center justify-center gap-2 transition-all"
                  >
                    <UserCheck size={16} /> Asignar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL CREAR/EDITAR PLANTILLA */}
      <RutinaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        rutinaExistente={editingPlantilla}
        isTemplate={true}
        onSave={fetchDatos}
      />

      {/* MODAL ASIGNAR A ALUMNO */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[70] p-4 animate-fade-in">
          <div className="bg-[#111113] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Clonar a Alumno</h3>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-zinc-400 mb-6">
              Selecciona a quién le asignarás la plantilla{" "}
              <strong className="text-white">
                "{plantillaToAssign?.nombre}"
              </strong>
              . Esto reemplazará su rutina actual.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">
                  Selecciona a tu alumno
                </label>
                <select
                  value={selectedAlumno}
                  onChange={(e) => setSelectedAlumno(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500 outline-none"
                >
                  <option value="">-- Elige un Alumno --</option>
                  {alumnos.map((al) => (
                    <option key={al.id} value={al.id}>
                      {al.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={() => setIsAssignModalOpen(false)}
                  className="py-3 rounded-xl border border-white/10 text-white font-medium hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAssign}
                  disabled={assigning}
                  className="py-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {assigning ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <UserCheck size={16} />
                  )}
                  ¡Clonar!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
