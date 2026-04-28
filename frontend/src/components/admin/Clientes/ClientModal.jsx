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
const formatRut = (rut) => {
    let value = rut.replace(/[^0-9kK]/g, '');
    if (value.length > 1) {
        const body = value.slice(0, -1);
        const dv = value.slice(-1).toUpperCase();
        const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        return `${formattedBody}-${dv}`;
    }
    return value;
};

const isValidRut = (rut) => {
    if (!rut || rut.length < 8) return false;
    const cleanRut = rut.replace(/[^0-9kK]/g, '');
    const body = cleanRut.slice(0, -1);
    const dv = cleanRut.slice(-1).toUpperCase();

    if (!body || !dv) return false;

    let suma = 0;
    let multiplo = 2;

    for (let i = body.length - 1; i >= 0; i--) {
        suma += multiplo * parseInt(body.charAt(i));
        multiplo = multiplo < 7 ? multiplo + 1 : 2;
    }

    const dvEsperado = 11 - (suma % 11);
    const dvFinal = (dvEsperado === 11) ? '0' : (dvEsperado === 10) ? 'K' : dvEsperado.toString();

    return dv === dvFinal;
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

    // --- VALIDACIONES ---
    const validateForm = () => {
        const newErrors = {};

        if (!formData.nombre.trim()) {
            newErrors.nombre = "El nombre es obligatorio";
        } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formData.nombre)) {
            newErrors.nombre = "El nombre solo debe contener letras";
        }

        if (!clientToEdit) {
            if (!formData.rut.trim()) {
                newErrors.rut = "El RUT es obligatorio";
            } else if (!isValidRut(formData.rut)) {
                newErrors.rut = "RUT inválido (Dígito verificador incorrecto)";
            }
        }

        if (formData.fecha_nacimiento) {
            const fecha = new Date(formData.fecha_nacimiento);
            const hoy = new Date();
            if (fecha > hoy) newErrors.fecha_nacimiento = "La fecha no puede ser futura";
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email) newErrors.email = "El email es obligatorio";
        else if (!emailRegex.test(formData.email)) newErrors.email = "Formato de email inválido";

        // La contraseña ya no se pide aquí (se envía correo de activación)

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // --- MANEJO DE CAMBIOS ---
    const handleChange = (field, value) => {
        let finalValue = value;

        if (field === 'rut') finalValue = formatRut(value);
        if (field === 'nombre' && /[0-9]/.test(value)) return;

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
            // Remover el campo de contraseña vacía de la petición para evitar falsos rechazos (Zod validation)
            const payload = { ...formData };
            delete payload.password;

            // Pasamos la data al padre (Clientes.jsx) sin alterar la lógica de negocio
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
                            {clientToEdit ? 'Editar Perfil' : 'Registrar Cliente'}
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
                                    disabled={!!clientToEdit}
                                    className={inputClass(errors.rut, !!clientToEdit)}
                                    value={formData.rut}
                                    onChange={e => handleChange('rut', e.target.value)}
                                    placeholder="12.345.678-9"
                                    maxLength={12}
                                />
                                {clientToEdit && <Lock size={14} className="absolute right-3 top-9 text-zinc-500" title="El RUT no se puede modificar" />}
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
                                    disabled={!!clientToEdit}
                                    className={inputClass(errors.email, !!clientToEdit)}
                                    value={formData.email}
                                    onChange={e => handleChange('email', e.target.value)}
                                    placeholder="juan@gym.com"
                                />
                                {clientToEdit && <Lock size={14} className="absolute right-3 top-9 text-zinc-500" title="El Email no se puede modificar" />}
                                {errors.email && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.email}</p>}
                            </div>

                            {!clientToEdit && (
                                <div>
                                    <Label text="Activación de Cuenta" />
                                    <div className="bg-white/5 border border-white/10 rounded-lg p-3 text-xs text-gray-300">
                                        Se enviará un correo a esta dirección para que el cliente configure su propia contraseña.
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <Label text="Dirección" />
                            <input type="text" className={inputClass(null)} value={formData.direccion} onChange={e => handleChange('direccion', e.target.value)} placeholder="Av. Principal 123" />
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