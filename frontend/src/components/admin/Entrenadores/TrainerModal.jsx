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
const formatRut = (value) => {
  let v = value.replace(/[^0-9kK]/g, "");
  if (v.length > 9) v = v.slice(0, 9);
  if (v.length <= 1) return v;
  const dv = v.slice(-1).toUpperCase();
  let body = v.slice(0, -1);
  body = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${body}-${dv}`;
};

const isValidRut = (rut) => {
  const clean = rut.replace(/[.\-]/g, "");
  const body = clean.slice(0, -1);
  if (/^(\d)\1+$/.test(body)) return false;
  const dv = clean.slice(-1).toUpperCase();
  let sum = 0, mul = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }
  const r = 11 - (sum % 11);
  const expected = r === 11 ? "0" : r === 10 ? "K" : r.toString();
  return dv === expected;
};

const verifyRealRut = async (rutFormateado) => {
  const rutLimpio = rutFormateado.replace(/[^0-9kK]/g, '');
  try {
      const response = await fetch(`https://api.libreapi.cl/rut/rut?rut=${rutLimpio}`);
      if (!response.ok) {
          console.warn("La API de RUT no respondió con éxito. Permitiendo registro por precaución.");
          return true;
      }
      const data = await response.json();
      if (data.status === 'success' || data.data) {
          return true;
      }
      return false;
  } catch (error) {
      console.error("Error al consultar la API de RUT:", error);
      return true;
  }
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
          modelo_contrato: trainerToEdit.modelo_contrato || 'sueldo_fijo',
          sueldo_base: trainerToEdit.sueldo_base || 0,
          porcentaje_retencion: Number(trainerToEdit.porcentaje_retencion || 0),
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

    if (!formData.email) {
      newErrors.email = "El correo es obligatorio";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email)) {
      newErrors.email = "Correo inválido";
    } else if (formData.email.split("@")[0].length < 2) {
      newErrors.email = "Usuario de correo muy corto";
    }

    // Validación de teléfono
    if (formData.telefono && formData.telefono.trim()) {
      const tel = formData.telefono.trim();
      if (tel.length > 12) {
        newErrors.telefono = "El teléfono no puede superar 12 caracteres";
      } else if (!/^\+?\d+$/.test(tel)) {
        newErrors.telefono = "Solo se permite '+' al inicio y números";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setGeneralError(null);
    let finalValue = value;

    if (field === 'rut') {
      finalValue = formatRut(value);
    } else if (field === 'nombre') {
      finalValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
    } else if (field === 'telefono') {
      // Solo permite '+' al inicio y dígitos, máximo 12 caracteres
      let cleaned = value.replace(/[^\d+]/g, '');
      // El '+' solo puede estar al principio
      if (cleaned.indexOf('+') > 0) {
        cleaned = cleaned.replace(/\+/g, '');
      }
      // Solo un '+' permitido
      const plusCount = (cleaned.match(/\+/g) || []).length;
      if (plusCount > 1) {
        cleaned = '+' + cleaned.replace(/\+/g, '');
      }
      finalValue = cleaned.slice(0, 12);
    } else if (field === 'sueldo_base' || field === 'tarifa_arriendo') {
      finalValue = value.toString().replace(/\D/g, '');
    } else if (field === 'porcentaje_retencion') {
      let clean = value.toString().replace(/[^0-9.]/g, '');
      const parts = clean.split('.');
      if (parts.length > 2) {
        clean = parts[0] + '.' + parts.slice(1).join('');
      }
      finalValue = clean;
    }

    setFormData(prev => ({ ...prev, [field]: finalValue }));

    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError(null);

    if (validateForm()) {
      try {
        const isRutReal = await verifyRealRut(formData.rut);
        if (!isRutReal) {
          setErrors(prev => ({ ...prev, rut: "RUT no real o inexistente" }));
          setGeneralError("El RUT ingresado no existe o no pudo ser verificado.");
          return;
        }

        const payload = {
          ...formData,
          sueldo_base: formData.sueldo_base === '' ? 0 : parseInt(formData.sueldo_base, 10),
          tarifa_arriendo: formData.tarifa_arriendo === '' ? 0 : parseInt(formData.tarifa_arriendo, 10),
          porcentaje_retencion: formData.porcentaje_retencion === '' ? 0 : parseFloat(formData.porcentaje_retencion)
        };

        await onSave(payload);
      } catch (err) {
        console.log("Error capturado:", err);

        if (err.response && err.response.data) {
          const serverMsg = err.response.data.error || err.response.data.message;
          setGeneralError(serverMsg || "Error desconocido del servidor");
        } else {
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
              <input
                type="text"
                className={inputClass(errors.telefono)}
                value={formData.telefono}
                onChange={e => handleChange('telefono', e.target.value)}
                placeholder="+569..."
                maxLength={12}
              />
              {errors.telefono && <p className="text-red-400 text-xs mt-1">{errors.telefono}</p>}
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
                { id: 'porcentaje', label: '% Comisión', color: 'purple' }
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