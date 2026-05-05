import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/useAuth';
import {
    User, LogOut, Settings, Key, Heart, X, CreditCard,
    Edit, Save, Dumbbell, Mail, Target, Loader2, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import { toast } from 'sonner';

export const Perfil = () => {
    const { user, login } = useAuth();
    const navigate = useNavigate();

    const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
    const [msg, setMsg] = useState({ text: '', isError: false });

    // Data del perfil
    const [infoData, setInfoData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [coaches, setCoaches] = useState([]);

    // Formulario de edición
    const [editForm, setEditForm] = useState({ email: '', id_entrenador: '', objetivo: '' });
    const [editErrors, setEditErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    const fetchPerfil = async () => {
        if (!user?.id) return;
        try {
            const [resPerfil, resCoaches] = await Promise.all([
                axios.get(`/clientes/${user.id}/stats?t=${Date.now()}`),
                axios.get('/entrenadores').catch(() => ({ data: { body: [] } }))
            ]);

            let data = resPerfil.data.body || resPerfil.data;
            if (data && data.body) data = data.body;

            setInfoData({
                infoPersonal: data.infoPersonal || {},
                planes: data.planesDisponibles || []
            });

            // Pre-cargar formulario de edición
            setEditForm({
                email: data.infoPersonal?.email || user?.email || '',
                id_entrenador: data.infoPersonal?.id_entrenador || '',
                objetivo: data.infoPersonal?.objetivo || ''
            });

            let coachesData = resCoaches.data.body || resCoaches.data || [];
            if (coachesData.body) coachesData = coachesData.body;
            setCoaches(Array.isArray(coachesData) ? coachesData : []);
        } catch (err) {
            console.error("Error al obtener perfil", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchPerfil(); }, [user?.id]);

    const doLogout = () => { logout(); navigate('/'); };
    const { logout } = useAuth();

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setMsg({ text: 'Cambiando...', isError: false });
        try {
            await axios.post('/auth/force-password-change', {
                username: user?.username,
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            });
            setMsg({ text: '¡Contraseña actualizada con éxito!', isError: false });
            setTimeout(() => {
                setPasswordModalOpen(false);
                setPasswords({ currentPassword: '', newPassword: '' });
                setMsg({ text: '', isError: false });
            }, 1500);
        } catch (error) {
            setMsg({ text: error.response?.data?.error || 'Error al cambiar contraseña', isError: true });
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        const errs = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!editForm.email) errs.email = 'El email es obligatorio';
        else if (!emailRegex.test(editForm.email)) errs.email = 'Formato de email inválido';
        setEditErrors(errs);
        if (Object.keys(errs).length > 0) return;

        setIsSaving(true);
        try {
            const payload = {
                email: editForm.email,
                id_entrenador: editForm.id_entrenador || null,
                objetivo: editForm.objetivo || null
            };
            await axios.patch(`/clientes/${user.id}`, payload);
            toast.success('Perfil actualizado', {
                description: 'Tus datos han sido guardados correctamente.'
            });
            setEditModalOpen(false);
            fetchPerfil();
        } catch (err) {
            const msg = err.response?.data?.error || 'Error al guardar los cambios';
            toast.error('Error al actualizar', { description: msg });
        } finally {
            setIsSaving(false);
        }
    };

    const calculateAge = (dateString) => {
        if (!dateString) return "No definido";
        try {
            const today = new Date();
            const birthDate = new Date(dateString);
            let age = today.getFullYear() - birthDate.getFullYear();
            if (
                today.getMonth() < birthDate.getMonth() ||
                (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())
            ) age--;
            return `${age} años`;
        } catch { return "No definido"; }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    const { infoPersonal, planes } = infoData || {};
    const entrenadorAsignado = coaches.find(c => String(c.id) === String(infoPersonal?.id_entrenador));

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-12 h-full relative">

            {/* ── AVATAR + NOMBRE ── */}
            <div className="mt-2 text-center flex flex-col items-center">
                <div className="w-24 h-24 bg-gradient-to-br from-zinc-700 to-zinc-900 rounded-full flex items-center justify-center border-4 border-zinc-800 shadow-2xl relative mb-4">
                    <User size={40} className="text-gray-400" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 rounded-full border-2 border-zinc-900"></div>
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                    {infoPersonal?.nombre || user?.nombre || user?.username || 'Mi Perfil'}
                </h1>
                <p className="text-gym-orange text-sm font-medium mt-1">Miembro Activo</p>
            </div>

            {/* ── INFORMACIÓN PERSONAL ── */}
            <div className="bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden mt-4">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/5 p-2 rounded-lg"><Settings size={18} className="text-gray-300" /></div>
                        <span className="text-white font-medium">Información Personal</span>
                    </div>
                    <button
                        onClick={() => setEditModalOpen(true)}
                        className="flex items-center gap-1.5 text-xs font-bold text-gym-orange hover:bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <Edit size={13} /> Editar
                    </button>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Nombre Completo</p>
                        <p className="text-white bg-zinc-800/50 p-3 rounded-xl border border-white/5">
                            {infoPersonal?.nombre || user?.nombre || 'No definido'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Correo Electrónico</p>
                        <p className="text-white bg-zinc-800/50 p-3 rounded-xl border border-white/5 flex items-center gap-2">
                            <Mail size={14} className="text-gym-orange shrink-0" />
                            {infoPersonal?.email || user?.email || 'No definido'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Edad</p>
                        <p className="text-white bg-zinc-800/50 p-3 rounded-xl border border-white/5">
                            {calculateAge(infoPersonal?.fecha_nacimiento)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Género</p>
                        <p className="text-white bg-zinc-800/50 p-3 rounded-xl border border-white/5">
                            {infoPersonal?.genero || 'No definido'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Dirección</p>
                        <p className="text-white bg-zinc-800/50 p-3 rounded-xl border border-white/5">
                            {infoPersonal?.direccion || 'Sin dirección registrada'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Objetivo de Entrenamiento</p>
                        <p className="text-gym-orange bg-gym-orange/10 p-3 rounded-xl border border-gym-orange/20 font-medium">
                            {infoPersonal?.objetivo || 'Sin objetivo definido'}
                        </p>
                    </div>
                </div>

                {/* Entrenador asignado */}
                <div className="px-5 pb-5">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Entrenador Asignado</p>
                    {entrenadorAsignado ? (
                        <div className="bg-zinc-800/50 p-3 rounded-xl border border-white/5 flex items-center gap-3">
                            <div className="w-8 h-8 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-center justify-center shrink-0">
                                <Dumbbell size={15} className="text-gym-orange" />
                            </div>
                            <div>
                                <p className="text-white font-medium text-sm">{entrenadorAsignado.nombre}</p>
                                {entrenadorAsignado.especialidad && (
                                    <p className="text-xs text-zinc-500">{entrenadorAsignado.especialidad}</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p className="text-zinc-500 italic bg-zinc-800/50 p-3 rounded-xl border border-white/5 text-sm">
                            Sin entrenador asignado
                        </p>
                    )}
                </div>
            </div>

            {/* ── PLAN VIGENTE ── */}
            <div className="bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center gap-3">
                    <div className="bg-white/5 p-2 rounded-lg"><CreditCard size={18} className="text-gray-300" /></div>
                    <span className="text-white font-medium">Gestionar Mi Plan</span>
                </div>
                <div className="p-5 space-y-4">
                    <p className="text-sm text-gray-400 leading-relaxed mb-4">
                        Accede a las opciones de renovación o cambio de tu membresía activa actual.
                    </p>
                    <div className="space-y-2">
                        {planes?.map((plan) => (
                            <div key={plan.id} className="bg-zinc-800/80 hover:bg-zinc-800 border border-white/5 rounded-2xl p-4 flex justify-between items-center transition-colors">
                                <div>
                                    <h4 className="text-white font-bold">{plan.nombre}</h4>
                                    <p className="text-xs text-emerald-400 mt-0.5">{plan.duracion_meses} Meses</p>
                                </div>
                                <div className="text-right flex items-center gap-4">
                                    <span className="text-gym-orange font-bold">${Number(plan.precio).toLocaleString()}</span>
                                    <button className="bg-gym-orange text-black font-semibold text-xs py-1.5 px-3 rounded-lg hover:bg-orange-500 active:scale-95 transition-transform">
                                        Renovar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── SEGURIDAD ── */}
            <div className="bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center gap-3">
                    <div className="bg-white/5 p-2 rounded-lg"><Key size={18} className="text-gray-300" /></div>
                    <span className="text-white font-medium">Seguridad y Acceso</span>
                </div>
                <div className="p-2">
                    <button
                        onClick={() => setPasswordModalOpen(true)}
                        className="w-full text-left p-3 hover:bg-white/5 rounded-xl transition-colors flex justify-between items-center text-sm text-gray-300"
                    >
                        Cambiar Contraseña
                        <ChevronRightIcon />
                    </button>
                    <button className="w-full text-left p-3 hover:bg-white/5 rounded-xl transition-colors flex justify-between items-center text-sm text-gray-300 opacity-50 cursor-not-allowed">
                        Configurar Autenticación 2FA (Pronto)
                        <ChevronRightIcon />
                    </button>
                </div>
            </div>

            {/* ── CERRAR SESIÓN ── */}
            <button
                onClick={doLogout}
                className="mt-4 w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 font-bold py-4 rounded-2xl transition-colors flex justify-center items-center gap-2"
            >
                <LogOut size={20} />
                Cerrar Sesión
            </button>

            <p className="text-center text-xs text-gray-600 mt-4 flex items-center justify-center gap-1">
                Hecho con <Heart size={10} className="text-gym-orange" /> por GymTrack
            </p>

            {/* ══════════════════════════════════════════
                MODAL: EDITAR PERFIL
            ══════════════════════════════════════════ */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md relative shadow-2xl">

                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center">
                                    <Edit size={17} className="text-gym-orange" />
                                </div>
                                <div>
                                    <h2 className="text-white font-bold">Editar Perfil</h2>
                                    <p className="text-xs text-zinc-500">Actualiza tu información de contacto</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setEditModalOpen(false); setEditErrors({}); }}
                                className="p-2 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Formulario */}
                        <form onSubmit={handleEditSubmit} className="p-5 space-y-4">

                            {/* Email */}
                            <div>
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5 block flex items-center gap-1">
                                    <Mail size={11} /> Correo Electrónico *
                                </label>
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={e => {
                                        setEditForm(p => ({ ...p, email: e.target.value }));
                                        if (editErrors.email) setEditErrors(p => ({ ...p, email: null }));
                                    }}
                                    placeholder="tu@correo.com"
                                    className={`w-full bg-black/40 border rounded-xl px-4 py-3 text-white text-sm outline-none transition-all placeholder-zinc-600 focus:ring-1 ${editErrors.email
                                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                                        : 'border-white/10 focus:border-gym-orange focus:ring-orange-500/20'}`}
                                />
                                {editErrors.email && (
                                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                                        <AlertCircle size={10} /> {editErrors.email}
                                    </p>
                                )}
                            </div>

                            {/* Objetivo */}
                            <div>
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5 block flex items-center gap-1">
                                    <Target size={11} /> Objetivo de Entrenamiento
                                </label>
                                <input
                                    type="text"
                                    value={editForm.objetivo}
                                    onChange={e => setEditForm(p => ({ ...p, objetivo: e.target.value }))}
                                    placeholder="Ej: Bajar de peso, ganar músculo..."
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-gym-orange focus:ring-1 focus:ring-orange-500/20 transition-all placeholder-zinc-600"
                                />
                            </div>

                            {/* Entrenador — tarjetas visuales */}
                            <div>
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block flex items-center gap-1">
                                    <Dumbbell size={11} /> Entrenador Asignado
                                </label>
                                <div className="grid grid-cols-1 gap-2 max-h-52 overflow-y-auto pr-0.5">

                                    {/* Tarjeta: Sin entrenador */}
                                    <button
                                        type="button"
                                        onClick={() => setEditForm(p => ({ ...p, id_entrenador: '' }))}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                                            editForm.id_entrenador === ''
                                                ? 'bg-zinc-700/60 border-zinc-400 ring-1 ring-zinc-400/40'
                                                : 'bg-black/30 border-white/8 hover:border-white/20 hover:bg-white/5'
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                            editForm.id_entrenador === ''
                                                ? 'bg-zinc-600 border border-zinc-400'
                                                : 'bg-white/5 border border-white/10'
                                        }`}>
                                            <X size={14} className={editForm.id_entrenador === '' ? 'text-white' : 'text-zinc-500'} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-bold truncate ${editForm.id_entrenador === '' ? 'text-white' : 'text-zinc-400'}`}>
                                                Sin entrenador
                                            </p>
                                            <p className="text-[10px] text-zinc-600">Entrenaré de forma independiente</p>
                                        </div>
                                        {editForm.id_entrenador === '' && (
                                            <div className="w-2 h-2 rounded-full bg-zinc-300 shrink-0" />
                                        )}
                                    </button>

                                    {/* Tarjetas: Entrenadores disponibles */}
                                    {coaches.map(c => {
                                        const isSelected = String(editForm.id_entrenador) === String(c.id);
                                        return (
                                            <button
                                                key={c.id}
                                                type="button"
                                                onClick={() => setEditForm(p => ({ ...p, id_entrenador: c.id }))}
                                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                                                    isSelected
                                                        ? 'bg-orange-500/10 border-gym-orange ring-1 ring-orange-500/30'
                                                        : 'bg-black/30 border-white/8 hover:border-orange-500/30 hover:bg-orange-500/5'
                                                }`}
                                            >
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition-colors ${
                                                    isSelected
                                                        ? 'bg-gym-orange text-white'
                                                        : 'bg-white/5 border border-white/10 text-zinc-400'
                                                }`}>
                                                    {c.nombre.charAt(0).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                                                        {c.nombre}
                                                    </p>
                                                    {c.especialidad && (
                                                        <p className={`text-[10px] truncate ${isSelected ? 'text-orange-400' : 'text-zinc-600'}`}>
                                                            {c.especialidad}
                                                        </p>
                                                    )}
                                                </div>
                                                {isSelected && (
                                                    <div className="w-2 h-2 rounded-full bg-gym-orange shrink-0" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Nota */}
                            <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl px-4 py-3 text-xs text-blue-400/80">
                                ℹ️ Los cambios de nombre, RUT, fecha de nacimiento y dirección deben solicitarse al administrador del gimnasio.
                            </div>

                            {/* Botones */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setEditModalOpen(false); setEditErrors({}); }}
                                    className="flex-1 py-3 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl text-sm font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold text-sm rounded-xl hover:from-orange-500 hover:to-orange-400 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-60 flex items-center justify-center gap-2"
                                >
                                    {isSaving
                                        ? <><Loader2 size={15} className="animate-spin" /> Guardando...</>
                                        : <><Save size={15} /> Guardar Cambios</>
                                    }
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════
                MODAL: CAMBIAR CONTRASEÑA
            ══════════════════════════════════════════ */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm relative">
                        <button onClick={() => setPasswordModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                            <X size={20} />
                        </button>
                        <h2 className="text-xl font-bold text-white mb-4">Cambiar Contraseña</h2>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 font-bold uppercase">Contraseña Actual</label>
                                <input
                                    type="password"
                                    required
                                    value={passwords.currentPassword}
                                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                                    className="w-full bg-zinc-800 border border-white/10 rounded-xl p-3 text-white mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 font-bold uppercase">Nueva Contraseña</label>
                                <input
                                    type="password"
                                    required
                                    value={passwords.newPassword}
                                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                    className="w-full bg-zinc-800 border border-white/10 rounded-xl p-3 text-white mt-1"
                                />
                            </div>
                            {msg.text && (
                                <p className={`text-sm ${msg.isError ? 'text-red-400' : 'text-emerald-400'}`}>{msg.text}</p>
                            )}
                            <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold py-3 rounded-xl mt-4">
                                Confirmar Cambio
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const ChevronRightIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
        <path d="m9 18 6-6-6-6" />
    </svg>
);
