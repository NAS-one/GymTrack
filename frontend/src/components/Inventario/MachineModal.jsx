import { useState, useEffect } from 'react';
import { X, Save, Box } from 'lucide-react';

const INITIAL = { nombre: '', marca: '', codigo_serie: '', fecha_adquisicion: new Date().toISOString().split('T')[0] };

export function MachineModal({ isOpen, onClose, machine, onSave }) {
  const [formData, setFormData] = useState(INITIAL);

  useEffect(() => {
    if (isOpen) {
      setFormData(machine ? { 
          ...machine, 
          fecha_adquisicion: machine.fecha_adquisicion ? new Date(machine.fecha_adquisicion).toISOString().split('T')[0] : ''
      } : INITIAL);
    }
  }, [isOpen, machine]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const inputClass = "w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-gym-orange transition-all";

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
                <label className="text-xs font-bold text-gym-gray uppercase mb-1 block">Nombre del Equipo</label>
                <input required type="text" className={inputClass} value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Ej: Cinta de Correr Pro" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold text-gym-gray uppercase mb-1 block">Marca</label>
                    <input type="text" className={inputClass} value={formData.marca} onChange={e => setFormData({...formData, marca: e.target.value})} placeholder="LifeFitness" />
                </div>
                <div>
                    <label className="text-xs font-bold text-gym-gray uppercase mb-1 block">Serie / ID</label>
                    <input required type="text" className={inputClass} value={formData.codigo_serie} onChange={e => setFormData({...formData, codigo_serie: e.target.value})} placeholder="LF-001" />
                </div>
            </div>

            <div>
                <label className="text-xs font-bold text-gym-gray uppercase mb-1 block">Fecha Adquisición</label>
                <input type="date" className={inputClass} value={formData.fecha_adquisicion} onChange={e => setFormData({...formData, fecha_adquisicion: e.target.value})} />
            </div>

            <button type="submit" className="w-full bg-gym-orange hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 mt-4">
                <Save size={18}/> Guardar Equipo
            </button>
        </form>
      </div>
    </div>
  );
}