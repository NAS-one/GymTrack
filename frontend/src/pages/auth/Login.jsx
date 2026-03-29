import { useState } from 'react';
import axios from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/useAuth';
// Importamos iconos
import { HiEye, HiEyeOff } from 'react-icons/hi';
import { BiDumbbell } from 'react-icons/bi';
import { QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export function Login() {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false); // Estado de carga visual
    const [loginMethod, setLoginMethod] = useState('email'); // 'email' | 'qr'

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await axios.post('auth/login', { username, password });
            const { token, user } = response.data.body;
            login(user, token);

            // Redirección inteligente según el rol del usuario
            if (user.role === 'cliente') {
                navigate('/client/dashboard');
            } else if (user.role === 'administrador' || user.role === 'recepcionista') {
                navigate('/dashboard');
            } else {
                navigate('/'); // O a tu página por defecto
            }
        } catch (err) {
            console.error(err);
            if (err.response && err.response.data && err.response.data.body) {
                setError(err.response.data.body);
            } else {
                setError('No se pudo conectar con el servidor');
            }
        } finally {
            setLoading(false);
        }
    };



    return (
        // FONDO: Degradado oscuro sutil y profesional
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-black to-zinc-900 text-white font-sans selection:bg-orange-500 selection:text-white p-4">

            {/* TARJETA PRINCIPAL: Efecto Glassmorphism sutil */}
            <div className="w-full max-w-[420px] bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-3xl p-8 shadow-2xl shadow-black/50 animate-fade-in-up">

                {/* HEADER: Logo y Bienvenida */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 to-orange-400 text-white shadow-lg shadow-orange-500/20 mb-5 transform hover:scale-105 transition-transform duration-300">
                        <BiDumbbell size={28} />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Bienvenido a GymTrack</h1>
                    <p className="text-zinc-400 text-sm">Ingresa a tu cuenta o regístrate para comenzar.</p>
                </div>

                {/* TABS DE MÉTODOS DE INICIO DE SESIÓN */}
                <div className="flex bg-zinc-950/50 rounded-xl p-1 mb-6 border border-zinc-800/50 relative z-10 p-1">
                    <button
                        type="button"
                        onClick={() => setLoginMethod('email')}
                        className={`flex-1 flex items-center justify-center gap-2 text-sm font-semibold rounded-lg py-2.5 transition-all duration-300 ${loginMethod === 'email' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'}`}
                    >
                        Correo
                    </button>
                    <button
                        type="button"
                        onClick={() => setLoginMethod('qr')}
                        className={`flex-1 flex items-center justify-center gap-2 text-sm font-semibold rounded-lg py-2.5 transition-all duration-300 ${loginMethod === 'qr' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'}`}
                    >
                        <QrCode size={18} /> Código QR
                    </button>
                </div>

                {loginMethod === 'qr' ? (
                    <div className="flex flex-col items-center justify-center space-y-6 py-6 animate-fade-in-up">
                        <div className="bg-white p-5 rounded-3xl shadow-[0_0_40px_-10px_rgba(249,115,22,0.3)] border-4 border-orange-500/20 transform hover:scale-105 transition-transform duration-500">
                            <QRCodeSVG value="gymtrack-login://auth/123456789" size={200} level="H" fgColor="#09090b" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="font-semibold text-white">Inicio Rápido con QR</h3>
                            <p className="text-sm text-zinc-400 px-4 leading-relaxed">
                                Abre la aplicación móvil de GymTrack en tu celular y escanea este código.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="animate-fade-in-up">


                        {/* FORMULARIO */}
                        <form onSubmit={handleLogin} className="space-y-5">

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-400 ml-1 uppercase tracking-wide">Correo o Usuario</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3.5 text-white text-sm placeholder-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                                    placeholder="ejemplo@correo.com o usuario"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-400 ml-1 uppercase tracking-wide">Contraseña</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl px-4 py-3.5 text-white text-sm placeholder-zinc-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all pr-12"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                                    </button>
                                </div>
                            </div>

                            {/* MENSAJE DE ERROR ANIMADO */}
                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-xs font-medium text-center animate-pulse">
                                    ⚠️ {error}
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-1">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input type="checkbox" className="accent-orange-500 w-4 h-4 rounded border-zinc-700 bg-zinc-800 cursor-pointer" />
                                    <span className="text-xs text-zinc-400 group-hover:text-zinc-300 transition-colors">Recordarme</span>
                                </label>
                                <a href="#" className="text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors">¿Olvidaste tu contraseña?</a>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-orange-600 to-orange-500 text-white py-3.5 rounded-xl font-bold text-sm hover:from-orange-500 hover:to-orange-400 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-orange-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    "Iniciar Sesión"
                                )}
                            </button>

                        </form>
                    </div>
                )}

            </div>

            {/* Footer Branding sutil */}
            <div className="fixed bottom-4 text-zinc-700 text-[10px] font-medium tracking-widest uppercase">
                Powered by GymTrack System
            </div>

        </div>
    );
}
