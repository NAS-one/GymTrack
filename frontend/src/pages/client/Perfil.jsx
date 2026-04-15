import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/useAuth';
import { User, LogOut, Settings, Key, Heart, X, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';

export const Perfil = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
    const [msg, setMsg] = useState({ text: '', isError: false });

    // Estado local para traer Data Real
    const [infoData, setInfoData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchPerfil = async () => {
            if (!user?.id) return;
            try {
                const response = await axios.get(`/clientes/${user.id}/stats`);
                setInfoData({
                    infoPersonal: response.data.body?.infoPersonal || {},
                    planes: response.data.body?.planesDisponibles || []
                });
            } catch (error) {
                console.error("Error al obtener perfil", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPerfil();
    }, [user?.id]);

    const doLogout = () => {
        logout();
        navigate('/');
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    const { infoPersonal, planes } = infoData || {};

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-12 h-full relative">
            <div className="mt-2 text-center flex flex-col items-center">
                <div className="w-24 h-24 bg-gradient-to-br from-zinc-700 to-zinc-900 rounded-full flex items-center justify-center border-4 border-zinc-800 shadow-2xl relative mb-4">
                    <User size={40} className="text-gray-400" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-500 rounded-full border-2 border-zinc-900"></div>
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">{infoPersonal?.nombre || user?.nombre || user?.username || 'Mi Perfil'}</h1>
                <p className="text-gym-orange text-sm font-medium mt-1">Miembro Activo</p>
            </div>

            <div className="bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden mt-4">
                <div className="p-4 border-b border-white/5 flex items-center gap-3">
                    <div className="bg-white/5 p-2 rounded-lg"><Settings size={18} className="text-gray-300" /></div>
                    <span className="text-white font-medium">Información Personal</span>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Nombre Completo</p>
                        <p className="text-white bg-zinc-800/50 p-3 rounded-xl border border-white/5">{infoPersonal?.nombre || user?.nombre || 'No definido'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Correo Electrónico</p>
                        <p className="text-white bg-zinc-800/50 p-3 rounded-xl border border-white/5">{infoPersonal?.email || user?.email || 'No definido'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Nombre de Usuario</p>
                        <p className="text-white bg-zinc-800/50 p-3 rounded-xl border border-white/5">{infoPersonal?.username || user?.username || 'No definido'}</p>
                    </div>
                </div>
            </div>

            <div className="bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden">
                <div className="p-4 border-b border-white/5 flex items-center gap-3">
                    <div className="bg-white/5 p-2 rounded-lg"><CreditCard size={18} className="text-gray-300" /></div>
                    <span className="text-white font-medium">Gestionar Mi Plan</span>
                </div>
                <div className="p-5 space-y-4">
                    <p className="text-sm text-gray-400 leading-relaxed mb-4">Accede a las opciones de renovación o cambio de tu membresía activa actual. Elige tu próximo objetivo estructurado.</p>

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
)
