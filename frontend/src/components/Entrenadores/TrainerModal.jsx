import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

const INITIAL_STATE = {
  nombre: '',
  rut: '',
  email: '',
  password: '123456',
  especialidad: 'Musculación',
  telefono: '',
  turno: 'Mañana',
  // Campos financieros nuevos
  modelo_contrato: 'sueldo_fijo',
  sueldo_base: 400000,
  porcentaje_retencion: 0.30,
  tarifa_arriendo: 0
};

// --- UTILIDADES ---
const formatRut = (rut) => {
  let value = rut.replace(/[^0-9kK]/g, '');
  if (value.length > 1) {
    const body = value.slice(0, -1);
    const dv = value.slice(-1).toUpperCase();
    return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${dv}`;
  }
  return value;
};

const isValidRut = (rut) => {
  if (!rut || rut.length < 8) return false;
  const cleanRut = rut.replace(/[^0-9kK]/g, '');
  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1).toUpperCase();
  let suma = 0; let multiplo = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    suma += multiplo * parseInt(body.charAt(i));
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }
  const dvEsperado = 11 - (suma % 11);
  const dvFinal = (dvEsperado === 11) ? '0' : (dvEsperado === 10) ? 'K' : dvEsperado.toString();
  return dv === dvFinal;
};

export function TrainerModal({ isOpen, onClose, trainerToEdit, onSave }) {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (trainerToEdit) {
        setFormData({
          nombre: trainerToEdit.nombre || '',
          rut: formatRut(trainerToEdit.rut || ''),
          email: trainerToEdit.email || '',
          password: '',
          especialidad: trainerToEdit.especialidad || 'Musculación',
          telefono: trainerToEdit.telefono || '',
          turno: trainerToEdit.turno || 'Mañana',
          // Cargar datos financieros
          modelo_contrato: trainerToEdit.modelo_contrato || 'sueldo_fijo',
          sueldo_base: trainerToEdit.sueldo_base || 0,
          porcentaje_retencion: trainerToEdit.porcentaje_retencion || 0,
          tarifa_arriendo: trainerToEdit.tarifa_arriendo || 0
        });
      } else {
        setFormData(INITIAL_STATE);
      }
      setErrors({});
    }
  }, [isOpen, trainerToEdit]);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors = {};
    if (!formData.nombre.trim()) newErrors.nombre = "Requerido";
    if (!formData.rut.trim()) newErrors.rut = "Requerido";
    else if (!isValidRut(formData.rut)) newErrors.rut = "Inválido";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) newErrors.email = "Requerido";
    else if (!emailRegex.test(formData.email)) newErrors.email = "Inválido";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setGeneralError(null); // 👈 AGREGA ESTO: Limpia el error rojo al escribir
    let finalValue = value;

    // 1. Formateo de RUT
    if (field === 'rut') {
      finalValue = formatRut(value);
    }

    // 2. CONVERSIÓN NUMÉRICA (Crítico para evitar error 400)
    const numericFields = ['sueldo_base', 'porcentaje_retencion', 'tarifa_arriendo'];
    if (numericFields.includes(field)) {
      // Si está vacío es 0, si no, lo convierte a número real
      finalValue = value === '' ? 0 : parseFloat(value);
    }

    setFormData(prev => ({ ...prev, [field]: finalValue }));

    // Limpiar error visual si existe
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError(null); // Limpiamos errores previos

    if (validateForm()) {
      try {
        await onSave(formData);
        // Si tienes lógica de cerrar en el padre, bien. Si no, cierra aquí:
        // onClose(); 
      } catch (err) {
        console.log("Error capturado:", err);

        // 1. Verificamos si hay respuesta del servidor (Backend envió 400, 409, 500)
        if (err.response && err.response.data) {
          // Tu backend envía { error: "mensaje" } o a veces { message: "..." }
          const serverMsg = err.response.data.error || err.response.data.message;
          setGeneralError(serverMsg || "Error desconocido del servidor");
        } else {
          // Error de red (servidor apagado, sin internet)
          setGeneralError("No se pudo conectar con el servidor.");
        }
      }
    }
  };

  const inputClass = (error) => `w-full bg-black/40 border rounded-lg px-4 py-2.5 text-white outline-none transition-all placeholder-zinc-600 ${error ? 'border-red-500' : 'border-white/10 focus:border-gym-orange'}`;
  const Label = ({ text }) => <label className="text-xs font-bold text-gym-gray uppercase mb-1 block">{text}</label>;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-gym-card border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar">

        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h3 className="text-xl font-bold text-white">{trainerToEdit ? 'Editar Entrenador' : 'Nuevo Entrenador'}</h3>
          <button onClick={onClose} className="text-gym-gray hover:text-white"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* DATOS PERSONALES */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label text="Nombre" />
              <input type="text" className={inputClass(errors.nombre)} value={formData.nombre} onChange={e => handleChange('nombre', e.target.value)} />
              {errors.nombre && <p className="text-red-400 text-xs mt-1">{errors.nombre}</p>}
            </div>
            <div>
              <Label text="RUT" />
              <input type="text" className={inputClass(errors.rut)} value={formData.rut} onChange={e => handleChange('rut', e.target.value)} />
              {errors.rut && <p className="text-red-400 text-xs mt-1">{errors.rut}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label text="Email" />
              <input type="email" disabled={!!trainerToEdit} className={`${inputClass(errors.email)} ${trainerToEdit ? 'opacity-50' : ''}`} value={formData.email} onChange={e => handleChange('email', e.target.value)} />
            </div>
            <div>
              <Label text="Teléfono" />
              <input type="text" className={inputClass()} value={formData.telefono} onChange={e => handleChange('telefono', e.target.value)} placeholder="+569..." />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label text="Especialidad" />
              <select className={inputClass()} value={formData.especialidad} onChange={e => handleChange('especialidad', e.target.value)}>
                <option value="Musculación">Musculación</option>
                <option value="Crossfit">Crossfit</option>
                <option value="Yoga">Yoga / Pilates</option>
                <option value="Rehabilitación">Rehabilitación</option>
              </select>
            </div>
            <div>
              <Label text="Turno" />
              <select className={inputClass()} value={formData.turno} onChange={e => handleChange('turno', e.target.value)}>
                <option value="Mañana">Mañana</option>
                <option value="Tarde">Tarde</option>
                <option value="Full Time">Full Time</option>
              </select>
            </div>
          </div>

          {!trainerToEdit && (
            <div><Label text="Password Inicial" /><input type="text" className={inputClass()} value={formData.password} onChange={e => handleChange('password', e.target.value)} /></div>
          )}

          <hr className="border-white/5 my-2" />

          {/* === MODELO DE NEGOCIO === */}
          <div>
            <Label text="Modelo de Contratación" />
            <div className="grid grid-cols-3 gap-2 mb-4 mt-2">
              {[
                { id: 'sueldo_fijo', label: 'Sueldo Fijo', color: 'blue' },
                { id: 'porcentaje', label: '% Comisión', color: 'purple' },
                { id: 'arriendo_espacio', label: 'Arriendo', color: 'green' }
              ].map(m => (
                <button
                  key={m.id} type="button"
                  onClick={() => handleChange('modelo_contrato', m.id)}
                  className={`p-2 rounded border text-xs font-bold transition-all ${formData.modelo_contrato === m.id
                    ? `bg-${m.color}-600 border-${m.color}-500 text-white shadow-lg`
                    : 'border-white/10 text-zinc-400 hover:bg-white/5'
                    }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Inputs Dinámicos */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 animate-fade-in">
              {formData.modelo_contrato === 'sueldo_fijo' && (
                <div>
                  <Label text="Sueldo Mensual Base" />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
                    <input type="number" className={`${inputClass()} pl-8`} value={formData.sueldo_base} onChange={e => handleChange('sueldo_base', e.target.value)} />
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-2">Gasto fijo mensual para el gimnasio.</p>
                </div>
              )}

              {formData.modelo_contrato === 'porcentaje' && (
                <div>
                  <Label text="Retención Gimnasio (0.1 - 1.0)" />
                  <input type="number" step="0.05" max="1" min="0" className={inputClass()} value={formData.porcentaje_retencion} onChange={e => handleChange('porcentaje_retencion', e.target.value)} />
                  <p className="text-[10px] text-purple-300 mt-2">
                    El entrenador recibe el <b>{((1 - (parseFloat(formData.porcentaje_retencion) || 0)) * 100).toFixed(0)}%</b> de cada clase.
                  </p>
                </div>
              )}

              {formData.modelo_contrato === 'arriendo_espacio' && (
                <div>
                  <Label text="Tarifa Mensual de Arriendo" />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500">$</span>
                    <input type="number" className={`${inputClass()} pl-8 text-green-400 font-bold`} value={formData.tarifa_arriendo} onChange={e => handleChange('tarifa_arriendo', e.target.value)} />
                  </div>
                  <p className="text-[10px] text-green-300/70 mt-2">Ingreso fijo mensual para el gimnasio.</p>
                </div>
              )}
            </div>
          </div>

          {generalError && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mb-4 flex items-center gap-2">
              <div className="min-w-[4px] h-4 bg-red-500 rounded-full"></div>
              <p className="text-red-400 text-sm font-medium">
                {generalError}
              </p>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gym-gray hover:text-white">Cancelar</button>
            <button type="submit" className="bg-gym-orange hover:bg-orange-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg flex items-center gap-2">
              <Save size={18} /> Guardar
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}