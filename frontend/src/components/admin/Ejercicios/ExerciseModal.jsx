import { useState, useEffect } from "react";
import { X, Save, Dumbbell, PlayCircle, AlertCircle } from "lucide-react";
import { AuthContext } from "../../../contexts/AuthContext";
import { useContext } from "react";
import { toast } from "sonner";

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
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData(exercise || INITIAL);
      setErrors({});
    }
  }, [isOpen, exercise]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    const nombreTrimmed = (formData.nombre || "").trim();

    // --- NOMBRE (obligatorio, 2-60 chars, solo letras y espacios) ---
    if (!nombreTrimmed) {
      newErrors.nombre = "El nombre del ejercicio es obligatorio";
    } else if (nombreTrimmed.length < 2) {
      newErrors.nombre = "El nombre debe tener al menos 2 caracteres";
    } else if (nombreTrimmed.length > 60) {
      newErrors.nombre = "El nombre no puede superar los 60 caracteres";
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(nombreTrimmed)) {
      newErrors.nombre = "El nombre solo puede contener letras y espacios";
    } else {
      // Verificar que tenga al menos 2 letras reales (no solo espacios)
      const letras = nombreTrimmed.replace(/\s/g, '');
      if (letras.length < 2) {
        newErrors.nombre = "El nombre debe contener al menos 2 letras";
      }
    }

    // --- GRUPO MUSCULAR (obligatorio) ---
    if (!formData.grupo_muscular || !MUSCLE_GROUPS.includes(formData.grupo_muscular)) {
      newErrors.grupo_muscular = "Debes seleccionar un grupo muscular válido";
    }

    // --- URL VIDEO/GIF (obligatoria) ---
    const urlTrimmed = (formData.url_video || "").trim();
    if (!urlTrimmed) {
      newErrors.url_video = "La URL del GIF o Video es obligatoria";
    } else {
      try {
        const url = new URL(urlTrimmed);
        if (!['http:', 'https:'].includes(url.protocol)) {
          newErrors.url_video = "La URL debe comenzar con http:// o https://";
        } else {
          // Aceptar dominios de youtube/vimeo y también URLs que terminan en extensiones de imagen/gif
          const dominiosVideo = ['youtube.com', 'www.youtube.com', 'youtu.be', 'vimeo.com', 'www.vimeo.com'];
          const esVideo = dominiosVideo.some(d => url.hostname === d || url.hostname.endsWith('.' + d));
          const esImagenOGif = /\.(gif|jpe?g|png|webp)$/i.test(url.pathname);
          const esTenorOImgur = ['tenor.com', 'imgur.com', 'giphy.com'].some(d => url.hostname.includes(d));
          
          if (!esVideo && !esImagenOGif && !esTenorOImgur) {
            newErrors.url_video = "Debe ser un enlace de YouTube, Vimeo o un enlace directo a un GIF/Imagen";
          }
        }
      } catch {
        newErrors.url_video = "La URL ingresada no es válida";
      }
    }

    // --- DESCRIPCIÓN (opcional, max 500 chars) ---
    const descTrimmed = (formData.descripcion || "").trim();
    if (descTrimmed) {
      if (descTrimmed.length > 500) {
        newErrors.descripcion = "La descripción no puede superar los 500 caracteres";
      } else if (descTrimmed.length < 5 && descTrimmed.length > 0) {
        newErrors.descripcion = "La descripción debe tener al menos 5 caracteres";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    let finalValue = value;

    if (field === 'nombre') {
      // Solo letras y espacios
      finalValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '').slice(0, 60);
    } else if (field === 'descripcion') {
      finalValue = value.slice(0, 500);
    }

    setFormData({ ...formData, [field]: finalValue });
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!validate()) {
      toast.warning('Formulario incompleto', { description: 'Revisa los campos marcados en rojo.' });
      return;
    }
    onSave(formData);
  };

  const inputClass = (hasError) =>
    `w-full bg-black/40 border rounded-lg px-4 py-2.5 text-white outline-none focus:border-gym-orange transition-all ${hasError ? 'border-red-500 focus:border-red-500' : 'border-white/10'}`;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in">
      <div className="bg-gym-card border border-white/10 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Dumbbell size={20} className="text-gym-orange" />
            {/* TITULO DINÁMICO */}
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

        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto custom-scrollbar">
          
          {/* LADO IZQUIERDO: VISUALIZADOR Y URL */}
          <div className="space-y-4 flex flex-col">
            {formData.url_video && (/\.(gif|jpe?g|png|webp)$/i.test(formData.url_video) || ['tenor.com', 'imgur.com', 'giphy.com'].some(d => formData.url_video.includes(d))) ? (
              <div className="w-full h-48 md:h-[320px] bg-zinc-200 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center relative shadow-inner">
                <img src={formData.url_video} alt="Visualización del Ejercicio" className="w-full h-full object-contain mix-blend-multiply p-4" />
              </div>
            ) : (
              <div className="w-full h-48 md:h-[320px] bg-black/40 rounded-xl border border-white/10 flex flex-col items-center justify-center text-zinc-500">
                <PlayCircle size={40} className="mb-2 opacity-50" />
                <span className="text-sm">Sin previsualización</span>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-gym-gray uppercase mb-1 flex items-center gap-2">
                <PlayCircle size={12} /> URL del GIF o Video
              </label>
              <input
                type="text"
                className={inputClass(errors.url_video)}
                value={formData.url_video}
                onChange={(e) => handleChange('url_video', e.target.value)}
                placeholder="https://ejemplo.com/ejercicio.gif"
                readOnly={!isAdmin}
              />
              {errors.url_video && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.url_video}</p>}
              {isAdmin && !errors.url_video && <p className="text-zinc-600 text-[10px] mt-1">Enlaces a GIF, Imgur, Tenor, YouTube o Vimeo</p>}
            </div>
          </div>

          {/* LADO DERECHO: DETALLES E INSTRUCCIONES */}
          <div className="flex flex-col space-y-4">
            <div>
              <label className="text-xs font-bold text-gym-gray uppercase mb-1 block">
                Nombre *
              </label>
              <input
                type="text"
                className={inputClass(errors.nombre)}
                value={formData.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                placeholder="Ej: Press Banca Plano"
                readOnly={!isAdmin}
                maxLength={60}
              />
              {errors.nombre && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.nombre}</p>}
              {isAdmin && <p className="text-zinc-600 text-[10px] mt-1">{(formData.nombre || '').trim().length}/60 caracteres</p>}
            </div>

            <div>
              <label className="text-xs font-bold text-gym-gray uppercase mb-1 block">
                Grupo Muscular *
              </label>
              <select
                className={inputClass(errors.grupo_muscular)}
                value={formData.grupo_muscular}
                onChange={(e) => handleChange('grupo_muscular', e.target.value)}
                disabled={!isAdmin}
              >
                {MUSCLE_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              {errors.grupo_muscular && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.grupo_muscular}</p>}
            </div>

            <div className="flex flex-col flex-1 min-h-[150px]">
              <label className="text-xs font-bold text-gym-gray uppercase mb-1 block">
                Instrucciones
              </label>
              <textarea
                className={`${inputClass(errors.descripcion)} resize-none flex-1 p-3`}
                value={formData.descripcion}
                onChange={(e) => handleChange('descripcion', e.target.value)}
                placeholder="Técnica correcta..."
                readOnly={!isAdmin}
                maxLength={500}
              ></textarea>
              {errors.descripcion && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.descripcion}</p>}
              {isAdmin && <p className="text-zinc-600 text-[10px] mt-1">{(formData.descripcion || '').length}/500 caracteres</p>}
            </div>
          </div>

          {/* EL BOTÓN SOLO SE RENDERIZA SI ES ADMIN */}
          {isAdmin && (
            <div className="md:col-span-2 pt-4 border-t border-white/10 mt-2">
              <button
                type="submit"
                className="w-full bg-gym-orange hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <Save size={18} /> Guardar
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
