import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/useAuth';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import { toast } from 'sonner';
import { useConfirm } from '../../contexts/ConfirmContext';
import {
    CreditCard, ArrowLeft, CheckCircle, Loader2,
    ShieldCheck, Clock, Zap, ChevronRight
} from 'lucide-react';

export const PagoRenovacion = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const confirm = useConfirm();

    const [planes, setPlanes] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [step, setStep] = useState(1); // 1=seleccionar plan, 2=resumen+pago, 3=confirmación
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [metodoPago, setMetodoPago] = useState('efectivo');

    // Info del cliente (para obtener id de la tabla clientes)
    const [clienteId, setClienteId] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [planesRes, perfilRes] = await Promise.all([
                    axios.get('/planes'),
                    axios.get(`/clientes/${user.id}/stats?t=${Date.now()}`)
                ]);

                let planesData = planesRes.data.body || planesRes.data;
                if (planesData?.body) planesData = planesData.body;
                setPlanes(Array.isArray(planesData) ? planesData.filter(p => p.estado !== 'archived') : []);

                let perfilData = perfilRes.data.body || perfilRes.data;
                if (perfilData?.body) perfilData = perfilData.body;
                setClienteId(perfilData?.infoPersonal?.id_cliente || perfilData?.infoPersonal?.id || null);
            } catch (err) {
                console.error('Error al cargar datos:', err);
                toast.error('Error al cargar los planes disponibles');
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [user?.id]);

    const handleConfirmarPago = async () => {
        if (!selectedPlan || !clienteId) return;

        const ok = await confirm({
            title: '¿Confirmar Pago?',
            description: `Vas a renovar tu membresía con el plan "${selectedPlan.nombre}" por $${Number(selectedPlan.precio).toLocaleString()}. ¿Continuar?`,
            confirmText: 'Sí, confirmar pago',
            cancelText: 'Cancelar',
            type: 'warning',
        });
        if (!ok) return;

        setIsProcessing(true);
        try {
            await axios.post('/pagos/renovar', {
                id_cliente: clienteId,
                id_plan: selectedPlan.id,
                monto: selectedPlan.precio,
                metodo_pago: metodoPago,
                meses_duracion: selectedPlan.duracion_meses || 1
            });
            setStep(3);
            toast.success('¡Pago procesado exitosamente!');
        } catch (err) {
            const msg = err.response?.data?.error || 'Error al procesar el pago';
            toast.error('Error en el pago', { description: msg });
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gym-orange"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-12 max-w-2xl mx-auto">

            {/* ── HEADER ── */}
            <div className="flex items-center gap-4 mt-2">
                <button
                    onClick={() => step > 1 ? setStep(step - 1) : navigate('/client/perfil')}
                    className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-zinc-400 hover:text-white"
                >
                    <ArrowLeft size={18} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                        {step === 3 ? '¡Pago Exitoso!' : 'Renovar Membresía'}
                    </h1>
                    <p className="text-gray-400 text-sm">
                        {step === 1 && 'Selecciona el plan que deseas adquirir'}
                        {step === 2 && 'Revisa el resumen y confirma tu pago'}
                        {step === 3 && 'Tu membresía ha sido renovada'}
                    </p>
                </div>
            </div>

            {/* ── INDICADOR DE PROGRESO ── */}
            <div className="flex items-center gap-2 px-2">
                {[1, 2, 3].map(s => (
                    <React.Fragment key={s}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${
                            s <= step
                                ? 'bg-gym-orange border-gym-orange text-white shadow-[0_0_15px_rgba(249,115,22,0.3)]'
                                : 'bg-zinc-900 border-zinc-700 text-zinc-600'
                        }`}>
                            {s < step ? <CheckCircle size={16} /> : s}
                        </div>
                        {s < 3 && (
                            <div className={`flex-1 h-0.5 rounded transition-colors ${s < step ? 'bg-gym-orange' : 'bg-zinc-800'}`} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* ══════════════════════════════════
                PASO 1: SELECCIONAR PLAN
            ══════════════════════════════════ */}
            {step === 1 && (
                <div className="space-y-3">
                    {planes.length === 0 ? (
                        <div className="bg-zinc-900 border border-white/5 rounded-2xl p-10 text-center">
                            <CreditCard size={40} className="text-zinc-700 mx-auto mb-3" />
                            <p className="text-zinc-400 font-medium">No hay planes disponibles en este momento.</p>
                        </div>
                    ) : (
                        planes.map(plan => {
                            const isSelected = selectedPlan?.id === plan.id;
                            return (
                                <button
                                    key={plan.id}
                                    onClick={() => setSelectedPlan(plan)}
                                    className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${
                                        isSelected
                                            ? 'border-gym-orange bg-orange-500/10 ring-1 ring-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.1)]'
                                            : 'border-white/5 bg-zinc-900 hover:border-white/15 hover:bg-zinc-900/80'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                                                isSelected ? 'bg-gym-orange text-white' : 'bg-white/5 text-zinc-400'
                                            }`}>
                                                <Zap size={22} />
                                            </div>
                                            <div>
                                                <h3 className={`font-bold text-lg ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                                                    {plan.nombre}
                                                </h3>
                                                <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                                                    <Clock size={11} /> {plan.duracion_meses} {plan.duracion_meses === 1 ? 'Mes' : 'Meses'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-2xl font-black ${isSelected ? 'text-gym-orange' : 'text-zinc-400'}`}>
                                                ${Number(plan.precio).toLocaleString()}
                                            </p>
                                            <p className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold">CLP</p>
                                        </div>
                                    </div>
                                    {plan.descripcion && (
                                        <p className="text-xs text-zinc-500 mt-3 pl-16">{plan.descripcion}</p>
                                    )}
                                </button>
                            );
                        })
                    )}

                    {selectedPlan && (
                        <button
                            onClick={() => setStep(2)}
                            className="w-full mt-4 py-4 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold text-sm rounded-2xl hover:from-orange-500 hover:to-orange-400 transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                            Continuar con {selectedPlan.nombre}
                            <ChevronRight size={18} />
                        </button>
                    )}
                </div>
            )}

            {/* ══════════════════════════════════
                PASO 2: RESUMEN + MÉTODO DE PAGO
            ══════════════════════════════════ */}
            {step === 2 && selectedPlan && (
                <div className="space-y-4">
                    {/* Resumen del plan */}
                    <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-white/5 bg-orange-500/5">
                            <p className="text-xs text-gym-orange font-bold uppercase tracking-widest">Resumen de tu compra</p>
                        </div>
                        <div className="p-5 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-zinc-400">Plan</span>
                                <span className="text-white font-bold">{selectedPlan.nombre}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-zinc-400">Duración</span>
                                <span className="text-white">{selectedPlan.duracion_meses} {selectedPlan.duracion_meses === 1 ? 'Mes' : 'Meses'}</span>
                            </div>
                            <div className="border-t border-white/5 pt-3 flex justify-between items-center">
                                <span className="text-sm font-bold text-white">Total a Pagar</span>
                                <span className="text-2xl font-black text-gym-orange">${Number(selectedPlan.precio).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Método de pago */}
                    <div className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden">
                        <div className="p-4 border-b border-white/5">
                            <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Método de Pago</p>
                        </div>
                        <div className="p-4 space-y-2">
                            {[
                                { value: 'efectivo', label: 'Efectivo', desc: 'Paga en recepción del gimnasio' },
                                { value: 'transferencia', label: 'Transferencia', desc: 'Transferencia bancaria directa' },
                                { value: 'debito', label: 'Tarjeta de Débito', desc: 'Redbanc / Débito' },
                                { value: 'credito', label: 'Tarjeta de Crédito', desc: 'Visa / Mastercard' },
                            ].map(m => (
                                <button
                                    key={m.value}
                                    type="button"
                                    onClick={() => setMetodoPago(m.value)}
                                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
                                        metodoPago === m.value
                                            ? 'bg-orange-500/10 border-gym-orange ring-1 ring-orange-500/30'
                                            : 'bg-black/30 border-white/8 hover:border-white/20'
                                    }`}
                                >
                                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                        metodoPago === m.value ? 'border-gym-orange' : 'border-zinc-600'
                                    }`}>
                                        {metodoPago === m.value && <div className="w-2 h-2 rounded-full bg-gym-orange" />}
                                    </div>
                                    <div>
                                        <p className={`text-sm font-bold ${metodoPago === m.value ? 'text-white' : 'text-zinc-400'}`}>{m.label}</p>
                                        <p className="text-[10px] text-zinc-600">{m.desc}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Aviso legal */}
                    <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl px-4 py-3 text-xs text-emerald-400/80 flex items-start gap-2">
                        <ShieldCheck size={16} className="shrink-0 mt-0.5" />
                        <span>Al confirmar, se creará tu membresía activa inmediatamente. Este es un pago simulado con fines de demostración.</span>
                    </div>

                    {/* Botón de pago */}
                    <button
                        onClick={handleConfirmarPago}
                        disabled={isProcessing}
                        className="w-full py-4 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold text-sm rounded-2xl hover:from-orange-500 hover:to-orange-400 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                        {isProcessing
                            ? <><Loader2 size={18} className="animate-spin" /> Procesando pago...</>
                            : <><CreditCard size={18} /> Confirmar Pago — ${Number(selectedPlan.precio).toLocaleString()}</>
                        }
                    </button>
                </div>
            )}

            {/* ══════════════════════════════════
                PASO 3: CONFIRMACIÓN EXITOSA
            ══════════════════════════════════ */}
            {step === 3 && (
                <div className="bg-zinc-900 border border-white/5 rounded-2xl p-8 text-center space-y-5">
                    <div className="w-20 h-20 mx-auto bg-emerald-500/10 border-2 border-emerald-500/30 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                        <CheckCircle size={40} className="text-emerald-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white mb-2">¡Pago Exitoso!</h2>
                        <p className="text-zinc-400 text-sm">
                            Tu membresía con el plan <span className="text-gym-orange font-bold">{selectedPlan?.nombre}</span> ha sido activada correctamente.
                        </p>
                    </div>
                    <div className="bg-black/30 border border-white/5 rounded-xl p-4 space-y-2 text-left max-w-sm mx-auto">
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Plan</span>
                            <span className="text-white font-bold">{selectedPlan?.nombre}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Monto</span>
                            <span className="text-gym-orange font-bold">${Number(selectedPlan?.precio).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-500">Método</span>
                            <span className="text-white capitalize">{metodoPago}</span>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/client/dashboard')}
                        className="w-full max-w-sm mx-auto py-3.5 bg-white/5 border border-white/10 text-white font-bold text-sm rounded-xl hover:bg-white/10 transition-colors"
                    >
                        Volver al Panel
                    </button>
                </div>
            )}
        </div>
    );
};
