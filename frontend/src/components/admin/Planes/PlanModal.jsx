import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Calculator, Tag, Percent, GraduationCap, Zap, PackagePlus } from 'lucide-react';
import { toast } from 'sonner';

const PRECIO_BASE_MENSUAL = 45000;
const MESES_MAXIMO = 36;
const BENEFICIOS_DISPONIBLES = [
  'Plan Nutricional Personalizado',
  'Suplementos Mensuales',
  'Evaluación Física Inicial',
  'Acceso Multisede',
  'Invitado 1 vez al mes'
];

const INITIAL_STATE = { 
  nombre: '', 
  precio: '', 
  duracion_meses: 1, 
  descripcion: '',
  tipo_plan: 'regular',
  requiere_validacion: false,
  beneficios_extra: [],
  precio_comparacion: ''
};

export function PlanModal({ isOpen, onClose, planToEdit, onSave }) {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [errors, setErrors] = useState({});
  const [descuento, setDescuento] = useState('');

  // Sincronizar al abrir
  useEffect(() => {
    if (isOpen) {
      if (planToEdit) {
        setFormData({
          ...planToEdit,
          beneficios_extra: Array.isArray(planToEdit.beneficios_extra) ? planToEdit.beneficios_extra : []
        });
        
        // Calcular descuento inverso si hay precio_comparacion
        if (planToEdit.precio_comparacion && planToEdit.precio_comparacion > planToEdit.precio) {
          const calcDesc = Math.round((1 - (planToEdit.precio / planToEdit.precio_comparacion)) * 100);
          setDescuento(calcDesc.toString());
        } else {
          setDescuento('');
        }
      } else {
        setFormData(INITIAL_STATE);
        setDescuento('');
        // Al crear uno nuevo, auto-calculamos el precio para 1 mes
        autoCalcPrecio(1, '');
      }
      setErrors({});
    }
  }, [isOpen, planToEdit]);

  if (!isOpen) return null;

  // Calculadora Inteligente
  const autoCalcPrecio = (meses, descStr) => {
    const mesesNum = parseInt(meses) || 1;
    const precioBaseTotal = PRECIO_BASE_MENSUAL * mesesNum;
    const descNum = parseInt(descStr) || 0;
    
    if (descNum > 0 && descNum <= 100) {
      const precioConDescuento = Math.round(precioBaseTotal * (1 - (descNum / 100)));
      setFormData(prev => ({
        ...prev, 
        precio: precioConDescuento.toString(),
        precio_comparacion: precioBaseTotal.toString()
      }));
    } else {
      setFormData(prev => ({
        ...prev, 
        precio: precioBaseTotal.toString(),
        precio_comparacion: ''
      }));
    }
  };

  const handleMesesChange = (val) => {
    setFormData(prev => ({ ...prev, duracion_meses: val }));
    autoCalcPrecio(val, descuento);
    if (errors.duracion_meses) setErrors(prev => ({ ...prev, duracion_meses: null }));
  };

  const handleDescuentoChange = (val) => {
    const onlyDigits = val.replace(/\D/g, '');
    if (Number(onlyDigits) <= 85) {
      setDescuento(onlyDigits);
      autoCalcPrecio(formData.duracion_meses, onlyDigits);
    }
  };

  const handleTipoPlanChange = (tipo) => {
    setFormData(prev => ({
      ...prev,
      tipo_plan: tipo,
      requiere_validacion: tipo === 'estudiante' ? true : prev.requiere_validacion,
      beneficios_extra: tipo !== 'combo' ? [] : prev.beneficios_extra
    }));
  };

  const toggleBeneficio = (ben) => {
    setFormData(prev => {
      const isSelected = prev.beneficios_extra.includes(ben);
      if (isSelected) {
        return { ...prev, beneficios_extra: prev.beneficios_extra.filter(b => b !== ben) };
      } else {
        return { ...prev, beneficios_extra: [...prev.beneficios_extra, ben] };
      }
    });
  };

  const validate = () => {
    const newErrors = {};
    const nombreTrimmed = formData.nombre.trim();
    if (!nombreTrimmed) {
      newErrors.nombre = 'Obligatorio';
    } else if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/.test(nombreTrimmed)) {
      newErrors.nombre = 'Debe contener al menos una letra';
    }
    
    const precio = Number(formData.precio);
    if (formData.precio === '' || isNaN(precio)) {
      newErrors.precio = 'Obligatorio';
    } else if (precio < 6750) {
      newErrors.precio = `Mínimo $6.750`;
    } else if (precio > 10000000) {
      newErrors.precio = `Máximo $10.000.000`;
    }

    if (!formData.duracion_meses) newErrors.duracion_meses = 'Obligatorio';

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
      precio_comparacion: formData.precio_comparacion ? parseInt(formData.precio_comparacion, 10) : null,
      duracion_meses: parseInt(formData.duracion_meses, 10)
    };
    
    onSave(payload);
  };

  const inputClass = (hasError) => `w-full bg-black/40 border rounded-lg px-4 py-2.5 text-white outline-none focus:border-gym-orange transition-all ${hasError ? 'border-red-500 focus:border-red-500' : 'border-white/10'}`;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto py-10">
      <div className="bg-gym-card border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-auto">
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <div>
             <h3 className="text-xl font-bold text-white">{planToEdit ? 'Editar Plan Comercial' : 'Diseñar Nuevo Plan'}</h3>
             <p className="text-xs text-zinc-500 mt-1">Configura precios, duraciones y tipos de membrecía.</p>
          </div>
          <button onClick={onClose} className="text-gym-gray hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24}/></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
            
            {/* SECCION 1: Categoría */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-gym-orange border-b border-white/5 pb-2 uppercase tracking-wider flex items-center gap-2">
                 <Tag size={16}/> 1. Tipo de Plan
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                 <TypeButton 
                    active={formData.tipo_plan === 'regular'} 
                    onClick={() => handleTipoPlanChange('regular')}
                    icon={<AlertCircle size={18}/>} title="Regular" 
                    color="from-zinc-800 to-zinc-900" ring="ring-zinc-500"
                 />
                 <TypeButton 
                    active={formData.tipo_plan === 'oferta'} 
                    onClick={() => handleTipoPlanChange('oferta')}
                    icon={<Zap size={18}/>} title="Oferta" 
                    color="from-red-900/50 to-orange-900/50" ring="ring-orange-500"
                 />
                 <TypeButton 
                    active={formData.tipo_plan === 'estudiante'} 
                    onClick={() => handleTipoPlanChange('estudiante')}
                    icon={<GraduationCap size={18}/>} title="Estudiante" 
                    color="from-blue-900/50 to-indigo-900/50" ring="ring-blue-500"
                 />
                 <TypeButton 
                    active={formData.tipo_plan === 'combo'} 
                    onClick={() => handleTipoPlanChange('combo')}
                    icon={<PackagePlus size={18}/>} title="Combo" 
                    color="from-emerald-900/50 to-teal-900/50" ring="ring-emerald-500"
                 />
              </div>
            </div>

            {/* SECCION 2: Info General y Precios */}
            <div className="space-y-4">
               <h4 className="text-sm font-bold text-gym-orange border-b border-white/5 pb-2 uppercase tracking-wider flex items-center gap-2">
                 <Calculator size={16}/> 2. Tarifa y Duración
               </h4>

               <div>
                  <label className="text-xs font-bold text-gym-gray uppercase mb-1 block">Nombre Comercial</label>
                  <input
                    type="text"
                    className={inputClass(errors.nombre)}
                    value={formData.nombre}
                    onChange={e => {
                      const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s+%\-#]/g, '');
                      setFormData({...formData, nombre: val});
                      if (errors.nombre) setErrors(prev => ({ ...prev, nombre: null }));
                    }}
                    placeholder="Ej: Plan Anual Premium"
                    autoFocus
                  />
                  {errors.nombre && <p className="text-red-400 text-[10px] mt-1">{errors.nombre}</p>}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                      <label className="text-xs font-bold text-gym-gray uppercase mb-1 block">Duración</label>
                      <select
                        className={`${inputClass(errors.duracion_meses)} cursor-pointer`}
                        value={formData.duracion_meses}
                        onChange={e => handleMesesChange(e.target.value)}
                      >
                          <option value="1">1 Mes (Mensual)</option>
                          <option value="2">2 Meses (Bimestral)</option>
                          <option value="3">3 Meses (Trimestral)</option>
                          <option value="6">6 Meses (Semestral)</option>
                          <option value="12">12 Meses (Anual)</option>
                          <option value="24">24 Meses (2 Años)</option>
                          <option value="36">36 Meses (3 Años)</option>
                      </select>
                  </div>
                  <div>
                      <label className="text-xs font-bold text-gym-gray uppercase mb-1 flex justify-between">
                         Descuento %
                         <span className="text-[9px] text-zinc-500 normal-case">Máx. 85%</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          className={inputClass(false)}
                          value={descuento}
                          onChange={e => handleDescuentoChange(e.target.value)}
                          placeholder="Ej: 15"
                        />
                        <Percent size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                      </div>
                  </div>
                  <div>
                      <label className="text-xs font-bold text-gym-gray uppercase mb-1 flex justify-between">
                         Precio Final ($)
                         <span className="text-[9px] text-zinc-500 normal-case">Máx. $10M</span>
                      </label>
                      <input
                        type="text"
                        className={inputClass(errors.precio)}
                        value={formData.precio}
                        onChange={e => {
                           let onlyDigits = e.target.value.replace(/\D/g, '');
                           if (Number(onlyDigits) > 10000000) onlyDigits = '10000000';
                           setFormData({...formData, precio: onlyDigits});
                           // Si editan manual, borramos la referencia del descuento automático
                           setDescuento('');
                           setFormData(p => ({...p, precio_comparacion: ''}));
                        }}
                        placeholder={`Ej: 45000`}
                      />
                      {errors.precio && <p className="text-red-400 text-[10px] mt-1">{errors.precio}</p>}
                      {formData.precio_comparacion && formData.precio_comparacion > formData.precio && (
                         <p className="text-[10px] text-zinc-500 mt-1">
                           Antes: <span className="line-through">${parseInt(formData.precio_comparacion).toLocaleString('es-CL')}</span>
                         </p>
                      )}
                  </div>
               </div>
            </div>

            {/* SECCION 3: Configuración Específica */}
            <div className="space-y-4">
                <h4 className="text-sm font-bold text-gym-orange border-b border-white/5 pb-2 uppercase tracking-wider flex items-center gap-2">
                 <PackagePlus size={16}/> 3. Detalles y Beneficios
                </h4>

                <div>
                    <label className="text-xs font-bold text-gym-gray uppercase mb-1 block">Descripción para el Cliente</label>
                    <textarea 
                       rows="2" 
                       className={`${inputClass(false)} resize-none`} 
                       value={formData.descripcion} 
                       onChange={e => setFormData({...formData, descripcion: e.target.value})} 
                       placeholder="Explica qué incluye o por qué es una buena opción..."
                    ></textarea>
                </div>

                {formData.tipo_plan === 'combo' && (
                  <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                     <label className="text-xs font-bold text-emerald-400 uppercase mb-3 block">Selecciona Beneficios Extra del Combo</label>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {BENEFICIOS_DISPONIBLES.map(ben => (
                           <label key={ben} className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer hover:text-white">
                              <input 
                                 type="checkbox" 
                                 className="accent-emerald-500 w-4 h-4 cursor-pointer"
                                 checked={formData.beneficios_extra.includes(ben)}
                                 onChange={() => toggleBeneficio(ben)}
                              />
                              {ben}
                           </label>
                        ))}
                     </div>
                  </div>
                )}

                <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                   <input 
                      type="checkbox" 
                      id="reqVal"
                      className="accent-gym-orange w-5 h-5 cursor-pointer"
                      checked={formData.requiere_validacion}
                      onChange={e => setFormData({...formData, requiere_validacion: e.target.checked})}
                      disabled={formData.tipo_plan === 'estudiante'} // Estudiante siempre requiere
                   />
                   <label htmlFor="reqVal" className="text-sm text-white cursor-pointer select-none">
                      <span className="font-bold block">Requiere Validación de Documento</span>
                      <span className="text-xs text-zinc-500 block">Exige TNE, Carnet Universitario o Certificado Médico en recepción.</span>
                   </label>
                </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
                <button type="button" onClick={onClose} className="px-6 py-3 font-bold text-zinc-400 hover:text-white transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="bg-gym-orange hover:bg-orange-600 text-white font-black px-8 py-3 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.3)] flex items-center justify-center gap-2 transition-all active:scale-95">
                    <Save size={18}/> Guardar Plan Comercial
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}

function TypeButton({ active, onClick, icon, title, color, ring }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all
        ${active 
          ? `bg-gradient-to-br ${color} border-transparent ring-2 ring-offset-2 ring-offset-[#09090b] ${ring}` 
          : 'bg-black/40 border-white/5 text-zinc-500 hover:border-white/20 hover:text-white'
        }
      `}
    >
      <div className={active ? 'text-white' : 'opacity-70'}>{icon}</div>
      <span className={`text-[10px] font-black uppercase tracking-wider ${active ? 'text-white' : ''}`}>{title}</span>
    </button>
  );
}