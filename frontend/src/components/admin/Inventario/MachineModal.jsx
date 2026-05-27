import { useState, useEffect } from 'react';
import { X, Save, Box, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const INITIAL = { nombre: '', marca: '', codigo_serie: '', fecha_adquisicion: new Date().toISOString().split('T')[0] };

export function MachineModal({ isOpen, onClose, machine, onSave }) {
  const [formData, setFormData] = useState(INITIAL);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData(machine ? { 
          ...machine, 
          fecha_adquisicion: machine.fecha_adquisicion ? new Date(machine.fecha_adquisicion).toISOString().split('T')[0] : ''
      } : INITIAL);
      setErrors({});
    }
  }, [isOpen, machine]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    const nombreTrimmed = (formData.nombre || '').trim();
    if (!nombreTrimmed) {
      newErrors.nombre = 'El nombre del equipo es obligatorio';
    } else if (nombreTrimmed.length < 2) {
      newErrors.nombre = 'El nombre debe tener al menos 2 caracteres';
    }
    if (formData.marca && formData.marca !== '' && formData.marca.trim() === '') {
      newErrors.marca = 'La marca no puede contener solo espacios';
    }

    if (formData.codigo_serie && formData.codigo_serie !== '' && formData.codigo_serie.trim() === '') {
      newErrors.codigo_serie = 'El número de serie no puede contener solo espacios';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.warning('Formulario incompleto', { description: 'Revisa los campos marcados en rojo.' });
      return;
    }
    try {
      await onSave(formData);
    } catch (err) {
      // El error se maneja en el componente padre (Inventario.jsx)
    }
  };

  const handleNombreChange = (value) => {
    // Evitar que sea solo espacios al escribir
    setFormData({ ...formData, nombre: value });
    if (errors.nombre) setErrors(prev => ({ ...prev, nombre: null }));
  };

  const inputClass = (hasError) => `w-full bg-black/40 border rounded-lg px-4 py-2.5 text-white outline-none focus:border-gym-orange transition-all ${hasError ? 'border-red-500 focus:border-red-500' : 'border-white/10'}`;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-gym-card border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Box size={20} className="text-gym-orange"/> {machine ? 'Editar Máquina' : 'Nueva Máquina'}
          </h3>
          <button onClick={onClose} className="text-gym-gray hover:text-white"><X size={24}/></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
                <label className="text-xs font-bold text-gym-gray uppercase mb-1 block">Nombre del Equipo *</label>
                <input
                  type="text"
                  className={inputClass(errors.nombre)}
                  value={formData.nombre}
                  onChange={e => handleNombreChange(e.target.value)}
                  placeholder="Ej: Cinta de Correr Pro"
                />
                {errors.nombre && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.nombre}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-gym-gray uppercase mb-1 block">Marca</label>
                    <input type="text" className={inputClass(errors.marca)} value={formData.marca} onChange={e => setFormData({...formData, marca: e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '')})} placeholder="LifeFitness" />
                    {errors.marca && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.marca}</p>}
                </div>
                <div>
                    <label className="text-xs font-bold text-gym-gray uppercase mb-1 block">Serie / ID</label>
                    <input type="text" className={inputClass(errors.codigo_serie)} value={formData.codigo_serie} onChange={e => setFormData({...formData, codigo_serie: e.target.value})} placeholder="LF-001" />
                    {errors.codigo_serie && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10}/> {errors.codigo_serie}</p>}
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-gym-gray uppercase mb-1 block">Fecha Adquisición</label>
                <input type="date" className={`${inputClass(false)} [color-scheme:dark]`} value={formData.fecha_adquisicion} onChange={e => setFormData({...formData, fecha_adquisicion: e.target.value})} />
            </div>

            <button type="submit" className="w-full bg-gym-orange hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 mt-4 transition-all">
                <Save size={18}/> Guardar Equipo
            </button>
        </form>
      </div>
    </div>
  );
}