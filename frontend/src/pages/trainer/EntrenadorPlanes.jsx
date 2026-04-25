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
  ChevronDown,
  ChevronUp,
  Target,
  ClipboardList,
} from "lucide-react";
import axios from "../../api/axios";
import { toast } from "sonner";
import { useConfirm } from "../../contexts/ConfirmContext";
import { RutinaModal } from "../../components/admin/Clientes/RutinaModal";

export function EntrenadorPlanes() {
  const confirm = useConfirm();
  const [planes, setPlanes] = useState([]);
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPlan, setExpandedPlan] = useState(null);

  // Modal crear plan
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanObjetivo, setNewPlanObjetivo] = useState("");
  const [creatingPlan, setCreatingPlan] = useState(false);

  // Modal rutina (para agregar rutina a un plan)
  const [isRutinaModalOpen, setIsRutinaModalOpen] = useState(false);
  const [editingRutina, setEditingRutina] = useState(null);
  const [activePlanForRutina, setActivePlanForRutina] = useState(null);

  // Modal asignar
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [planToAssign, setPlanToAssign] = useState(null);
  const [selectedAlumno, setSelectedAlumno] = useState("");
  const [assigning, setAssigning] = useState(false);

  // --- CARGA DE DATOS ---
  const fetchDatos = async () => {
    setLoading(true);
    try {
      const [resPlanes, resAlumnos] = await Promise.all([
        axios.get("/planes-entrenamiento"),
        axios.get("/entrenadores/mis-alumnos"),
      ]);

      setPlanes(resPlanes.data.body || []);

      let alumnosData = resAlumnos.data.body || resAlumnos.data || [];
      if (alumnosData.body) alumnosData = alumnosData.body;
      setAlumnos(Array.isArray(alumnosData) ? alumnosData : []);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      toast.error("Error al cargar la información");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatos();
  }, []);

  // --- CREAR PLAN ---
  const handleCreatePlan = async () => {
    if (!newPlanName.trim() || newPlanName.trim().length < 3) {
      return toast.warning("El nombre del plan debe tener al menos 3 caracteres");
    }
    setCreatingPlan(true);
    try {
      await axios.post("/planes-entrenamiento", {
        nombre: newPlanName.trim(),
        objetivo: newPlanObjetivo.trim() || null,
      });
      toast.success("Plan creado exitosamente");
      setIsCreateModalOpen(false);
      setNewPlanName("");
      setNewPlanObjetivo("");
      fetchDatos();
    } catch (error) {
      toast.error("Error al crear el plan");
    } finally {
      setCreatingPlan(false);
    }
  };

  // --- ELIMINAR PLAN ---
  const handleDeletePlan = async (plan) => {
    const ok = await confirm({
      title: "¿Eliminar este plan?",
      description: `Se eliminará "${plan.nombre}" y todas sus rutinas-plantilla permanentemente. Las rutinas ya asignadas a alumnos NO se verán afectadas.`,
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
      type: "danger",
    });
    if (!ok) return;

    try {
      await axios.delete(`/planes-entrenamiento/${plan.id}`);
      toast.success("Plan eliminado");
      fetchDatos();
    } catch {
      toast.error("Error al eliminar el plan");
    }
  };

  // --- ELIMINAR RUTINA DE UN PLAN ---
  const handleDeleteRutina = async (rutina) => {
    const ok = await confirm({
      title: "¿Eliminar esta rutina del plan?",
      description: `Se eliminará "${rutina.nombre}" permanentemente del plan.`,
      confirmText: "Sí, eliminar",
      cancelText: "Cancelar",
      type: "danger",
    });
    if (!ok) return;

    try {
      await axios.delete(`/rutinas/${rutina.id}`);
      toast.success("Rutina eliminada del plan");
      fetchDatos();
    } catch {
      toast.error("Error al eliminar la rutina");
    }
  };

  // --- ASIGNAR PLAN A ALUMNO ---
  const handleAssign = async () => {
    if (!selectedAlumno) return toast.warning("Debes seleccionar un alumno");

    setAssigning(true);
    try {
      const res = await axios.post(`/planes-entrenamiento/${planToAssign.id}/asignar`, {
        id_cliente: selectedAlumno,
      });
      const data = res.data.body || res.data;
      toast.success("¡Plan asignado!", {
        description: `Se clonaron ${data.rutinas_clonadas || "las"} rutinas al alumno.`,
      });
      setIsAssignModalOpen(false);
    } catch (error) {
      const msg = error.response?.data?.body || error.response?.data?.message || "Error al asignar el plan";
      toast.error("Fallo al asignar", { description: String(msg) });
    } finally {
      setAssigning(false);
    }
  };

  // --- ABRIR MODAL PARA AGREGAR RUTINA AL PLAN ---
  const openAddRutina = (plan) => {
    setActivePlanForRutina(plan);
    setEditingRutina(null);
    setIsRutinaModalOpen(true);
  };

  const openEditRutina = (rutina) => {
    setEditingRutina(rutina);
    setIsRutinaModalOpen(true);
  };

  // --- TOGGLE EXPANDIR PLAN ---
  const togglePlan = (planId) => {
    setExpandedPlan(expandedPlan === planId ? null : planId);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gym-card p-6 rounded-2xl border border-white/5 shadow-lg relative overflow-hidden">
        <div className="relative z-10 w-full md:w-auto">
          <h2 className="text-2xl font-bold text-white mb-1">
            Planes de Entrenamiento
          </h2>
          <p className="text-zinc-400 text-sm">
            Crea planes con múltiples rutinas y asígnalos a tus alumnos con un
            clic.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="relative z-10 w-full md:w-auto bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white px-5 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] active:scale-95"
        >
          <Plus size={20} className="stroke-[3]" /> Crear Plan
        </button>

        <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-orange-500/10 to-transparent pointer-events-none" />
        <ClipboardList className="absolute -right-8 -bottom-8 text-white/5 w-40 h-40 transform -rotate-45 pointer-events-none" />
      </div>

      {/* LISTA DE PLANES */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-orange-500">
          <Loader2 className="w-12 h-12 animate-spin" />
        </div>
      ) : planes.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/5 mt-6">
          <ClipboardList size={48} className="mx-auto text-zinc-600 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">
            No tienes planes creados
          </h3>
          <p className="text-zinc-500 text-sm">
            Crea tu primer plan de entrenamiento para organizar tus rutinas.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {planes.map((plan) => {
            const isExpanded = expandedPlan === plan.id;

            return (
              <div
                key={plan.id}
                className="bg-gym-card rounded-2xl border border-white/5 shadow-lg overflow-hidden transition-all"
              >
                {/* CABECERA DEL PLAN */}
                <div
                  onClick={() => togglePlan(plan.id)}
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                      <ClipboardList size={22} className="text-orange-400" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white">
                        {plan.nombre}
                      </h3>
                      <div className="flex items-center gap-3 mt-0.5">
                        {plan.objetivo && (
                          <span className="text-xs text-zinc-400 flex items-center gap-1">
                            <Target size={12} className="text-orange-500" />
                            {plan.objetivo}
                          </span>
                        )}
                        <span className="text-xs text-zinc-500">
                          {plan.total_rutinas || 0} rutina(s)
                        </span>
                        <span className="text-[10px] text-zinc-600">
                          {new Date(plan.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Asignar */}
                    {plan.total_rutinas > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlanToAssign(plan);
                          setSelectedAlumno("");
                          setIsAssignModalOpen(true);
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/10 transition-all"
                      >
                        <UserCheck size={14} className="inline mr-1" />
                        Asignar
                      </button>
                    )}
                    {/* Eliminar */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePlan(plan);
                      }}
                      className="p-2 text-zinc-500 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors"
                      title="Eliminar plan"
                    >
                      <Trash2 size={16} />
                    </button>
                    {/* Expand/Collapse */}
                    {isExpanded ? (
                      <ChevronUp size={20} className="text-zinc-500" />
                    ) : (
                      <ChevronDown size={20} className="text-zinc-500" />
                    )}
                  </div>
                </div>

                {/* CONTENIDO EXPANDIDO: RUTINAS DEL PLAN */}
                {isExpanded && (
                  <div className="border-t border-white/5 bg-black/20 p-5 space-y-3 animate-fade-in">
                    {plan.rutinas && plan.rutinas.length > 0 ? (
                      plan.rutinas.map((rutina) => (
                        <div
                          key={rutina.id}
                          className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl p-4 hover:border-orange-500/20 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-white/10 flex items-center justify-center">
                              <Dumbbell
                                size={16}
                                className="text-orange-400"
                              />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">
                                {rutina.nombre}
                              </p>
                              <p className="text-[10px] text-zinc-500">
                                {rutina.total_ejercicios || 0} ejercicios
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => openEditRutina(rutina)}
                              className="px-3 py-1.5 text-xs font-bold text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/10 transition-all"
                            >
                              <Edit3 size={12} className="inline mr-1" />
                              Editar
                            </button>
                            <button
                              onClick={() => handleDeleteRutina(rutina)}
                              className="px-3 py-1.5 text-xs font-bold text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-all"
                            >
                              <Trash2 size={12} className="inline mr-1" />
                              Quitar
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-zinc-500 text-center py-4">
                        Este plan no tiene rutinas aún.
                      </p>
                    )}

                    {/* Botón agregar rutina al plan */}
                    <button
                      onClick={() => openAddRutina(plan)}
                      className="w-full py-3 rounded-xl border-2 border-dashed border-white/10 text-zinc-400 hover:text-orange-400 hover:border-orange-500/30 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                    >
                      <Plus size={18} /> Agregar Rutina al Plan
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========== MODAL CREAR PLAN ========== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[70] p-4 animate-fade-in">
          <div className="bg-[#111113] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                Crear Plan de Entrenamiento
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">
                  Nombre del Plan *
                </label>
                <input
                  type="text"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  placeholder='Ej: "Hipertrofia 4 Semanas"'
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500 outline-none placeholder:text-zinc-600"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider block mb-2">
                  Objetivo (opcional)
                </label>
                <input
                  type="text"
                  value={newPlanObjetivo}
                  onChange={(e) => setNewPlanObjetivo(e.target.value)}
                  placeholder='Ej: "Ganar masa muscular"'
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500 outline-none placeholder:text-zinc-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="py-3 rounded-xl border border-white/10 text-white font-medium hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreatePlan}
                  disabled={creatingPlan}
                  className="py-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creatingPlan ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Plus size={16} />
                  )}
                  Crear Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL ASIGNAR A ALUMNO ========== */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[70] p-4 animate-fade-in">
          <div className="bg-[#111113] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">
                Asignar Plan a Alumno
              </h3>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-zinc-400 mb-2">
              Se clonarán todas las rutinas del plan{" "}
              <strong className="text-white">
                "{planToAssign?.nombre}"
              </strong>{" "}
              ({planToAssign?.total_rutinas} rutinas) como rutinas activas del
              alumno seleccionado.
            </p>
            <p className="text-[10px] text-zinc-600 mb-6">
              El plan original no se modifica. Las rutinas del alumno son copias
              independientes.
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
                  ¡Asignar!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL CREAR/EDITAR RUTINA ========== */}
      <RutinaModal
        isOpen={isRutinaModalOpen}
        onClose={() => {
          setIsRutinaModalOpen(false);
          setActivePlanForRutina(null);
          setEditingRutina(null);
        }}
        rutinaExistente={editingRutina}
        isTemplate={true}
        idPlan={activePlanForRutina?.id || null}
        onSave={fetchDatos}
      />
    </div>
  );
}
