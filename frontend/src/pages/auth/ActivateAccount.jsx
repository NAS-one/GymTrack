import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import axios from '../../api/axios';
import { HiEye, HiEyeOff } from 'react-icons/hi';
import { CheckCircle2, Circle } from 'lucide-react';

export const ActivateAccount = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Requisitos en tiempo real
    const requirements = [
        { id: 'length', text: 'Mínimo 8 caracteres', test: (p) => p.length >= 8 },
        { id: 'letter', text: 'Contiene alguna letra', test: (p) => /[A-Za-z]/.test(p) },
        { id: 'number', text: 'Al menos un número', test: (p) => /\d/.test(p) },
        { id: 'symbol', text: 'Un símbolo especial (@$!%*?.&)', test: (p) => /[@$!%*?.&\-]/.test(p) },
    ];

    useEffect(() => {
        if (!token) {
            toast.error('Token de activación inválido o faltante.');
            navigate('/');
        }
    }, [token, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            return toast.error('Las contraseñas no coinciden.');
        }

        // Validación manual rápida (el backend hará la validación fuerte)
        if (password.length < 8) {
            return toast.error('La contraseña debe tener al menos 8 caracteres.');
        }

        setIsLoading(true);

        try {
            const response = await axios.post('/auth/activate', { token, password });

            toast.success('¡Cuenta activada exitosamente!');
            navigate('/'); // Redirigir al login
        } catch (err) {
            if (err.response && err.response.data && err.response.data.error) {
                toast.error(err.response.data.error);
            } else {
                toast.error('Error del servidor o de red al activar.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 border-t-4 border-emerald-500 rounded-lg">
            <div className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-700">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-white mb-2">Activa tu cuenta</h2>
                    <p className="text-gray-400 text-sm">
                        Crea tu contraseña privada. Recuerda usar letras, al menos un número y un símbolo (@$!%*?.&-) para mayor seguridad.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Nueva Contraseña</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors pr-12"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                            >
                                {showPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                            </button>
                        </div>

                        <div className="mt-3 space-y-1">
                            <p className="text-xs text-gray-400 mb-2 font-semibold">Requisitos de la contraseña:</p>
                            {requirements.map(req => {
                                const isMet = req.test(password);
                                return (
                                    <div key={req.id} className={`flex items-center gap-2 text-xs ${isMet ? 'text-emerald-400' : 'text-gray-500'}`}>
                                        {isMet ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                                        <span>{req.text}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Confirmar Contraseña</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors pr-12"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                            >
                                {showConfirmPassword ? <HiEyeOff size={20} /> : <HiEye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 px-4 rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? 'Activando...' : 'Activar Cuenta'}
                    </button>
                </form>
            </div>
        </div>
    );
};
