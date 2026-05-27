import { useState, useEffect } from 'react';
import { X, Save, DollarSign, Briefcase } from 'lucide-react';
import axios from '../../../api/axios';

const INITIAL_STATE = {
    nombre: '',
    rut: '',
    telefono: '',
    direccion: '',
    cargo: 'Recepcionista',
    turno: 'Mañana',
    sueldo_base: 460000,
    email: '',
    password: ''
};

// Formateador de RUT (Mantenemos tu lógica)
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

export function StaffModal({ isOpen, onClose, staffToEdit, onSave }) {
    const [formData, setFormData] = useState(INITIAL_STATE);
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (staffToEdit) {
                setFormData({
                    ...INITIAL_STATE,
                    ...staffToEdit,
                    sueldo_base: staffToEdit.sueldo_base ? Number(staffToEdit.sueldo_base) : 0,
                    email: staffToEdit.email || '',
                    password: ''
                });
            } else {
                setFormData(INITIAL_STATE);
            }
            setErrors({});
            setGeneralError(null);
        }
    }, [isOpen, staffToEdit]);

    if (!isOpen) return null;

    const validateForm = () => {
        const newErrors = {};
        if (!formData.nombre.trim()) newErrors.nombre = "El nombre es obligatorio";
        if (!formData.rut.trim()) newErrors.rut = "El RUT es obligatorio";
        else if (!isValidRut(formData.rut)) newErrors.rut = "RUT inválido (Dígito verificador incorrecto)";

        if (formData.email) {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email)) {
                newErrors.email = "Correo inválido";
            } else if (formData.email.split("@")[0].length < 2) {
                newErrors.email = "Usuario de correo muy corto";
            }
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
        } else if (field === 'sueldo_base') {
            finalValue = value.toString().replace(/\D/g, '');
        }

        setFormData(prev => ({ ...prev, [field]: finalValue }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setGeneralError(null);

        if (!validateForm()) {
            setGeneralError("Por favor, corrige los campos marcados.");
            return;
        }

        setLoading(true);
        try {
            const isRutReal = await verifyRealRut(formData.rut);
            if (!isRutReal) {
                setErrors(prev => ({ ...prev, rut: "El RUT ingresado no existe o no pudo ser verificado." }));
                setGeneralError("El RUT parece no pertenecer a una persona real.");
                setLoading(false);
                return;
            }

            const payload = { ...formData };
            payload.sueldo_base = Number(payload.sueldo_base);

            if (!payload.email || payload.email.trim() === '') delete payload.email;
            if (!payload.password || payload.password.trim() === '') delete payload.password;
            if (!payload.telefono || payload.telefono.trim() === '') delete payload.telefono;
            if (!payload.direccion || payload.direccion.trim() === '') delete payload.direccion;

            delete payload.id;
            delete payload.created_at;
            delete payload.estado_usuario;

            console.log("Enviando Payload:", payload);

            if (staffToEdit) {
                await axios.patch(`/staff/${staffToEdit.id}`, payload);
            } else {
                await axios.post('/staff', payload);
            }

            onSave();
            onClose();

        } catch (err) {
            console.error("Error al guardar:", err);
            let msg = "Error desconocido al procesar la solicitud.";
            if (err.response) {
                if (err.response.data) {
                    if (Array.isArray(err.response.data)) {
                        msg = err.response.data[0]?.message || JSON.stringify(err.response.data);
                    } else if (err.response.data.error) {
                        msg = err.response.data.error;
                    } else if (err.response.data.message) {
                        msg = err.response.data.message;
                    }
                }
            } else if (err.request) {
                msg = "No hay respuesta del servidor. Verifica tu conexión.";
            }
            setGeneralError(msg);
        } finally {
            setLoading(false);
        }
    };

    const inputClass = (error) => `w-full bg-black/40 border rounded-lg px-4 py-2.5 text-white outline-none focus:border-gym-orange transition-all placeholder-zinc-500 ${error ? 'border-red-500' : 'border-white/10'}`;
    const labelClass = "text-xs font-bold text-gym-gray uppercase mb-1 block";

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-gym-card border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Briefcase className="text-gym-orange" size={20} />
                        {staffToEdit ? 'Editar Staff' : 'Nuevo Colaborador'}
                    </h3>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white"><X /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar">

                    {/* Datos Personales */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Nombre *</label>
                            <input className={inputClass(errors.nombre)} value={formData.nombre} onChange={e => handleChange('nombre', e.target.value)} required />
                            {errors.nombre && <p className="text-red-400 text-xs mt-1">{errors.nombre}</p>}
                        </div>
                        <div>
                            <label className={labelClass}>RUT *</label>
                            <input className={inputClass(errors.rut)} value={formData.rut} onChange={e => handleChange('rut', e.target.value)} required />
                            {errors.rut && <p className="text-red-400 text-xs mt-1">{errors.rut}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Teléfono</label>
                            <input
                                className={inputClass(errors.telefono)}
                                value={formData.telefono}
                                onChange={e => handleChange('telefono', e.target.value)}
                                placeholder="+56912345678"
                                maxLength={12}
                            />
                            {errors.telefono && <p className="text-red-400 text-xs mt-1">{errors.telefono}</p>}
                        </div>
                        <div>
                            <label className={labelClass}>Dirección</label>
                            <input className={inputClass(null)} value={formData.direccion} onChange={e => handleChange('direccion', e.target.value)} />
                        </div>
                    </div>

                    {/* Datos Laborales */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Cargo *</label>
                            <select className={inputClass(null)} value={formData.cargo} onChange={e => handleChange('cargo', e.target.value)}>
                                <option value="Recepcionista">Recepcionista</option>
                                <option value="Aseo">Personal de Aseo</option>
                                <option value="Mantenimiento">Mantenimiento</option>
                                <option value="Administración">Administración</option>
                                <option value="Ventas">Ventas</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Turno *</label>
                            <select className={inputClass(null)} value={formData.turno} onChange={e => handleChange('turno', e.target.value)}>
                                <option value="Mañana">Mañana</option>
                                <option value="Tarde">Tarde</option>
                                <option value="Noche">Noche</option>
                                <option value="Full Time">Full Time</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Sueldo Base (CLP) *</label>
                        <div className="relative">
                            <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input type="text" className={`${inputClass(null)} pl-8 font-mono text-green-400 font-bold`} value={formData.sueldo_base} onChange={e => handleChange('sueldo_base', e.target.value)} required />
                        </div>
                    </div>

                    {/* Login */}
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 mt-2">
                        <p className="text-[10px] text-gym-orange uppercase font-bold mb-3 flex justify-between">
                            <span>Acceso al Sistema</span>
                            <span className="text-zinc-500 font-normal opacity-70">Opcional</span>
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <input type="email" placeholder="Email (Usuario)" className={inputClass(errors.email)} value={formData.email} onChange={e => handleChange('email', e.target.value)} />
                                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                            </div>
                            <div>
                                <input type="text" placeholder={staffToEdit ? "Nueva Password (o vacía)" : "Password"} className={inputClass(null)} value={formData.password} onChange={e => handleChange('password', e.target.value)} />
                            </div>
                        </div>
                        {staffToEdit && (
                            <p className="text-[10px] text-zinc-500 mt-2 italic">* Deja la contraseña vacía si no deseas cambiarla.</p>
                        )}
                    </div>

                    {/* Mensaje Error */}
                    {generalError && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-start gap-2 animate-pulse">
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 shrink-0"></div>
                            <p className="text-red-400 text-xs font-bold leading-relaxed">{generalError}</p>
                        </div>
                    )}

                    <div className="pt-2 flex justify-end gap-3 shrink-0">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">Cancelar</button>
                        <button type="submit" disabled={loading} className="bg-gym-orange hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-xl flex items-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-orange-900/20">
                            <Save size={18} /> {loading ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}