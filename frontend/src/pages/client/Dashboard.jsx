import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/useAuth';
import { CreditCard, ChevronRight, Activity, CalendarDays, Flame, ShieldCheck, Dumbbell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';

export const ClientDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [planVigente, setPlanVigente] = useState(null);
    const [statsReales, setStatsReales] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user?.id) return;
            try {
                // 1. Fetch de membresías del cliente para plan vigente
                const resPlan = await axios.get(`/membresias/cliente/${user.id}`);
                const membresias = resPlan.data.body || [];
                const activa = membresias.find(m => m.estado === 'active' || m.estado === 'activa') || membresias[0];
                if (activa) {
                    setPlanVigente({
                        nombre: activa.plan_nombre || activa.tipo_plan || 'Plan GymTrack',
                        estado: activa.estado,
                        vencimiento: activa.fecha_fin,
                    });
                } else {
                    setPlanVigente({
                        nombre: 'Ningún plan activo',
                        estado: 'inactivo',
                        vencimiento: null
                    });
                }

                // 2. Fetch Stats Reales del Cliente
                const resStats = await axios.get(`/clientes/${user.id}/stats`);
                setStatsReales(resStats.data.body);

            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [user?.id]);

    const stats = [
        { label: 'Días Entrenados', valor: statsReales?.asistencia?.length || '0', icon: Activity, color: 'text-gym-orange' },
        { label: 'Historial Físico', valor: statsReales?.medidas?.length || '0', icon: Flame, color: 'text-red-500' },
        { label: 'Rutina Base', valor: statsReales?.rutinaActual?.length ? 'Activa' : 'Ninguna', icon: Dumbbell, color: 'text-emerald-500' }
    ];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gym-orange"></div>
            </div>
        );
    }

    const userNameDisplay = statsReales?.infoPersonal?.nombre || user?.nombre || user?.username;

    return (
        <div className="flex flex-col gap-6 animate-fade-in pb-12 h-full overflow-y-auto w-full px-2">

            {/* Título de Cabecera al estilo Trainer Dashboard */}
            <div className="mt-2 mb-4 text-left flex flex-col">
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 mb-2">
                    <Activity size={14} className="animate-pulse text-gym-orange" /> Sincronización en tiempo real
                </p>
                <h1 className="text-[3.5rem] md:text-[5rem] font-black italic text-white tracking-tighter leading-none mb-2">
                    Mi Panel <span className="text-gray-500">Personal</span>
                </h1>
                <p className="text-gray-400 text-[10px] mt-2 uppercase tracking-widest font-bold">RENDIMIENTO Y OBJETIVOS DE: <span className="text-white relative top-[-1px] ml-1">{userNameDisplay}</span></p>
            </div>

            {/* Quick Stats Integrados al estilo Glassmorphism */}
            <div className="grid grid-cols-3 gap-2">
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div key={i} className="bg-[#151515] hover:bg-[#1a1a1a] transition-colors border border-white/5 rounded-2xl p-4 flex flex-col items-start justify-center shadow-2xl relative overflow-hidden group">
                            <div className={`absolute -right-6 -top-6 w-20 h-20 opacity-10 group-hover:opacity-20 transition-opacity blur-2xl rounded-full ${stat.color === 'text-gym-orange' ? 'bg-gym-orange' : stat.color === 'text-red-500' ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                            <div className="flex items-center gap-2 mb-2">
                                <Icon size={16} className={`${stat.color}`} />
                                <span className="text-white font-black text-xl leading-none">{stat.valor}</span>
                            </div>
                            <span className="text-gray-500 text-[9px] font-bold uppercase tracking-wider">{stat.label}</span>
                        </div>
                    );
                })}
            </div>

            {/* Plan Vigente Aesthetic */}
            <div className="bg-[#121212] border border-white/5 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-emerald-500/10 to-transparent opacity-50"></div>
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl"></div>

                <div className="flex justify-between items-start mb-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <CreditCard size={20} className="text-emerald-400" />
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Membresía</span>
                        </div>
                        <h2 className="text-2xl font-black text-white italic tracking-tight">{planVigente?.nombre}</h2>
                    </div>
                    <div className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-3 py-1.5 rounded-full border border-emerald-500/20 uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                        {planVigente?.estado || 'Inactivo'}
                    </div>
                </div>

                <div className="flex justify-between items-end relative z-10">
                    <div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-1">Válido hasta</p>
                        <p className="font-semibold text-white/90 text-sm tracking-wide">{planVigente?.vencimiento ? new Date(planVigente.vencimiento).toLocaleDateString() : '--/--/----'}</p>
                    </div>

                    <button
                        onClick={() => navigate('/client/perfil')}
                        className="bg-white/5 hover:bg-white/10 active:bg-white/5 text-white text-xs font-bold py-2.5 px-6 rounded-xl border border-white/10 transition-all shadow-md flex items-center gap-2"
                    >
                        Gestionar <ChevronRight size={14} />
                    </button>
                </div>
            </div>

            {/* Acceso Rápido Scanner - Premium */}
            <button
                onClick={() => navigate('/client/acceso')}
                className="w-full bg-gradient-to-r from-gym-orange to-orange-500 hover:brightness-110 text-black font-black italic tracking-wide py-5 rounded-[2rem] shadow-[0_10px_30px_rgba(249,115,22,0.3)] transition-transform active:scale-[0.98] flex items-center justify-between px-6 group border border-orange-400/50"
            >
                <div className="flex items-center gap-4">
                    <div className="bg-black/20 p-2.5 rounded-2xl backdrop-blur-sm shadow-inner">
                        <ShieldCheck size={26} strokeWidth={2.5} />
                    </div>
                    <div className="text-left">
                        <span className="text-xl block leading-none mb-1">Generar Acceso QR</span>
                        <span className="text-[10px] font-bold text-black/60 uppercase tracking-widest not-italic">Entrada en tiempo real</span>
                    </div>
                </div>
                <div className="w-10 h-10 bg-black/10 rounded-full flex items-center justify-center group-hover:bg-black/20 transition-colors">
                    <ChevronRight size={20} strokeWidth={3} className="text-black/70" />
                </div>
            </button>
        </div>
    );
};
