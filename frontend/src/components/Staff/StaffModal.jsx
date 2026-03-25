import { useState, useEffect } from 'react';
import { X, Save, DollarSign, Briefcase } from 'lucide-react';
import axios from '../../api/axios';

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
const formatRut = (rut) => {
    if (!rut) return '';
    let value = rut.replace(/[^0-9kK]/g, '');
    if (value.length > 1) {
        const body = value.slice(0, -1);
        const dv = value.slice(-1).toUpperCase();
        return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${dv}`;
    }
    return value;
};

export function StaffModal({ isOpen, onClose, staffToEdit, onSave }) {
    const [formData, setFormData] = useState(INITIAL_STATE);
    const [generalError, setGeneralError] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (staffToEdit) {
                // LIMPIEZA INICIAL: Aseguramos tipos correctos al abrir el modal
                setFormData({
                    ...INITIAL_STATE, // Base por si faltan campos
                    ...staffToEdit,   // Datos del staff
                    // Forzamos conversión numérica por si la BD lo devolvió como string
                    sueldo_base: staffToEdit.sueldo_base ? Number(staffToEdit.sueldo_base) : 0,
                    // Si el email viene nulo de la BD, lo convertimos a string vacío para el input
                    email: staffToEdit.email || '',
                    password: '' // Password siempre vacío al editar por seguridad
                });
            } else {
                setFormData(INITIAL_STATE);
            }
            setGeneralError(null);
        }
    }, [isOpen, staffToEdit]);

    if (!isOpen) return null;

    const handleChange = (field, value) => {
        setGeneralError(null);
        let finalValue = value;

        if (field === 'rut') finalValue = formatRut(value);

        // CONVERSIÓN EN TIEMPO REAL: Input type="number" devuelve string, lo forzamos a int
        if (field === 'sueldo_base') {
            finalValue = value === '' ? 0 : parseInt(value);
        }

        setFormData(prev => ({ ...prev, [field]: finalValue }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setGeneralError(null);

        try {
            // --- SANITIZACIÓN DEL PAYLOAD (CRÍTICO PARA EVITAR ERROR 400) ---
            const payload = { ...formData };

            // 1. Asegurar que sueldo sea número
            payload.sueldo_base = Number(payload.sueldo_base);

            // 2. Eliminar campos vacíos que Zod rechazaría (ej: email: "")
            if (!payload.email || payload.email.trim() === '') delete payload.email;
            if (!payload.password || payload.password.trim() === '') delete payload.password;
            if (!payload.telefono || payload.telefono.trim() === '') delete payload.telefono;
            if (!payload.direccion || payload.direccion.trim() === '') delete payload.direccion;

            // 3. Eliminar campos "basura" que vienen de la BD y no deben enviarse al update
            delete payload.id;
            delete payload.created_at;
            delete payload.estado_usuario; // Campo extra del join

            console.log("Enviando Payload:", payload); // Para depuración

            if (staffToEdit) {
                await axios.patch(`/staff/${staffToEdit.id}`, payload);
            } else {
                await axios.post('/staff', payload);
            }

            onSave(); // Refrescar tabla
            onClose(); // Cerrar modal

        } catch (err) {
            console.error("Error al guardar:", err);

            // Extracción segura del mensaje de error
            let msg = "Error desconocido al procesar la solicitud.";

            if (err.response) {
                // El servidor respondió con un código de error (400, 409, 500)
                if (err.response.data) {
                    // Zod suele devolver errores en formato array o string
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

    const inputClass = "w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white outline-none focus:border-gym-orange transition-all placeholder-zinc-500";
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
                            <input className={inputClass} value={formData.nombre} onChange={e => handleChange('nombre', e.target.value)} required />
                        </div>
                        <div>
                            <label className={labelClass}>RUT *</label>
                            <input className={inputClass} value={formData.rut} onChange={e => handleChange('rut', e.target.value)} required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Teléfono</label>
                            <input className={inputClass} value={formData.telefono} onChange={e => handleChange('telefono', e.target.value)} placeholder="+56..." />
                        </div>
                        <div>
                            <label className={labelClass}>Dirección</label>
                            <input className={inputClass} value={formData.direccion} onChange={e => handleChange('direccion', e.target.value)} />
                        </div>
                    </div>

                    {/* Datos Laborales */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Cargo *</label>
                            <select className={inputClass} value={formData.cargo} onChange={e => handleChange('cargo', e.target.value)}>
                                <option value="Recepcionista">Recepcionista</option>
                                <option value="Aseo">Personal de Aseo</option>
                                <option value="Mantenimiento">Mantenimiento</option>
                                <option value="Administración">Administración</option>
                                <option value="Ventas">Ventas</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Turno *</label>
                            <select className={inputClass} value={formData.turno} onChange={e => handleChange('turno', e.target.value)}>
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
                            <input type="number" className={`${inputClass} pl-8 font-mono text-green-400 font-bold`} value={formData.sueldo_base} onChange={e => handleChange('sueldo_base', e.target.value)} required />
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
                                <input type="email" placeholder="Email (Usuario)" className={inputClass} value={formData.email} onChange={e => handleChange('email', e.target.value)} />
                            </div>
                            <div>
                                <input type="text" placeholder={staffToEdit ? "Nueva Password (o vacía)" : "Password"} className={inputClass} value={formData.password} onChange={e => handleChange('password', e.target.value)} />
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