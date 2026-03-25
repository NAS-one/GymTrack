import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';

const INITIAL_STATE = { nombre: '', precio: '', duracion_meses: 1, descripcion: '' };

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

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validación simple
    if (!formData.nombre.trim()) return setErrors({nombre: 'Requerido'});
    if (formData.precio < 0) return setErrors({precio: 'No puede ser negativo'});
    
    onSave(formData);
  };

  const inputClass = "w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-gym-orange transition-all";

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
                <input type="text" className={inputClass} value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej: Plan Estudiante" autoFocus />
                {errors.nombre && <p className="text-red-400 text-xs mt-1">{errors.nombre}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-gym-gray uppercase mb-1 block">Precio ($)</label>
                    <input type="number" className={inputClass} value={formData.precio} onChange={e => setFormData({...formData, precio: e.target.value})} placeholder="35000" />
                </div>
                <div>
                    <label className="text-xs font-bold text-gym-gray uppercase mb-1 block">Duración (Meses)</label>
                    <input type="number" min="1" className={inputClass} value={formData.duracion_meses} onChange={e => setFormData({...formData, duracion_meses: e.target.value})} />
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-gym-gray uppercase mb-1 block">Descripción</label>
                <textarea rows="3" className={`${inputClass} resize-none`} value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} placeholder="Beneficios del plan..."></textarea>
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