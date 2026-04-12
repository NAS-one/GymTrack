import { useState } from 'react';
import { ShieldAlert, Key, ArrowRight, Lock } from 'lucide-react';
import { toast } from 'sonner';
import axios from '../../api/axios';
import { useNavigate } from 'react-router-dom';

export function ExpiredPasswordModal({ isOpen, userCredentials, onComplete }) {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            return toast.error("Las contraseñas no coinciden");
        }
        if (newPassword.length < 6) {
            return toast.error("La nueva contraseña debe tener al menos 6 caracteres");
        }
        if (newPassword === userCredentials.password) {
            return toast.error("La nueva contraseña no puede ser igual a la anterior");
        }

        setLoading(true);
        try {
            const response = await axios.post('/auth/force-password-change', {
                username: userCredentials.username,
                currentPassword: userCredentials.password,
                newPassword: newPassword
            });

            toast.success("¡Contraseña actualizada!", { description: "Iniciando sesión de forma segura..." });

            // El backend nos devolverá el token y el usuario directamente para no tener que loguearnos de nuevo
            onComplete(response.data.body);

        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.error || "Error al actualizar la contraseña");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md"></div>

            <div className="w-full max-w-md bg-[#0c0c0e] border border-rose-500/20 rounded-3xl relative z-10 shadow-[0_0_100px_rgba(244,63,94,0.2)] overflow-hidden animate-in zoom-in-95 duration-300">

                {/* Cabecera del Modal */}
                <div className="p-8 text-center border-b border-white/5 bg-rose-500/5">
                    <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-500 shadow-inner">
                        <ShieldAlert size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Acceso Bloqueado</h2>
                    <p className="text-sm text-rose-400/80 mt-2 font-medium">
                        Por políticas de seguridad del sistema, tu contraseña ha caducado (han pasado más de 90 días).
                    </p>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <Key size={14} className="text-gym-orange" /> Nueva Contraseña
                        </label>
                        <input
                            type="password" required minLength={6}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-rose-500 outline-none transition-colors"
                            value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                            <Lock size={14} className="text-gym-orange" /> Confirmar Contraseña
                        </label>
                        <input
                            type="password" required minLength={6}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-rose-500 outline-none transition-colors"
                            value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    <button
                        disabled={loading} type="submit"
                        className="w-full mt-4 bg-rose-600 hover:bg-rose-500 text-white py-3.5 rounded-xl text-sm font-black tracking-wide shadow-[0_0_20px_rgba(225,29,72,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? 'Actualizando y Conectando...' : 'Actualizar y Entrar'} <ArrowRight size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
}