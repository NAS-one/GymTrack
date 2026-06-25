import { useState, useEffect, useContext } from "react";
import {
  X,
  Plus,
  Trash2,
  Dumbbell,
  ChevronDown,
  Loader2,
  Save,
} from "lucide-react";
import axios from "../../../api/axios";
import { toast } from "sonner";
import { AuthContext } from "../../../contexts/AuthContext";
import { EjercicioCatalogo } from "./EjercicioCatalogo";

const DIAS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

const EMPTY_ROW = {
  id_ejercicio: "",
  dia: "Lunes",
  series: 3,
  repeticiones: "10",
  carga_proyectada: "",
};

export function RutinaModal({
  isOpen,
  onClose,
  client,
  onSave,
  rutinaExistente,
  isTemplate,
  idPlan,
}) {
  const { user } = useContext(AuthContext);
  const [nombre, setNombre] = useState("");
  const [filas, setFilas] = useState([{ ...EMPTY_ROW }]);
  const [ejercicios, setEjercicios] = useState([]);
  const [loadingEjercicios, setLoadingEjercicios] = useState(false);
  const [saving, setSaving] = useState(false);
  const [entrenadorId, setEntrenadorId] = useState(null);
  const [catalogoOpenIdx, setCatalogoOpenIdx] = useState(null);

  // Cargar ejercicios y auto-completar si estamos en modo edición
  useEffect(() => {
    if (!isOpen) return;
    fetchEjercicios();
    if (rutinaExistente) {
      //MODO EDICIÓN
      setNombre(rutinaExistente.nombre);
      if (rutinaExistente.plan && rutinaExistente.plan.length > 0) {
        const filasAdaptadas = rutinaExistente.plan.map((ej) => ({
          id_ejercicio: ej.id_ejercicio,
          dia: ej.dia,
          series: ej.series,
          repeticiones: ej.repeticiones,
          carga_proyectada: ej.carga_proyectada || "",
        }));
        setFilas(filasAdaptadas);
      } else {
        setFilas([{ ...EMPTY_ROW }]);
      }
    } else {
      //MODO CREACIÓN NUEVA (limpiamos todo)
      setNombre("");
      setFilas([{ ...EMPTY_ROW }]);
    }
  }, [isOpen, rutinaExistente]);

  const fetchEjercicios = async () => {
    setLoadingEjercicios(true);
    try {
      const res = await axios.get("/ejercicios");
      let data = res.data.body || res.data || [];
      if (data.body) data = data.body;
      setEjercicios(Array.isArray(data) ? data : []);
    } catch {
      toast.error("No se pudieron cargar los ejercicios");
    } finally {
      setLoadingEjercicios(false);
    }
  };

  // Agrupar ejercicios por grupo muscular para el <optgroup>
  const ejerciciosPorMusculo = ejercicios.reduce((acc, ej) => {
    const grupo = ej.grupo_muscular || "Otros";
    if (!acc[grupo]) acc[grupo] = [];
    acc[grupo].push(ej);
    return acc;
  }, {});

  const handleFilaChange = (index, field, value) => {
    setFilas((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  //Detectar si la fila actual es un ejercicio de cardio
  const esCardio = (fila) => {
    const ej = ejercicios.find(
      (e) => String(e.id) === String(fila.id_ejercicio),
    );
    return ej?.grupo_muscular?.toLowerCase() === "cardio";
  };

  const agregarFila = () => {
    setFilas((prev) => [...prev, { ...EMPTY_ROW }]);
  };

  const eliminarFila = (index) => {
    if (filas.length === 1) return;
    setFilas((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nombre.trim()) {
      toast.warning("Pon un nombre a la rutina");
      return;
    }
    const invalidas = filas.filter((f) => !f.id_ejercicio);
    if (invalidas.length > 0) {
      toast.warning("Selecciona un ejercicio en cada fila");
      return;
    }

    const entrenadorId = client?.id_entrenador || user?.id;

    // Usamos el entrenadorId resuelto (del cliente o del fallback /mi-perfil)
    if (!entrenadorId) {
      toast.error("No se pudo identificar al entrenador", {
        description: "Refrescá la página (F5) e intentá de nuevo.",
      });
      return;
    }

    const payload = {
      nombre: nombre.trim(),
      id_cliente: client ? (client.id_cliente || client.id) : null,
      es_plantilla: isTemplate || false,
      id_entrenador: entrenadorId,
      activa: true,
      id_plan: idPlan || undefined,
      detalles: filas.map((f) => ({
        id_ejercicio: f.id_ejercicio,
        dia: f.dia,
        series: Number(f.series),
        repeticiones: String(f.repeticiones),
        carga_proyectada: f.carga_proyectada || undefined,
      })),
    };

    setSaving(true);
    try {
      if (rutinaExistente) {
        // MODO EDICIÓN
        await axios.put(`/rutinas/${rutinaExistente.id}`, payload);
        toast.success("Rutina actualizada", {
          description: `"${nombre}" fue modificada con éxito.`,
        });
      } else {
        // MODO CREACIÓN
        await axios.post("/rutinas", payload);
        if (isTemplate) {
          toast.success("Plantilla Guardada", {
            description: `Ya puedes clonar ${nombre}.`,
          });
        } else {
          toast.success("Rutina asignada", {
            description: `"${nombre} fue creada para ${client.nombre}.`,
          });
        }
      }

      if (onSave) onSave();
      onClose();
    } catch (err) {
      const msg =
        err.response?.data?.body ||
        err.response?.data?.message ||
        "Error al guardar la rutina";
      toast.error("Error al guardar", { description: String(msg) });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || (!client && !isTemplate && !idPlan)) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-fade-in">
      <div className="bg-[#111113] border border-white/10 w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center">
              <Dumbbell size={18} className="text-orange-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">
                {rutinaExistente ? "Editar Rutina" : "Nueva Rutina"}
              </h2>
              {!isTemplate && client && (
                <p className="text-zinc-500 text-xs">
                  Para:{" "}
                  <span className="text-zinc-300 font-medium">
                    {client.nombre}
                  </span>
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── BODY ── */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            {/* Nombre de la rutina */}
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5 block">
                Nombre de la Rutina *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Fullbody Fase 1, Push-Pull-Legs..."
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/30 outline-none transition-all"
              />
            </div>

            {/* Tabla de ejercicios */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Ejercicios ({filas.length})
                </label>
                {loadingEjercicios && (
                  <span className="text-xs text-zinc-500 flex items-center gap-1.5">
                    <Loader2 size={12} className="animate-spin" /> Cargando
                    ejercicios...
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {/* Cabecera de columnas */}
                <div className="hidden md:grid grid-cols-[2fr_1fr_60px_100px_120px_36px] gap-2 px-3">
                  {[
                    "Ejercicio",
                    "Día",
                    "Series / Mín",
                    "Reps / Intensidad",
                    "Carga (kg)",
                    "",
                  ].map((h) => (
                    <span
                      key={h}
                      className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider"
                    >
                      {h}
                    </span>
                  ))}
                </div>

                {/* Filas dinámicas */}
                {filas.map((fila, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 md:grid-cols-[2fr_1fr_60px_100px_120px_36px] gap-2 bg-white/3 hover:bg-white/5 border border-white/5 rounded-xl p-3 transition-colors group"
                  >
                    {/* Selector de ejercicio */}
                    <button
                      type="button"
                      onClick={() => setCatalogoOpenIdx(idx)}
                      className={`w-full text-left bg-black/40 border rounded-lg px-3 py-2 text-sm outline-none transition-all cursor-pointer hover:border-orange-500/50 flex items-center gap-2 ${
                        fila.id_ejercicio
                          ? "border-white/10 text-white"
                          : "border-dashed border-white/15 text-zinc-500"
                      }`}
                    >
                      <Dumbbell
                        size={14}
                        className="text-orange-400 shrink-0"
                      />
                      <span className="truncate">
                        {fila.id_ejercicio
                          ? ejercicios.find(
                              (e) => String(e.id) === String(fila.id_ejercicio),
                            )?.nombre || "Ejercicio"
                          : "Seleccionar ejercicio..."}
                      </span>
                    </button>

                    {/* Día */}
                    <div className="relative">
                      <select
                        value={fila.dia}
                        onChange={(e) =>
                          handleFilaChange(idx, "dia", e.target.value)
                        }
                        className="w-full appearance-none bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-orange-500 transition-colors cursor-pointer pr-8"
                      >
                        {DIAS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
                      />
                    </div>

                    {esCardio(fila) ? (
                      <>
                        {/* CARDIO: Duración (minutos) */}
                        <input
                          type="number"
                          min="1"
                          value={fila.series}
                          onChange={(e) =>
                            handleFilaChange(idx, "series", e.target.value)
                          }
                          placeholder="Min"
                          className="w-full bg-black/40 border border-emerald-500/20 rounded-lg px-3 py-2 text-sm text-emerald-400 text-center outline-none focus:border-emerald-500 transition-colors font-mono"
                        />

                        {/* CARDIO: Intensidad */}
                        <input
                          type="text"
                          value={fila.repeticiones}
                          onChange={(e) =>
                            handleFilaChange(
                              idx,
                              "repeticiones",
                              e.target.value,
                            )
                          }
                          placeholder="Baja / Media / Alta"
                          className="w-full bg-black/40 border border-emerald-500/20 rounded-lg px-3 py-2 text-sm text-emerald-400 text-center outline-none focus:border-emerald-500 transition-colors font-mono placeholder-zinc-600"
                        />

                        {/* CARDIO: Sin carga, campo oculto */}
                        <input
                          type="text"
                          value="—"
                          disabled
                          className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-sm text-zinc-600 text-center font-mono cursor-not-allowed"
                        />
                      </>
                    ) : (
                      <>
                        {/* FUERZA: Series */}
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={fila.series}
                          onChange={(e) =>
                            handleFilaChange(idx, "series", e.target.value)
                          }
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white text-center outline-none focus:border-orange-500 transition-colors font-mono"
                        />

                        {/* FUERZA: Repeticiones */}
                        <input
                          type="text"
                          value={fila.repeticiones}
                          onChange={(e) =>
                            handleFilaChange(
                              idx,
                              "repeticiones",
                              e.target.value,
                            )
                          }
                          placeholder="10 / 8-12"
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white text-center outline-none focus:border-orange-500 transition-colors font-mono placeholder-zinc-600"
                        />

                        {/* FUERZA: Carga */}
                        <input
                          type="text"
                          value={fila.carga_proyectada}
                          onChange={(e) =>
                            handleFilaChange(
                              idx,
                              "carga_proyectada",
                              e.target.value,
                            )
                          }
                          placeholder="60kg / P.C."
                          className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white text-center outline-none focus:border-orange-500 transition-colors font-mono placeholder-zinc-600"
                        />
                      </>
                    )}

                    {/* Eliminar fila */}
                    <button
                      type="button"
                      onClick={() => eliminarFila(idx)}
                      disabled={filas.length === 1}
                      className="flex items-center justify-center p-2 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-0"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}

                {/* Botón agregar fila */}
                <button
                  type="button"
                  onClick={agregarFila}
                  className="w-full py-2.5 border border-dashed border-white/10 rounded-xl text-zinc-500 hover:text-white hover:border-orange-500/50 hover:bg-orange-500/5 transition-all text-sm flex items-center justify-center gap-2 mt-1"
                >
                  <Plus size={16} />
                  Agregar ejercicio
                </button>
              </div>
            </div>

            {/* Nota informativa */}
            <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl px-4 py-3 text-xs text-blue-400/80 flex items-start gap-2">
              <span className="mt-0.5">ℹ️</span>
              <span>
                Al guardar esta rutina se{" "}
                <strong className="text-blue-300">
                  desactivará automáticamente
                </strong>{" "}
                cualquier rutina anterior del alumno. Solo puede haber una
                rutina activa a la vez.
              </span>
            </div>
          </div>

          {/* ── FOOTER ── */}
          <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between gap-3 shrink-0 bg-black/10">
            <p className="text-xs text-zinc-600">
              {filas.length} ejercicio{filas.length !== 1 ? "s" : ""} ·{" "}
              {new Set(filas.map((f) => f.dia)).size} día
              {new Set(filas.map((f) => f.dia)).size !== 1 ? "s" : ""} en la
              semana
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || loadingEjercicios}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold text-sm hover:from-orange-500 hover:to-orange-400 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Guardar Rutina
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Catálogo de ejercicios */}
          <EjercicioCatalogo
            isOpen={catalogoOpenIdx !== null}
            ejercicios={ejercicios}
            onSelect={(id_ejercicio) => {
              handleFilaChange(catalogoOpenIdx, "id_ejercicio", id_ejercicio);
              setCatalogoOpenIdx(null);
            }}
            onClose={() => setCatalogoOpenIdx(null)}
          />
        </form>
      </div>
    </div>
  );
}
