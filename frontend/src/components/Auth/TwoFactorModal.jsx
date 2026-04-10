import { useState, useRef, useEffect } from 'react';
import { Mail, ArrowRight, ShieldCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import axios from '../../api/axios';

export function TwoFactorModal({ isOpen, onClose, data, onComplete }) {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const inputRefs = useRef([]);

    // Auto-focus en el primer input al abrir
    useEffect(() => {
        if (isOpen && inputRefs.current[0]) {
            setTimeout(() => inputRefs.current[0].focus(), 100);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Manejo de la escritura en las casillas
    const handleChange = (index, value) => {
        // Solo permitir números
        if (!/^[0-9]*$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        // Auto-avanzar a la siguiente casilla si se escribió un número
        if (value && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    // Manejo de la tecla borrar (Backspace) para retroceder
    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    // Manejo de Pegar (Paste) un código de 6 dígitos completo
    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6).replace(/[^0-9]/g, '');
        if (pastedData) {
            const newCode = [...code];
            for (let i = 0; i < pastedData.length; i++) {
                newCode[i] = pastedData[i];
            }
            setCode(newCode);
            // Enfocar el último input rellenado
            const lastIndex = pastedData.length - 1;
            if (lastIndex < 5) inputRefs.current[lastIndex + 1].focus();
            else inputRefs.current[5].focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const fullCode = code.join('');

        if (fullCode.length < 6) {
            return toast.error("Ingresa el código completo de 6 dígitos.");
        }

        setLoading(true);
        try {
            const response = await axios.post('/auth/verify-2fa', {
                userId: data.userId,
                code: fullCode
            });

            toast.success("Verificación Exitosa", { description: "Dispositivo registrado como seguro." });

            // Pasamos el usuario y el token de vuelta al Login
            onComplete(response.data.body);

        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.error || "Código incorrecto o expirado");
            // Limpiamos las casillas en caso de error
            setCode(['', '', '', '', '', '']);
            inputRefs.current[0].focus();
        } finally {
            setLoading(false);
        }
    };

    // Función para ofuscar el correo (ej: j****@gmail.com)
    const obfuscateEmail = (email) => {
        if (!email) return '';
        const [name, domain] = email.split('@');
        return `${name.charAt(0)}****@${domain}`;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md"></div>

            <div className="w-full max-w-md bg-[#0c0c0e] border border-blue-500/20 rounded-3xl relative z-10 shadow-[0_0_100px_rgba(59,130,246,0.15)] overflow-hidden animate-in zoom-in-95 duration-300">

                {/* Botón de cerrar/cancelar */}
                <button onClick={onClose} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors">
                    <X size={20} />
                </button>

                {/* Cabecera */}
                <div className="p-8 text-center border-b border-white/5 bg-blue-500/5 pt-12">
                    <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-500 shadow-inner">
                        <ShieldCheck size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight">Verificación de Seguridad</h2>
                    <p className="text-sm text-blue-400/80 mt-2 font-medium flex items-center justify-center gap-2">
                        <Mail size={14} /> Código enviado a {obfuscateEmail(data?.email)}
                    </p>
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="flex justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
                        {code.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => (inputRefs.current[index] = el)}
                                type="text"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-black text-white bg-black/40 border border-white/10 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-inner"
                            />
                        ))}
                    </div>

                    <button
                        disabled={loading || code.join('').length < 6} type="submit"
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl text-sm font-black tracking-wide shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? 'Verificando...' : 'Verificar y Entrar'} <ArrowRight size={18} />
                    </button>

                    <p className="text-xs text-center text-zinc-500 mt-4">
                        ¿No recibiste el código? <span className="text-blue-400 cursor-pointer hover:underline">Reenviar correo</span>
                    </p>
                </form>
            </div>
        </div>
    );
}