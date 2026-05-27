import { useState, useEffect } from "react";
import { X, Save, Dumbbell, PlayCircle } from "lucide-react";
import { AuthContext } from "../../../contexts/AuthContext";
import { useContext } from "react";

const INITIAL = {
  nombre: "",
  grupo_muscular: "Pecho",
  url_video: "",
  descripcion: "",
};
const MUSCLE_GROUPS = [
  "Pecho",
  "Espalda",
  "Piernas",
  "Hombros",
  "Bíceps",
  "Tríceps",
  "Abdominales",
  "Cardio",
  "Full Body",
];

export function ExerciseModal({ isOpen, onClose, exercise, onSave }) {
  const { user } = useContext(AuthContext);
  const rolDelUsuario = (user?.role || user?.rol || user?.id_rol || "")
    .toString()
    .toLowerCase();
  const isAdmin = rolDelUsuario === "administrador" || rolDelUsuario === "1";
  const [formData, setFormData] = useState(INITIAL);

  useEffect(() => {
    if (isOpen) setFormData(exercise || INITIAL);
  }, [isOpen, exercise]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    onSave(formData);
  };

  const inputClass =
    "w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-gym-orange transition-all";

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
      <div className="bg-gym-card border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Dumbbell size={20} className="text-gym-orange" />
            {/* 5. TITULO DINÁMICO */}
            {!isAdmin
              ? "Detalles del Ejercicio"
              : exercise
                ? "Editar Ejercicio"
                : "Nuevo Ejercicio"}
          </h3>
          <button onClick={onClose} className="text-gym-gray hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-gym-gray uppercase mb-1 block">
              Nombre
            </label>
            <input
              required
              type="text"
              className={inputClass}
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '') })
              }
              placeholder="Ej: Press Banca Plano"
              readOnly={!isAdmin} // <-- BLOQUEA ESCRITURA SI ES ENTRENADOR
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gym-gray uppercase mb-1 block">
              Grupo Muscular
            </label>
            <select
              className={inputClass}
              value={formData.grupo_muscular}
              onChange={(e) =>
                setFormData({ ...formData, grupo_muscular: e.target.value })
              }
              disabled={!isAdmin} // <-- DESHABILITA SELECT SI ES ENTRENADOR
            >
              {MUSCLE_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gym-gray uppercase mb-1 block flex items-center gap-2">
              <PlayCircle size={12} /> Video URL (YouTube/Vimeo)
            </label>
            <input
              type="url"
              className={inputClass}
              value={formData.url_video}
              onChange={(e) =>
                setFormData({ ...formData, url_video: e.target.value })
              }
              placeholder="https://youtube.com/..."
              readOnly={!isAdmin}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gym-gray uppercase mb-1 block">
              Instrucciones
            </label>
            <textarea
              rows="3"
              className={`${inputClass} resize-none`}
              value={formData.descripcion}
              onChange={(e) =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
              placeholder="Técnica correcta..."
              readOnly={!isAdmin}
            ></textarea>
          </div>

          {/* 6. EL BOTÓN SOLO SE RENDERIZA SI ES ADMIN */}
          {isAdmin && (
            <button
              type="submit"
              className="w-full bg-gym-orange hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 mt-4"
            >
              <Save size={18} /> Guardar
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
