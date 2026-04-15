import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from 'sonner';
import { QrCode, ShieldCheck } from 'lucide-react';
import axios from '../../api/axios';
import { useAuth } from '../../contexts/useAuth';

export const Acceso = () => {
    const { user } = useAuth();
    const [isScanning, setIsScanning] = useState(true);
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
    };

    const startScanner = () => {
        setIsScanning(true);
    };

    const onScanSuccess = async (decodedText) => {
        if (isProcessing) return; // Evitar escaneo múltiple

        // Parar temporalmente el escáner al detectar
        stopScanner();
        setIsProcessing(true);

        try {
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

            // El backend decide si entra (plan activo) o no
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
            // Si quieres que el código requiera que el usuario limpie o reinicie, 
            // dejas isScanning en false o das un botón para re-intentar
            setIsScanning(false);
        }
    };

    useEffect(() => {
        let timer;
        if (isScanning && !scannerRef.current) {
            // Delay to allow DOM render
            timer = setTimeout(() => {
                const html5QrCode = new Html5Qrcode("reader");
                scannerRef.current = html5QrCode;

                html5QrCode.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0
                    },
                    onScanSuccess,
                    () => {}
                ).catch((err) => {
                    console.error("Error iniciando cámara", err);
                    toast.error("No se pudo iniciar la cámara. Verifica los permisos o usa protocolo seguro (HTTPS/Localhost).");
                    setIsScanning(false);
                });
            }, 300);
        }

        // Cleanup unificado para desmontaje seguro
        return () => {
            if (timer) clearTimeout(timer);
            // Si el componente se desmonta, intentar parar la cámara silenciosamente
            if (scannerRef.current) {
                try {
                    scannerRef.current.stop().catch(() => {});
                    scannerRef.current.clear();
                } catch (e) {
                    // Ignorar errores si el DOM ya se destruyó
                }
                scannerRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isScanning]);

    return (
        <div className="flex flex-col items-center animate-fade-in p-4 h-full">
            <div className="text-center w-full max-w-md mt-6 mb-8">
                <div className="flex justify-center mb-4 text-emerald-500">
                    <ShieldCheck size={48} />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Acceso VIP</h1>
                <p className="text-gray-400 text-sm">Escanea el código QR de recepción para registrar tu asistencia a GymTrack.</p>
            </div>

            <div className="relative w-full max-w-sm">
                {/* Bordes decorativos */}
                <div className="absolute -inset-1 blur bg-gradient-to-r from-emerald-500 to-green-400 rounded-3xl opacity-30"></div>
                
                <div className="relative bg-zinc-900 border border-emerald-500/30 rounded-3xl overflow-hidden shadow-2xl p-2 min-h-[300px] flex flex-col justify-center items-center">
                    {isScanning ? (
                        <>
                            <div id="reader" className="w-full rounded-2xl overflow-hidden"></div>
                            {isProcessing && (
                                <div className="absolute inset-0 z-20 bg-zinc-900/80 flex flex-col items-center justify-center backdrop-blur-sm">
                                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                    <p className="text-emerald-400 font-bold animate-pulse text-lg">Procesando...</p>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex flex-col items-center py-10">
                            <QrCode size={64} className="text-emerald-500/50 mb-4" />
                            <p className="text-gray-400 text-center mb-6 px-4">La cámara no está activa. Toca el botón para reanudar el escaneo.</p>
                            <button 
                                onClick={startScanner}
                                className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3 px-8 rounded-full shadow-lg transition-transform active:scale-95 flex items-center gap-2"
                            >
                                <QrCode size={20} />
                                Iniciar Escáner
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            {!isScanning && !isProcessing && (
                 <div className="mt-8 bg-zinc-800/80 rounded-2xl p-4 max-w-sm w-full text-center border border-zinc-700">
                    <p className="text-xs text-emerald-400 font-medium">¿Problemas con el escáner?</p>
                    <p className="text-xs text-gray-400 mt-1">Asegúrate de conceder permisos de cámara a tu navegador web.</p>
                 </div>
            )}
        </div>
    );
};
