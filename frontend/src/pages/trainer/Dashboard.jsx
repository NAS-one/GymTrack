import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from 'sonner';
import { QrCode, X, CheckCircle2, User } from 'lucide-react';
import axios from '../../api/axios';
import { useAuth } from '../../contexts/useAuth';

export const ClientDashboard = () => {
    const { user } = useAuth();
    const [isScanning, setIsScanning] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const scannerRef = useRef(null);

    // Stop scanner reliably
    const stopScanner = () => {
        if (scannerRef.current) {
            scannerRef.current.stop().then(() => {
                scannerRef.current.clear();
                scannerRef.current = null;
            }).catch(err => console.error("Error stopping scanner", err));
        }
        setIsScanning(false);
    };

    const onScanSuccess = async (decodedText) => {
        if (isProcessing) return; // Evitar escaneo múltiple

        // Parar el escáner al detectar
        stopScanner();
        setIsProcessing(true);

        try {
            // Intentar procesar JSON. Si es estricto, validar campos.
            let payload;
            try {
                payload = JSON.parse(decodedText);
            } catch (error) {
                console.error("Error parseando entrada QR:", error);
                throw new Error('Código QR no reconocible. Asegúrate de escanear el QR oficial del gimnasio.');
            }

            if (payload.action !== 'check_in' || !payload.gym_id) {
                throw new Error('Código QR no válido para ingreso.');
            }

            // Enviar el check-in al backend
            const response = await axios.post('/acceso/scan', {
                id_usuario: user.id, // ID del cliente logueado
                gym_id: payload.gym_id
            });

            // El backend decidirá si entra (plan activo) o no (plan vencido, sin membresía)
            if (response.data.body.estado_acceso === 'aprobado') {
                toast.success(`¡Acceso Aprobado! ${response.data.body.mensaje}`);
            } else {
                toast.error(`Acceso Denegado: ${response.data.body.mensaje}`);
            }
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.error || error.message || 'Error al procesar el código QR.';
            toast.error(msg);
        } finally {
            setIsProcessing(false);
        }
    };

    const startScanner = () => {
        setIsScanning(true);
    };

    useEffect(() => {
        if (isScanning && !scannerRef.current) {
            // Small delay to ensure the DOM element "reader" is painted
            setTimeout(() => {
                const html5QrCode = new Html5Qrcode("reader");
                scannerRef.current = html5QrCode;

                html5QrCode.start(
                    { facingMode: "environment" }, // Preferir cámara trasera
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0
                    },
                    onScanSuccess,
                    () => {
                        // Se ignora el error de "no detectado en este frame"
                    }
                ).catch((err) => {
                    console.error("Error iniciando cámara", err);
                    toast.error("No se pudo iniciar la cámara. Verifica los permisos e intenta desde tu IP segura o Localhost.");
                    setIsScanning(false);
                });
            }, 300);
        }

        return () => {
            if (scannerRef.current) {
                stopScanner();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isScanning]);

    return (
        <div className="p-6 max-w-md mx-auto space-y-6 animate-fade-in">
            <div className="text-center mt-4">
                <h1 className="text-2xl font-bold text-white mb-2">¡Hola, {user?.nombre || user?.username}!</h1>
                <p className="text-gray-400 text-sm">Bienvenido a GymTrack Client</p>
            </div>

            {/* Tarjeta de Acceso */}
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 text-center shadow-[0_0_20px_rgba(16,185,129,0.1)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -ml-16 -mb-16"></div>

                <button
                    onClick={startScanner}
                    disabled={isProcessing}
                    className="relative z-10 w-full bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95 flex flex-col items-center gap-3 disabled:opacity-50"
                >
                    <div className="bg-white/20 p-3 rounded-full">
                        <QrCode size={40} className="text-gray-900" />
                    </div>
                    <span className="text-lg uppercase tracking-wide">Escanear para Ingresar</span>
                </button>
            </div>

            {/* Estado de Membresía */}
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400">
                        <User size={20} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-white">Mi Perfil</p>
                        <p className="text-xs text-gray-400">Ver datos de acceso</p>
                    </div>
                </div>
                <CheckCircle2 size={20} className="text-emerald-500" />
            </div>

            {/* Scanner Overlay (Modal Fullscreen para Celulares) */}
            {isScanning && (
                <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-4 animate-fade-in">
                    <button
                        onClick={stopScanner}
                        className="absolute top-6 right-6 text-white/70 hover:text-white bg-gray-900/50 p-2 rounded-full backdrop-blur z-[60]"
                    >
                        <X size={28} />
                    </button>

                    <div className="text-center mb-8 relative z-10">
                        <h2 className="text-xl font-bold text-white mb-2">Escanea el QR de Recepción</h2>
                        <p className="text-gray-400 text-sm">Apunta tu cámara al código impreso en la entrada del gimnasio.</p>
                    </div>

                    <div id="reader" className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl bg-gray-900 border-2 border-emerald-500/30"></div>

                    {isProcessing && (
                        <div className="absolute inset-0 z-[60] bg-black/80 flex items-center justify-center backdrop-blur-sm">
                            <div className="text-center">
                                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                <p className="text-emerald-400 font-bold animate-pulse">Procesando Acceso...</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
