import { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Lock } from 'lucide-react';

import { toast } from 'sonner';

const INITIAL_STATE = {
    nombre: '',
    rut: '',
    email: '',
    password: '', // Estado inicial vacío (Requerimiento)
    objetivo: 'Estar en forma',
    id_entrenador: '',
    fecha_nacimiento: '',
    genero: '',
    direccion: ''
};

// --- UTILIDADES CHILENAS ---
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

export function ClientModal({ isOpen, onClose, clientToEdit, onSave, coaches = [] }) {

    const [formData, setFormData] = useState(INITIAL_STATE);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- EFECTO PARA PERSISTENCIA DE DATOS ---
    useEffect(() => {
        if (isOpen) {
            if (clientToEdit) {
                const safeDate = (dateStr) => {
                    if (!dateStr) return '';
                    try {
                        return new Date(dateStr).toISOString().split('T')[0];
                    } catch (error) {
                        console.error('Error al analizar fecha:', error);
                        return '';
                    }
                };

                setFormData({
                    nombre: clientToEdit.nombre || '',
                    rut: clientToEdit.rut || '',
                    email: clientToEdit.email || '',
                    password: '', // Se mantiene vacío al editar por seguridad
                    objetivo: clientToEdit.objetivo || '',
                    id_entrenador: clientToEdit.id_entrenador || '',
                    fecha_nacimiento: safeDate(clientToEdit.fecha_nacimiento),
                    genero: clientToEdit.genero || '',
                    direccion: clientToEdit.direccion || ''
                });
            } else {
                setFormData(INITIAL_STATE);
            }

            setErrors({});
            setIsSubmitting(false);
        }
    }, [isOpen, clientToEdit]);

    if (!isOpen) return null;

    const calcAge = (birthDate) => {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    };

    // --- VALIDACIONES ---
    const validateForm = () => {
        const newErrors = {};

        if (!formData.nombre.trim()) {
            newErrors.nombre = "El nombre es obligatorio";
        } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(formData.nombre)) {
            newErrors.nombre = "El nombre solo debe contener letras";
        }



        if (!formData.fecha_nacimiento) {
            newErrors.fecha_nacimiento = "La fecha es obligatoria";
        } else {
            const age = calcAge(formData.fecha_nacimiento);
            if (age < 12) {
                newErrors.fecha_nacimiento = "Debes tener al menos 12 años";
            } else if (age > 120) {
                newErrors.fecha_nacimiento = "Fecha no realista";
            } else if (formData.rut && !newErrors.rut) {
                const rutNum = parseInt(formData.rut.replace(/[.\-kK]/g, "").slice(0, -1) || "0", 10);
                const birthYear = new Date(formData.fecha_nacimiento).getFullYear();
                if (rutNum > 0 && rutNum < 5000000 && birthYear > 1975) {
                    newErrors.fecha_nacimiento = "Inconsistencia entre RUT y fecha de nacimiento";
                } else if (rutNum > 0 && rutNum < 10000000 && birthYear > 1995) {
                    newErrors.fecha_nacimiento = "Inconsistencia entre RUT y fecha de nacimiento";
                } else if (rutNum > 0 && rutNum < 15000000 && birthYear > 2005) {
                    newErrors.fecha_nacimiento = "Inconsistencia entre RUT y fecha de nacimiento";
                } else if (rutNum > 0 && rutNum < 20000000 && birthYear > 2015) {
                    newErrors.fecha_nacimiento = "Inconsistencia entre RUT y fecha de nacimiento";
                }
            }
        }

        if (!formData.email) {
            newErrors.email = "El correo es obligatorio";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email)) {
            newErrors.email = "Correo inválido";
        } else if (formData.email.split("@")[0].length < 2) {
            newErrors.email = "Usuario de correo muy corto";
        }

        // Validación de dirección
        if (formData.direccion !== undefined && formData.direccion !== null && formData.direccion !== '') {
            const dir = formData.direccion.trim();
            if (dir === '') {
                newErrors.direccion = "La dirección no puede contener solo espacios";
            } else {
                const tieneLetras = /[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/.test(dir);
                const tieneNumeros = /\d/.test(dir);
                if (!tieneLetras || !tieneNumeros) {
                    newErrors.direccion = "Formato inválido. Ej: Osorno 123";
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };



    // --- MANEJO DE CAMBIOS ---
    const handleChange = (field, value) => {
        let finalValue = value;

        if (field === 'rut') finalValue = formatRut(value);
        if (field === 'nombre') finalValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
        if (field === 'objetivo') finalValue = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');

        setFormData(prev => ({ ...prev, [field]: finalValue }));

        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            // Mostramos un toast de advertencia si el formulario es inválido
            toast.warning("Formulario incompleto", {
                description: "Por favor revisa los campos marcados en rojo."
            });
            return;
        }

        setIsSubmitting(true);



        try {
            const payload = { ...formData };
            delete payload.password;

            await onSave(payload);
        } catch (serverErrors) {
            setErrors(prev => ({ ...prev, ...serverErrors }));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper de estilos
    const inputClass = (error, disabled = false) => `
    w-full bg-black/40 border rounded-lg px-4 py-2.5 text-white outline-none transition-all placeholder-zinc-600
    ${error
            ? 'border-red-500 focus:border-red-500 placeholder-red-300/50'
            : 'border-white/10 focus:border-gym-orange'
        }
    ${disabled ? 'opacity-50 cursor-not-allowed bg-white/5 border-transparent text-zinc-400' : ''}
  `;

    const Label = ({ text }) => (
        <label className="text-xs font-bold text-gym-gray uppercase mb-1 block">{text}</label>
    );

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in overflow-y-auto">
            <div className="bg-gym-card border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-auto">

                <div className="px-8 py-5 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <div>
                        <h3 className="text-xl font-bold text-white">
                            Editar Perfil
                        </h3>
                        <p className="text-xs text-gym-gray mt-1">Complete la ficha técnica del socio.</p>
                    </div>
                    <button onClick={onClose} disabled={isSubmitting} className="text-gym-gray hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full disabled:opacity-50">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">

                    {/* SECCIÓN 1 */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-gym-orange border-b border-white/5 pb-2">1. Información Personal</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <Label text="Nombre Completo *" />
                                <input
                                    type="text"
                                    className={inputClass(errors.nombre)}
                                    value={formData.nombre}
                                    onChange={e => handleChange('nombre', e.target.value)}
                                    placeholder="Ej: Juan Pérez"
                                />
                                {errors.nombre && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.nombre}</p>}
                            </div>

                            <div className="relative">
                                <Label text="RUT / DNI *" />
                                <input
                                    type="text"
                                    disabled={true}
                                    className={inputClass(errors.rut, true)}
                                    value={formData.rut}
                                    placeholder="12.345.678-9"
                                />
                                <Lock size={14} className="absolute right-3 top-9 text-zinc-500" title="El RUT no se puede modificar" />
                                {errors.rut && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.rut}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <Label text="Fecha Nacimiento" />
                                <input type="date" className={`${inputClass(errors.fecha_nacimiento)} [color-scheme:dark]`} value={formData.fecha_nacimiento} onChange={e => handleChange('fecha_nacimiento', e.target.value)} />
                                {errors.fecha_nacimiento && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.fecha_nacimiento}</p>}
                            </div>
                            <div>
                                <Label text="Género" />
                                <select className={inputClass(null)} value={formData.genero} onChange={e => handleChange('genero', e.target.value)}>
                                    <option value="">Seleccionar...</option>
                                    <option value="Masculino">Masculino</option>
                                    <option value="Femenino">Femenino</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* SECCIÓN 2 */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-gym-orange border-b border-white/5 pb-2">2. Contacto y Acceso</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="relative">
                                <Label text="Email (Usuario) *" />
                                <input
                                    type="text"
                                    className={inputClass(errors.email)}
                                    value={formData.email}
                                    onChange={e => handleChange('email', e.target.value)}
                                    placeholder="juan@gym.com"
                                />
                                {errors.email && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.email}</p>}
                            </div>
                        </div>

                        <div>
                            <Label text="Dirección" />
                            <input
                                type="text"
                                className={inputClass(errors.direccion)}
                                value={formData.direccion}
                                onChange={e => handleChange('direccion', e.target.value)}
                                placeholder="Ej: Osorno 123"
                            />
                            {errors.direccion && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.direccion}</p>}
                        </div>
                    </div>

                    {/* SECCIÓN 3 */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-gym-orange border-b border-white/5 pb-2">3. Ficha Deportiva</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <Label text="Entrenador Asignado" />
                                <select className={inputClass(null)} value={formData.id_entrenador} onChange={e => handleChange('id_entrenador', e.target.value)}>
                                    <option value="">-- Sin asignar --</option>
                                    {coaches.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre} ({c.especialidad})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label text="Objetivo Principal" />
                                <input type="text" className={inputClass(null)} value={formData.objetivo} onChange={e => handleChange('objetivo', e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end gap-3 border-t border-white/5">
                        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-6 py-2.5 text-sm font-medium text-gym-gray hover:text-white transition-colors rounded-xl hover:bg-white/5 disabled:opacity-50">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="bg-gym-orange hover:bg-orange-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all disabled:opacity-70 disabled:cursor-wait">
                            <Save size={18} /> {isSubmitting ? 'Guardando...' : 'Guardar Ficha'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}