import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const INITIAL_STATE = { nombre: '', precio: '', duracion_meses: 1, descripcion: '' };

const PRECIO_MINIMO = 9990;
const MESES_MAXIMO = 12;

export function PlanModal({ isOpen, onClose, planToEdit, onSave }) {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData(planToEdit || INITIAL_STATE);
      setErrors({});
    }
  }, [isOpen, planToEdit]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio';
    } else if (formData.nombre.trim().length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }

    const precio = Number(formData.precio);
    if (formData.precio === '' || isNaN(precio)) {
      newErrors.precio = 'El precio es obligatorio';
    } else if (precio < PRECIO_MINIMO) {
      newErrors.precio = `El precio mínimo es $${PRECIO_MINIMO.toLocaleString('es-CL')}`;
    }

    const meses = Number(formData.duracion_meses);
    if (!formData.duracion_meses && formData.duracion_meses !== 0) {
      newErrors.duracion_meses = 'La duración es obligatoria';
    } else if (isNaN(meses) || meses < 1) {
      newErrors.duracion_meses = 'Mínimo 1 mes de duración';
    } else if (meses > MESES_MAXIMO) {
      newErrors.duracion_meses = `Máximo ${MESES_MAXIMO} meses`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.warning('Formulario incompleto', { description: 'Revisa los campos marcados en rojo.' });
      return;
    }
    const payload = {
      ...formData,
      precio: parseInt(formData.precio, 10),
      duracion_meses: parseInt(formData.duracion_meses, 10)
    };
    onSave(payload);
  };

  const handlePrecioChange = (value) => {
    const onlyDigits = value.replace(/\D/g, '');
    setFormData({ ...formData, precio: onlyDigits });
    if (errors.precio) setErrors(prev => ({ ...prev, precio: null }));
  };

  const handleMesesChange = (value) => {
    const onlyDigits = value.replace(/\D/g, '');
    // No permitir más de 2 dígitos (máximo 12)
    const num = parseInt(onlyDigits, 10);
    if (onlyDigits === '' || (!isNaN(num) && num <= MESES_MAXIMO)) {
      setFormData({ ...formData, duracion_meses: onlyDigits });
    } else if (!isNaN(num) && num > MESES_MAXIMO) {
      setFormData({ ...formData, duracion_meses: String(MESES_MAXIMO) });
    }
    if (errors.duracion_meses) setErrors(prev => ({ ...prev, duracion_meses: null }));
  };

  const inputClass = (hasError) => `w-full bg-black/40 border rounded-lg px-4 py-2.5 text-white outline-none focus:border-gym-orange transition-all ${hasError ? 'border-red-500 focus:border-red-500' : 'border-white/10'}`;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-gym-card border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h3 className="text-xl font-bold text-white">{planToEdit ? 'Editar Plan' : 'Crear Nuevo Plan'}</h3>
          <button onClick={onClose} className="text-gym-gray hover:text-white"><X size={24}/></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
                <label className="text-xs font-bold text-gym-gray uppercase mb-1 block">Nombre del Plan</label>
                <input
                  type="text"
                  className={inputClass(errors.nombre)}
                  value={formData.nombre}
                  onChange={e => {
                    setFormData({...formData, nombre: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '')});
                    if (errors.nombre) setErrors(prev => ({ ...prev, nombre: null }));
                  }}
                  placeholder="Ej: Plan Estudiante"
                  autoFocus
                />
                {errors.nombre && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.nombre}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-gym-gray uppercase mb-1 block">Precio ($)</label>
                    <input
                      type="text"
                      className={inputClass(errors.precio)}
                      value={formData.precio}
                      onChange={e => handlePrecioChange(e.target.value)}
                      placeholder={`Mín: $${PRECIO_MINIMO.toLocaleString('es-CL')}`}
                    />
                    {errors.precio && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.precio}</p>}
                </div>
                <div>
                    <label className="text-xs font-bold text-gym-gray uppercase mb-1 block">Duración (Meses)</label>
                    <input
                      type="text"
                      className={inputClass(errors.duracion_meses)}
                      value={formData.duracion_meses}
                      onChange={e => handleMesesChange(e.target.value)}
                      placeholder={`1 - ${MESES_MAXIMO}`}
                    />
                    {errors.duracion_meses && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.duracion_meses}</p>}
                    <p className="text-zinc-600 text-[10px] mt-1">Máx. {MESES_MAXIMO} meses</p>
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-gym-gray uppercase mb-1 block">Descripción</label>
                <textarea rows="3" className={`${inputClass(false)} resize-none`} value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} placeholder="Beneficios del plan..."></textarea>
            </div>

            <div className="pt-2">
                <button type="submit" className="w-full bg-gym-orange hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all">
                    <Save size={18}/> Guardar Plan
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}