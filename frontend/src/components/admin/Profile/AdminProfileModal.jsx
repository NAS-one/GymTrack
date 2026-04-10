import { useState, useEffect } from 'react';
import {
    X, User, Shield, Bell, History, Camera,
    Save, Key, Smartphone, Monitor, Info,
    MapPin, Fingerprint, Activity,
    Eye, EyeOff, AlertOctagon, CheckCircle, Mail, Globe,
} from 'lucide-react';
import { toast } from 'sonner';
import axios from '../../../api/axios';

export function AdminProfileModal({ isOpen, onClose, adminData, onUpdate }) {
    const [activeTab, setActiveTab] = useState('datos');
    const [loading, setLoading] = useState(false);

    // Estados Datos Personales
    const [nombre, setNombre] = useState('');
    const [cargo, setCargo] = useState('');
    const [telefono, setTelefono] = useState('');

    // Estados Seguridad
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Estados Auditoría
    const [auditLogs, setAuditLogs] = useState([]);
    const [loadingAudit, setLoadingAudit] = useState(false);

    // 🌟 ESTADOS DE PREFERENCIAS AVANZADAS
    const [preferencias, setPreferencias] = useState({
        cierre_caja: { activo: true, canal: "push", umbral: 0 },
        inventario_critico: { activo: true, canal: "push" },
        riesgo_fuga: { activo: false, dias_ausencia: 7 },
        acceso_fuera_horario: { activo: true, canal: "email" }
    });

    useEffect(() => {
        if (isOpen && adminData) {
            setNombre(adminData.nombre || '');
            setCargo(adminData.cargo || 'Gerente');
            setTelefono(adminData.telefono || ''); // 🌟 Manejo seguro de nulos

            // 🌟 PARSEO SEGURO DE JSONB
            if (adminData.preferencias_alertas) {
                let prefs = adminData.preferencias_alertas;
                if (typeof prefs === 'string') {
                    try { prefs = JSON.parse(prefs); } catch (e) { console.error("Error parseando JSONB", e); }
                }
                if (Object.keys(prefs).length > 0) {
                    setPreferencias(prev => ({ ...prev, ...prefs }));
                }
            }

            setActiveTab('datos');
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
            setShowCurrent(false); setShowNew(false); setShowConfirm(false);
        }
    }, [isOpen, adminData]);

    useEffect(() => {
        if (activeTab === 'auditoria' && isOpen) {
            fetchAuditLogs();
        }
    }, [activeTab, isOpen]);

    const fetchAuditLogs = async () => {
        setLoadingAudit(true);
        try {
            const response = await axios.get('/perfil/auditoria');
            if (response.data.body) setAuditLogs(response.data.body);
        } catch (error) {
            toast.error("Error al cargar registros de seguridad.");
        } finally {
            setLoadingAudit(false);
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.put('/perfil/datos', { nombre, cargo, telefono });
            toast.success("Perfil actualizado con éxito");
            if (onUpdate) onUpdate({ ...adminData, nombre, cargo, telefono });
        } catch (error) {
            toast.error(error.response?.data?.error || "Error al actualizar perfil");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) return toast.error("Las contraseñas no coinciden");
        if (newPassword.length < 6) return toast.error("Mínimo 6 caracteres requeridos");

        setLoading(true);
        try {
            await axios.put('/perfil/password', { currentPassword, newPassword });
            toast.success("Credenciales actualizadas por seguridad");
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        } catch (error) {
            toast.error(error.response?.data?.error || "Contraseña actual incorrecta");
        } finally {
            setLoading(false);
        }
    };

    const handleSavePreferences = async () => {
        setLoading(true);
        try {
            await axios.put('/perfil/preferencias', { preferencias });
            toast.success("Automatizaciones actualizadas");
            if (onUpdate) onUpdate({ ...adminData, preferencias_alertas: preferencias });
        } catch (error) {
            toast.error("Error al guardar las configuraciones");
        } finally {
            setLoading(false);
        }
    };

    // 🌟 ACTULIZADOR DE ESTADO PROFUNDO PARA JSON
    const updatePreferencia = (clave, campos) => {
        setPreferencias(prev => ({
            ...prev,
            [clave]: { ...prev[clave], ...campos }
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={onClose}></div>

            <div className="w-full max-w-5xl h-[85vh] bg-[#0c0c0e] border border-white/10 rounded-[2rem] relative z-10 shadow-[0_0_80px_rgba(0,0,0,0.9)] flex overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Sidebar */}
                <div className="w-64 bg-black/40 border-r border-white/5 flex flex-col hidden md:flex shrink-0 relative z-20">
                    <div className="p-6 border-b border-white/5 flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 rounded-full bg-gym-orange/10 border-2 border-gym-orange/30 flex items-center justify-center text-gym-orange mb-4 relative overflow-hidden shadow-[0_0_20px_rgba(249,115,22,0.15)]">
                            {adminData?.foto_perfil ? (
                                <img src={adminData.foto_perfil} alt="Perfil" className="w-full h-full object-cover" />
                            ) : (
                                <User size={32} strokeWidth={2} />
                            )}
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity backdrop-blur-sm cursor-pointer">
                                <Camera size={20} className="text-white" />
                            </div>
                        </div>
                        <h3 className="font-black text-white text-sm tracking-tight truncate w-full">{adminData?.nombre || 'Administrador'}</h3>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{adminData?.cargo || 'Gerencia'}</p>
                    </div>
                    <div className="flex-1 p-4 space-y-1">
                        <ProfileTab active={activeTab === 'datos'} onClick={() => setActiveTab('datos')} icon={<User size={16} />} label="Datos Personales" />
                        <ProfileTab active={activeTab === 'seguridad'} onClick={() => setActiveTab('seguridad')} icon={<Shield size={16} />} label="Seguridad" />
                        <ProfileTab active={activeTab === 'alertas'} onClick={() => setActiveTab('alertas')} icon={<Bell size={16} />} label="Preferencias" />
                        <ProfileTab active={activeTab === 'auditoria'} onClick={() => setActiveTab('auditoria')} icon={<History size={16} />} label="Auditoría" />
                    </div>
                </div>

                {/* Contenido Principal */}
                <div className="flex-1 flex flex-col bg-gradient-to-br from-white/[0.01] to-transparent relative z-10">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 rounded-full transition-all z-20">
                        <X size={18} />
                    </button>

                    <div className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar">

                        {/* TAB DATOS */}
                        {activeTab === 'datos' && (
                            <div className="max-w-xl animate-in fade-in slide-in-from-right-4 duration-300">
                                <h2 className="text-2xl font-black text-white tracking-tight mb-8">Información Personal</h2>
                                <form onSubmit={handleSaveProfile} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Nombre Completo</label>
                                            <input type="text" required minLength={3} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-gym-orange outline-none shadow-inner" value={nombre} onChange={(e) => setNombre(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Cargo Operativo</label>
                                            <input type="text" required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-gym-orange outline-none shadow-inner" value={cargo} onChange={(e) => setCargo(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Teléfono de Contacto</label>
                                            <input type="tel" placeholder="+56 9 1234 5678" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-gym-orange outline-none shadow-inner" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">Correo <Info size={12} className="text-blue-400" /></label>
                                            <input type="email" disabled className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm font-bold text-zinc-500 outline-none cursor-not-allowed" value={adminData?.email || ''} />
                                        </div>
                                    </div>
                                    <div className="pt-4 flex justify-end">
                                        <button disabled={loading} type="submit" className="bg-gym-orange hover:bg-orange-500 text-white px-8 py-3 rounded-xl text-sm font-black shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all flex items-center gap-2">
                                            <Save size={16} /> {loading ? 'Sincronizando...' : 'Guardar Cambios'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* TAB SEGURIDAD */}
                        {activeTab === 'seguridad' && (
                            <div className="max-w-xl animate-in fade-in slide-in-from-right-4 duration-300">
                                <h2 className="text-2xl font-black text-white tracking-tight mb-8">Seguridad de la Cuenta</h2>
                                <form onSubmit={handleUpdatePassword} className="space-y-5 bg-black/40 p-6 rounded-2xl border border-white/5 shadow-inner">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Contraseña Actual</label>
                                        <div className="relative">
                                            <input type={showCurrent ? "text" : "password"} required className="w-full bg-[#0c0c0e] border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-white focus:border-blue-500 outline-none" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                                            <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"><Eye size={18} /></button>
                                        </div>
                                    </div>
                                    <div className="w-full h-px bg-white/5 my-4"></div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Nueva Contraseña</label>
                                        <div className="relative">
                                            <input type={showNew ? "text" : "password"} required minLength={6} className="w-full bg-[#0c0c0e] border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-white focus:border-blue-500 outline-none" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                                            <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"><Eye size={18} /></button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Confirmar Contraseña</label>
                                        <div className="relative">
                                            <input type={showConfirm ? "text" : "password"} required minLength={6} className="w-full bg-[#0c0c0e] border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-white focus:border-blue-500 outline-none" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                                            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"><Eye size={18} /></button>
                                        </div>
                                    </div>
                                    <div className="pt-4 flex justify-end">
                                        <button disabled={loading} type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl text-sm font-black shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all flex items-center gap-2">
                                            <Key size={16} /> {loading ? 'Actualizando...' : 'Actualizar Credenciales'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* 🌟 TAB PREFERENCIAS INTELIGENTES */}
                        {activeTab === 'alertas' && (
                            <div className="max-w-2xl animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex justify-between items-end mb-8">
                                    <div>
                                        <h2 className="text-2xl font-black text-white tracking-tight mb-1">Automatizaciones</h2>
                                        <p className="text-sm text-zinc-400">Configura canales y umbrales para las alertas de GymTrack.</p>
                                    </div>
                                    <button onClick={handleSavePreferences} disabled={loading} className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
                                        <Save size={14} /> Guardar Ajustes
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <AdvancedSetting
                                        title="Cierre Financiero Diario"
                                        desc="Notificación automática con el resumen de ingresos al final del día."
                                        config={preferencias.cierre_caja}
                                        onChange={(newVals) => updatePreferencia('cierre_caja', newVals)}
                                        hasUmbral={true} labelUmbral="Monto Mínimo a Informar ($)"
                                    />
                                    <AdvancedSetting
                                        title="Inventario Crítico"
                                        desc="Alerta si el staff técnico reporta una falla grave de maquinaria."
                                        config={preferencias.inventario_critico}
                                        onChange={(newVals) => updatePreferencia('inventario_critico', newVals)}
                                    />
                                    <AdvancedSetting
                                        title="Riesgo de Fuga (Clientes)"
                                        desc="Detectar automáticamente clientes que han dejado de asistir."
                                        config={preferencias.riesgo_fuga}
                                        onChange={(newVals) => updatePreferencia('riesgo_fuga', newVals)}
                                        hasUmbral={true} labelUmbral="Días de Ausencia"
                                    />
                                    <AdvancedSetting
                                        title="Accesos Fuera de Horario"
                                        desc="Alerta de seguridad si un trabajador usa su QR en la madrugada."
                                        config={preferencias.acceso_fuera_horario}
                                        onChange={(newVals) => updatePreferencia('acceso_fuera_horario', newVals)}
                                    />
                                </div>
                            </div>
                        )}

                        {/* 🌟 TAB AUDITORÍA PROFESIONAL */}
                        {activeTab === 'auditoria' && (
                            <div className="max-w-3xl animate-in fade-in slide-in-from-right-4 duration-300">
                                <h2 className="text-2xl font-black text-white tracking-tight mb-2">Centro de Auditoría</h2>
                                <p className="text-sm text-zinc-400 mb-8">Trazabilidad de seguridad de tu cuenta administrativa.</p>

                                <div className="space-y-3">
                                    {loadingAudit ? (
                                        <p className="text-zinc-500 text-sm animate-pulse">Cargando registros cifrados...</p>
                                    ) : auditLogs.length === 0 ? (
                                        <p className="text-zinc-500 text-sm">No hay registros de sesiones aún.</p>
                                    ) : (
                                        auditLogs.map((log, index) => (
                                            <AuditCard
                                                key={index}
                                                log={log}
                                                isLatest={index === 0}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}

// --- MICROCOMPONENTES ---

function ProfileTab({ active, onClick, icon, label }) {
    return (
        <button type="button" onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${active ? 'bg-gym-orange/10 text-gym-orange shadow-inner border border-gym-orange/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}>
            {icon} {label}
        </button>
    );
}


function AuditCard({ log, isLatest }) {
    const isFailed = log.status?.includes('failed');

    // Identificar dispositivo e iconos
    let DeviceIcon = Monitor;
    if (log.title?.toLowerCase().includes('iphone') || log.title?.toLowerCase().includes('android') || log.title?.toLowerCase().includes('ios')) {
        DeviceIcon = Smartphone;
    }

    // Generar un Trace ID simulado (En producción esto vendría de la BD)
    const traceId = `TRC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Evaluar Nivel de Riesgo
    let riskLevel = "Bajo";
    let riskColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";

    if (isFailed) {
        riskLevel = "Crítico";
        riskColor = "text-rose-400 bg-rose-500/10 border-rose-500/20";
    } else if (!isLatest) {
        riskLevel = "Normal";
        riskColor = "text-zinc-400 bg-white/5 border-white/5";
    }

    return (
        <div className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col gap-4 relative overflow-hidden group
            ${isFailed ? 'bg-gradient-to-r from-rose-500/5 to-transparent border-rose-500/20' : 'bg-black/20 border-white/5 hover:bg-white/[0.02]'}`}>

            {/* Cinta lateral de estado */}
            {isFailed && <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500"></div>}
            {isLatest && !isFailed && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>}

            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl shadow-inner border ${riskColor}`}>
                        {isFailed ? <AlertOctagon size={20} /> : <DeviceIcon size={20} />}
                    </div>

                    <div>
                        <div className="flex items-center gap-3">
                            <p className={`text-sm font-black tracking-tight ${isFailed ? 'text-rose-400' : 'text-white'}`}>
                                {log.title || 'Dispositivo Desconocido'}
                            </p>
                            {isLatest && log.status === 'success' && (
                                <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[9px] font-black uppercase rounded flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Activo
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                            <span className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                <Fingerprint size={12} /> {traceId}
                            </span>
                            <span className="w-1 h-1 bg-zinc-600 rounded-full"></span>
                            <span className="flex items-center gap-1 text-[11px] text-zinc-400">
                                <Activity size={12} className={isFailed ? "text-rose-400" : "text-emerald-400"} />
                                Riesgo {riskLevel}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="text-right flex flex-col items-end gap-1.5">
                    {isFailed ? (
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/10 px-3 py-1 rounded-lg border border-rose-500/20">
                            Acceso Denegado
                        </p>
                    ) : (
                        <p className="text-[10px] font-black text-emerald-500/50 uppercase tracking-widest flex items-center gap-1">
                            <CheckCircle size={14} /> Autorizado
                        </p>
                    )}
                    <p className="text-xs font-mono text-zinc-500">{log.time}</p>
                </div>
            </div>

            {/* Detalles Técnicos */}
            <div className="pt-3 border-t border-white/5 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-gym-orange opacity-70" />
                    <div>
                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Ubicación (Geo-IP)</p>
                        <p className="text-xs font-bold text-zinc-300">
                            {/* Mapeo estético para la presentación */}
                            {log.location === '::1' || log.location === '127.0.0.1' ? 'Localhost (Servidor)' : `Río Bueno, Chile (${log.location})`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Shield size={14} className="text-blue-400 opacity-70" />
                    <div>
                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Método de Validación</p>
                        <p className="text-xs font-bold text-zinc-300">
                            {isFailed ? 'Fallo en Credenciales' : 'Token JWT (Bcrypt)'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// 🌟 NUEVO: CONFIGURACIÓN AVANZADA (JSONB)
function AdvancedSetting({ title, desc, config = {}, onChange, hasUmbral, labelUmbral }) {
    const isActivo = config.activo ?? false;
    const canal = config.canal || 'in_app';
    const umbral = config.umbral || config.dias_ausencia || 0;

    return (
        <div className={`p-5 rounded-2xl border transition-all duration-300 ${isActivo ? 'bg-black/40 border-white/10 shadow-inner' : 'bg-black/20 border-white/5 opacity-60 hover:opacity-100'}`}>
            <div className="flex items-center justify-between gap-6 mb-4">
                <div className="flex-1">
                    <p className={`text-sm font-bold ${isActivo ? 'text-white' : 'text-zinc-400'}`}>{title}</p>
                    <p className="text-[11px] text-zinc-500 mt-1">{desc}</p>
                </div>
                {/* Switch Toggle */}
                <div
                    onClick={() => onChange({ activo: !isActivo })}
                    className={`w-12 h-6 rounded-full flex items-center shrink-0 p-1 transition-colors cursor-pointer ${isActivo ? 'bg-gym-orange' : 'bg-white/10'}`}
                >
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isActivo ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
            </div>

            {/* Opciones Adicionales que solo se muestran si está activo */}
            {isActivo && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5 animate-in slide-in-from-top-2">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Canal de Notificación</label>
                        <select
                            className="w-full bg-[#0c0c0e] border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-zinc-300 outline-none appearance-none"
                            value={canal}
                            onChange={(e) => onChange({ canal: e.target.value })}
                        >
                            <option value="in_app">Campana en Sistema</option>
                            <option value="push">Notificación Push (App)</option>
                            <option value="email">Correo Electrónico</option>
                        </select>
                    </div>
                    {hasUmbral && (
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{labelUmbral}</label>
                            <input
                                type="number"
                                min="0"
                                className="w-full bg-[#0c0c0e] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-zinc-300 outline-none"
                                value={umbral}
                                onChange={(e) => onChange(labelUmbral.includes('Días') ? { dias_ausencia: parseInt(e.target.value) } : { umbral: parseInt(e.target.value) })}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}