import { useState, useEffect } from 'react';
import {
    X, Settings, Building, CreditCard, Lock, Database,
    Save, DownloadCloud, AlertOctagon, CheckCircle, Landmark
} from 'lucide-react';
import { toast } from 'sonner';
import axios from '../../../api/axios';

export function AdminSettingsModal({ isOpen, onClose }) {
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);

    // 🌟 ESTADO REAL Y UNIFICADO
    const [config, setConfig] = useState({
        razon_social: '',
        nombre_fantasia: '',
        rut_empresa: '',
        giro_comercial: '',
        direccion_comercial: '',
        telefono_contacto: '',
        email_contacto: '',
        moneda_base: 'CLP',
        zona_horaria: 'America/Santiago',
        datos_bancarios: {
            banco: '',
            tipo_cuenta: 'Cuenta Corriente',
            numero_cuenta: '',
            correo_comprobantes: ''
        },
        // 🌟 NUEVO: Estado de Políticas de Seguridad
        politicas_seguridad: {
            forzar_cambio_password: false,
            dias_caducidad: 90,
            autenticacion_2fa: false
        }
    });

    useEffect(() => {
        if (isOpen) {
            fetchConfiguracion();
        }
    }, [isOpen]);

    const fetchConfiguracion = async () => {
        setFetching(true);
        try {
            const response = await axios.get('/configuracion');
            if (response.data && response.data.body) {
                const data = response.data.body;

                // Parseo seguro JSONB Bancario
                let datosBancarios = data.datos_bancarios;
                if (typeof datosBancarios === 'string') {
                    try { datosBancarios = JSON.parse(datosBancarios); } catch (e) { console.error("Error parseando JSONB Bancario"); }
                }

                // 🌟 Parseo seguro JSONB Seguridad
                let politicasSeguridad = data.politicas_seguridad;
                if (typeof politicasSeguridad === 'string') {
                    try { politicasSeguridad = JSON.parse(politicasSeguridad); } catch (e) { console.error("Error parseando JSONB Seguridad"); }
                }

                setConfig({
                    ...data,
                    datos_bancarios: datosBancarios || { banco: '', tipo_cuenta: 'Cuenta Corriente', numero_cuenta: '', correo_comprobantes: '' },
                    politicas_seguridad: politicasSeguridad || { forzar_cambio_password: false, dias_caducidad: 90, autenticacion_2fa: false }
                });
            }
        } catch (error) {
            console.error("Error cargando configuración:", error);
            toast.error("No se pudo cargar la configuración de la empresa.");
        } finally {
            setFetching(false);
        }
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            await axios.put('/configuracion', config);
            toast.success("Configuración actualizada", { description: "Los parámetros de la empresa han sido guardados." });
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.error || "Error al actualizar configuración.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setConfig(prev => ({ ...prev, [name]: value }));
    };

    const handleBancoChange = (e) => {
        const { name, value } = e.target;
        setConfig(prev => ({
            ...prev,
            datos_bancarios: { ...prev.datos_bancarios, [name]: value }
        }));
    };

    // Manejador para las políticas de seguridad
    const handlePoliticasChange = (key, value) => {
        setConfig(prev => ({
            ...prev,
            politicas_seguridad: { ...prev.politicas_seguridad, [key]: value }
        }));
    };

    const handleBackup = async () => {
        const toastId = toast.loading('Comprimiendo base de datos...');

        try {
            // 1. Llamada GET indicando que esperamos un archivo binario (blob)
            const response = await axios.get('/configuracion/backup', {
                responseType: 'blob'
            });

            // 2. Crear una URL virtual temporal en el navegador con el archivo
            const url = window.URL.createObjectURL(new Blob([response.data]));

            // 3. Crear un enlace <a> invisible y "hacer clic" automáticamente en él
            const link = document.createElement('a');
            link.href = url;

            const date = new Date().toISOString().split('T')[0];
            link.setAttribute('download', `gymtrack_backup_${date}.json`);

            document.body.appendChild(link);
            link.click();

            // 4. Limpiar el enlace invisible
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success('Respaldo descargado exitosamente', { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error('Error al generar el respaldo', {
                id: toastId,
                description: 'Asegúrate de que las herramientas de BD están instaladas en el servidor.'
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity" onClick={onClose}></div>

            <div className="w-full max-w-5xl h-[85vh] bg-[#0c0c0e] border border-white/10 rounded-[2rem] relative z-10 shadow-[0_0_80px_rgba(0,0,0,0.9)] flex overflow-hidden animate-in zoom-in-95 duration-300">

                {/* Sidebar del Modal */}
                <div className="w-64 bg-black/40 border-r border-white/5 flex flex-col hidden md:flex shrink-0 z-20">
                    <div className="p-6 border-b border-white/5">
                        <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                            <Settings size={18} className="text-zinc-400" /> Configuración
                        </h2>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Parámetros Globales</p>
                    </div>
                    <div className="flex-1 p-4 space-y-1">
                        <SettingsTab active={activeTab === 'general'} onClick={() => setActiveTab('general')} icon={<Building size={16} />} label="Perfil del Gimnasio" />
                        <SettingsTab active={activeTab === 'facturacion'} onClick={() => setActiveTab('facturacion')} icon={<CreditCard size={16} />} label="Facturación y Pagos" />
                        <SettingsTab active={activeTab === 'seguridad'} onClick={() => setActiveTab('seguridad')} icon={<Lock size={16} />} label="Seguridad y Accesos" />
                        <SettingsTab active={activeTab === 'backup'} onClick={() => setActiveTab('backup')} icon={<Database size={16} />} label="Base de Datos" />
                    </div>
                </div>

                {/* Contenido del Modal */}
                <div className="flex-1 flex flex-col bg-gradient-to-br from-white/[0.01] to-transparent relative z-10">
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 rounded-full transition-all z-20">
                        <X size={18} />
                    </button>

                    <div className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar">
                        {fetching && activeTab !== 'backup' ? (
                            <div className="h-full flex items-center justify-center">
                                <p className="text-zinc-500 text-sm animate-pulse">Cargando parámetros del sistema...</p>
                            </div>
                        ) : (
                            <>
                                {/* TAB: GENERAL */}
                                {activeTab === 'general' && (
                                    <div className="max-w-2xl animate-in fade-in slide-in-from-right-4 duration-300">
                                        <h3 className="text-2xl font-black text-white tracking-tight mb-2">Perfil del Establecimiento</h3>
                                        <p className="text-sm text-zinc-400 mb-8">Estos datos validan la instalación y se usan en facturas y reportes.</p>

                                        <form onSubmit={handleSave} className="space-y-6">
                                            {/* ... (Todo el formulario de General se mantiene igual) ... */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Razón Social</label>
                                                    <input type="text" name="razon_social" value={config.razon_social} onChange={handleChange} required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-gym-orange outline-none shadow-inner" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Nombre Comercial</label>
                                                    <input type="text" name="nombre_fantasia" value={config.nombre_fantasia} onChange={handleChange} required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-gym-orange outline-none shadow-inner" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">RUT Empresa</label>
                                                    <input type="text" name="rut_empresa" value={config.rut_empresa} onChange={handleChange} required className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-gym-orange outline-none shadow-inner" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Giro Comercial</label>
                                                    <input type="text" name="giro_comercial" value={config.giro_comercial} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-gym-orange outline-none shadow-inner" />
                                                </div>
                                                <div className="space-y-2 md:col-span-2">
                                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Dirección Comercial</label>
                                                    <input type="text" name="direccion_comercial" value={config.direccion_comercial} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-gym-orange outline-none shadow-inner" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Email Corporativo</label>
                                                    <input type="email" name="email_contacto" value={config.email_contacto} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-gym-orange outline-none shadow-inner" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Teléfono de Soporte</label>
                                                    <input type="text" name="telefono_contacto" value={config.telefono_contacto} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-gym-orange outline-none shadow-inner" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Moneda Base</label>
                                                    <select name="moneda_base" value={config.moneda_base} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-gym-orange outline-none shadow-inner appearance-none">
                                                        <option value="CLP">Peso Chileno (CLP)</option>
                                                        <option value="USD">Dólar (USD)</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Zona Horaria</label>
                                                    <select name="zona_horaria" value={config.zona_horaria} onChange={handleChange} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:border-gym-orange outline-none shadow-inner appearance-none">
                                                        <option value="America/Santiago">América / Santiago</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="pt-4 border-t border-white/5 flex justify-end">
                                                <button disabled={loading} type="submit" className="bg-gym-orange hover:bg-orange-500 text-white px-8 py-3 rounded-xl text-sm font-black shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all flex items-center gap-2">
                                                    <Save size={16} /> {loading ? 'Guardando...' : 'Aplicar Cambios'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}

                                {/* TAB: FACTURACIÓN */}
                                {activeTab === 'facturacion' && (
                                    <div className="max-w-2xl animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="flex justify-between items-end mb-8">
                                            <div>
                                                <h3 className="text-2xl font-black text-white tracking-tight mb-1">Medios de Pago</h3>
                                                <p className="text-sm text-zinc-400">Configura los métodos de cobro para las membresías.</p>
                                            </div>
                                            <button onClick={handleSave} disabled={loading} className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
                                                <Save size={14} /> Guardar Ajustes
                                            </button>
                                        </div>

                                        <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Landmark size={16} className="text-blue-400" /> Cuenta para Transferencias
                                        </h4>
                                        <div className="p-6 bg-black/40 rounded-2xl border border-white/10 shadow-inner grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Institución Bancaria</label>
                                                <input type="text" name="banco" value={config.datos_bancarios.banco} onChange={handleBancoChange} className="w-full bg-[#0c0c0e] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:border-blue-500 outline-none" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tipo de Cuenta</label>
                                                <select name="tipo_cuenta" value={config.datos_bancarios.tipo_cuenta} onChange={handleBancoChange} className="w-full bg-[#0c0c0e] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:border-blue-500 outline-none appearance-none">
                                                    <option value="Cuenta Corriente">Cuenta Corriente</option>
                                                    <option value="Cuenta Vista">Cuenta Vista / RUT</option>
                                                    <option value="Cuenta de Ahorro">Cuenta de Ahorro</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Número de Cuenta</label>
                                                <input type="text" name="numero_cuenta" value={config.datos_bancarios.numero_cuenta} onChange={handleBancoChange} className="w-full bg-[#0c0c0e] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:border-blue-500 outline-none" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Correo de Comprobantes</label>
                                                <input type="email" name="correo_comprobantes" value={config.datos_bancarios.correo_comprobantes} onChange={handleBancoChange} className="w-full bg-[#0c0c0e] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:border-blue-500 outline-none" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/*  TAB: SEGURIDAD (UNIFICADO Y CONTROLADO) */}
                                {activeTab === 'seguridad' && (
                                    <div className="max-w-2xl animate-in fade-in slide-in-from-right-4 duration-300">
                                        <div className="flex justify-between items-end mb-8">
                                            <div>
                                                <h3 className="text-2xl font-black text-white tracking-tight mb-2">Políticas de Seguridad</h3>
                                                <p className="text-sm text-zinc-400">Controla el acceso al sistema y las restricciones del Staff.</p>
                                            </div>
                                            <button onClick={handleSave} disabled={loading} className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
                                                <Save size={14} /> Guardar Políticas
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Control de Contraseña */}
                                            <div className={`p-5 rounded-2xl border transition-all duration-300 ${config.politicas_seguridad.forzar_cambio_password ? 'bg-black/40 border-white/10 shadow-inner' : 'bg-black/20 border-white/5'}`}>
                                                <div className="flex items-center justify-between gap-6 mb-4">
                                                    <div className="flex-1">
                                                        <p className={`text-sm font-bold ${config.politicas_seguridad.forzar_cambio_password ? 'text-white' : 'text-zinc-400'}`}>Forzar cambio de contraseña</p>
                                                        <p className="text-[11px] text-zinc-500 mt-1">Exigir al staff renovar su clave tras un periodo determinado.</p>
                                                    </div>
                                                    <div onClick={() => handlePoliticasChange('forzar_cambio_password', !config.politicas_seguridad.forzar_cambio_password)} className={`w-12 h-6 rounded-full flex items-center shrink-0 p-1 transition-colors cursor-pointer ${config.politicas_seguridad.forzar_cambio_password ? 'bg-gym-orange' : 'bg-white/10'}`}>
                                                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${config.politicas_seguridad.forzar_cambio_password ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                                    </div>
                                                </div>
                                                {config.politicas_seguridad.forzar_cambio_password && (
                                                    <div className="pt-4 border-t border-white/5 animate-in slide-in-from-top-2">
                                                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Días de Caducidad</label>
                                                        <input
                                                            type="number" min="1"
                                                            value={config.politicas_seguridad.dias_caducidad}
                                                            onChange={(e) => handlePoliticasChange('dias_caducidad', parseInt(e.target.value) || 90)}
                                                            className="w-full mt-1 bg-[#0c0c0e] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white focus:border-gym-orange outline-none"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Control de 2FA */}
                                            <div className="p-5 rounded-2xl border border-white/5 bg-black/20 flex items-center justify-between gap-6">
                                                <div className="flex-1">
                                                    <p className={`text-sm font-bold ${config.politicas_seguridad.autenticacion_2fa ? 'text-white' : 'text-zinc-400'}`}>Verificación en 2 pasos (2FA)</p>
                                                    <p className="text-[11px] text-zinc-500 mt-1">Requerir código de seguridad para inicios de sesión en dispositivos nuevos.</p>
                                                </div>
                                                <div onClick={() => handlePoliticasChange('autenticacion_2fa', !config.politicas_seguridad.autenticacion_2fa)} className={`w-12 h-6 rounded-full flex items-center shrink-0 p-1 transition-colors cursor-pointer ${config.politicas_seguridad.autenticacion_2fa ? 'bg-gym-orange' : 'bg-white/10'}`}>
                                                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${config.politicas_seguridad.autenticacion_2fa ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* TAB: BACKUP */}
                                {activeTab === 'backup' && (
                                    <div className="max-w-2xl animate-in fade-in slide-in-from-right-4 duration-300">
                                        <h3 className="text-2xl font-black text-white tracking-tight mb-2">Gestión de Datos</h3>
                                        <p className="text-sm text-zinc-400 mb-8">Respalda toda la información y datos a tu base de datos PostgreSQL.</p>
                                        <p className="text-sm text-zinc-400 mb-8">Portabilidad: Un archivo JSON es extremadamente fácil de leer en Excel, PowerBI, o de inyectar en otro sistema en el futuro.</p>
                                        <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 mb-6">
                                            <div className="flex items-center gap-3 mb-2">
                                                <CheckCircle className="text-emerald-400" size={20} />
                                                <h4 className="font-bold text-emerald-400">Sistema Saludable</h4>
                                            </div>
                                            <button onClick={handleBackup} className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all flex items-center gap-2">
                                                <DownloadCloud size={16} /> Descargar Respaldo Manual (.JSON)
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Microcomponente
function SettingsTab({ active, onClick, icon, label }) {
    return (
        <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${active ? 'bg-white/10 text-white shadow-inner' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'}`}>
            <span className={active ? 'text-gym-orange' : ''}>{icon}</span> {label}
        </button>
    );
}