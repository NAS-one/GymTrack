import { useState } from "react";
import { X, Scale, Ruler, Percent, Target, CheckCircle } from "lucide-react";
import axios from "../../api/axios";
import { toast } from "sonner";

export function AddMeasurementsModal({ isOpen, onClose, client, onSave }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    peso: "",
    altura: "",
    procentaje_grasa: "",
    circunferencia_cintura: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (value === "" || /^\d+\.?\d*$/.test(value)) {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.peso) {
      return toast.warning("Faltan datos", {
        description: "El peso es obligatorio.",
      });
    }

    setLoading(true);
    try {
      // POST a la ruta de medidas que crearemos en el backend
      await axios.post(`/clientes/${client.id}/medidas`, formData);
      toast.success("Medidas Registradas", {
        description: `Nuevos datos guardados para ${client.nombre}.`,
      });
      if (onSave) onSave();
      onClose();
      setFormData({
        peso: "",
        altura: "",
        porcentaje_grasa: "",
        circunferencia_cintura: "",
      });
    } catch (error) {
      toast.error("Error al guardar", {
        description: error.response?.data?.error || "Ocurrió un problema.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !client) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div className="bg-gym-card border border-white/10 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-slide-in">
        <div className="flex justify-between items-center p-5 border-b border-white/5 bg-black/20">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Scale size={18} className="text-gym-orange" /> Registrar Medidas
            </h3>
            <p className="text-xs text-gym-gray mt-1">
              Alumno:{" "}
              <span className="font-bold text-white">{client.nombre}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gym-gray hover:text-white hover:bg-white/5 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Peso"
              name="peso"
              value={formData.peso}
              onChange={handleChange}
              icon={<Scale size={16} />}
              unit="kg"
            />
            <InputField
              label="Altura"
              name="altura"
              value={formData.altura}
              onChange={handleChange}
              icon={<Ruler size={16} />}
              unit="m"
            />
            <InputField
              label="% Grasa"
              name="porcentaje_grasa"
              value={formData.porcentaje_grasa}
              onChange={handleChange}
              icon={<Percent size={16} />}
              unit="%"
            />
            <InputField
              label="Cintura"
              name="circunferencia_cintura"
              value={formData.circunferencia_cintura}
              onChange={handleChange}
              icon={<Target size={16} />}
              unit="cm"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-gym-gray hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-gym-orange hover:bg-orange-600 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all active:scale-95 text-sm disabled:opacity-50"
            >
              {loading ? (
                "Guardando..."
              ) : (
                <>
                  <CheckCircle size={16} /> Guardar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InputField({ label, unit, icon, value, ...props }) {
  return (
    <div>
      <label className="text-[10px] text-gym-gray uppercase font-bold mb-1 block tracking-wider">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 opacity-80">
          {icon}
        </div>
        <input
          type="text"
          value={value || ""}
          {...props}
          className="w-full bg-black/30 border border-white/10 rounded-lg pl-9 pr-8 py-2.5 text-white text-sm font-mono focus:border-gym-orange outline-none transition-colors"
          placeholder="0.0"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gym-gray font-medium">
          {unit}
        </span>
      </div>
    </div>
  );
}
