import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/useAuth';
import {
    User, LogOut, Key, Heart, X, Edit, Save,
    Mail, Phone, Loader2, AlertCircle, Shield, Dumbbell, Briefcase
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import { toast } from 'sonner';
import { useConfirm } from '../../contexts/ConfirmContext';

export const PerfilEntrenador = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const confirm = useConfirm();

    const [perfil, setPerfil] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Modal edición
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({ email: '', telefono: '' });
    const [editErrors, setEditErrors] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    // Modal contraseña
    const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
    const [msg, setMsg] = useState({ text: '', isError: false });

    const fetchPerfil = async () => {
        try {
            const res = await axios.get(`/entrenadores/mi-perfil?t=${Date.now()}`);
            const data = res.data.body || res.data;
            setPerfil(data);
            setEditForm({
                email: data.email || user?.email || '',
                telefono: data.telefono || ''
            });
        } catch (err) {
            console.error("Error al obtener perfil entrenador:", err);
            toast.error("Error al cargar el perfil");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchPerfil(); }, [user?.id]);

    const handleLogout = async () => {
        const isConfirmed = await confirm({
            title: '¿Cerrar Sesión?',
            description: 'Tendrás que volver a ingresar tus credenciales para acceder al panel.',
            confirmText: 'Sí, salir',
            cancelText: 'Cancelar',
            type: 'logout',
        });
        if (isConfirmed) {
            logout();
            navigate('/login');
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
            await axios.patch(`/entrenadores/${perfil.id}`, {
                email: editForm.email,
                telefono: editForm.telefono || null
            });
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gym-orange"></div>
            </div>
        );
    }

    const trainerName = perfil?.nombre || user?.nombre || user?.username || 'Entrenador';

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-12 max-w-3xl mx-auto">

            {/* ── AVATAR + NOMBRE ── */}
            <div className="mt-2 text-center flex flex-col items-center">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-500/20 to-orange-700/10 rounded-full flex items-center justify-center border-4 border-zinc-800 shadow-2xl relative mb-4">
                    <User size={40} className="text-gym-orange" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 rounded-full border-2 border-zinc-900"></div>
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">{trainerName}</h1>
                <p className="text-gym-orange text-sm font-medium mt-1 flex items-center gap-1">
                    <Shield size={12} /> Entrenador Personal
                </p>
            </div>

            {/* ── INFORMACIÓN PERSONAL ── */}
            <div className="bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden mt-4">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/5 p-2 rounded-lg"><Briefcase size={18} className="text-gray-300" /></div>
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
                            {perfil?.nombre || 'No definido'}
                        </p>
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Correo Electrónico</p>
                        <p className="text-white bg-zinc-800/50 p-3 rounded-xl border border-white/5 flex items-center gap-2 overflow-hidden">
                            <Mail size={14} className="text-gym-orange shrink-0" />
                            <span className="truncate">{perfil?.email || user?.email || 'No definido'}</span>
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Teléfono</p>
                        <p className="text-white bg-zinc-800/50 p-3 rounded-xl border border-white/5 flex items-center gap-2">
                            <Phone size={14} className="text-gym-orange shrink-0" />
                            {perfil?.telefono || 'No definido'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Especialidad</p>
                        <p className="text-gym-orange bg-gym-orange/10 p-3 rounded-xl border border-gym-orange/20 font-medium flex items-center gap-2">
                            <Dumbbell size={14} className="shrink-0" />
                            {perfil?.especialidad || 'General'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">RUT</p>
                        <p className="text-white bg-zinc-800/50 p-3 rounded-xl border border-white/5">
                            {perfil?.rut || 'No definido'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Turno</p>
                        <p className="text-white bg-zinc-800/50 p-3 rounded-xl border border-white/5">
                            {perfil?.turno || 'No definido'}
                        </p>
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
                </div>
            </div>

            {/* ── CERRAR SESIÓN ── */}
            <button
                onClick={handleLogout}
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

                            {/* Teléfono */}
                            <div>
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5 block flex items-center gap-1">
                                    <Phone size={11} /> Teléfono
                                </label>
                                <input
                                    type="tel"
                                    value={editForm.telefono}
                                    onChange={e => setEditForm(p => ({ ...p, telefono: e.target.value }))}
                                    placeholder="+56 9 1234 5678"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-gym-orange focus:ring-1 focus:ring-orange-500/20 transition-all placeholder-zinc-600"
                                />
                            </div>

                            {/* Nota */}
                            <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl px-4 py-3 text-xs text-blue-400/80">
                                ℹ️ Para cambiar nombre, RUT, especialidad o turno, contacta al administrador del gimnasio.
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
                            <button type="submit" className="w-full bg-gym-orange hover:bg-orange-600 text-white font-bold py-3 rounded-xl mt-4 transition-colors">
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
