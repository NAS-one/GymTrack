import { useState } from 'react';
import { X, Bell, CheckCircle, AlertTriangle, Info, User, Landmark, ShieldAlert, Archive, CheckCheck } from 'lucide-react';

export function AdminNotificationsPanel({ isOpen, onClose, notifications = [], markAsRead }) {
    // 🌟 ESTADO PARA LAS PESTAÑAS ENTERPRISE
    const [activeTab, setActiveTab] = useState('unread'); // 'unread' | 'all'

    if (!isOpen) return null;

    const validNotifications = Array.isArray(notifications) ? notifications : [];

    // 🌟 SOLUCIÓN 1: Cálculo REAL de notificaciones sin leer
    const unreadNotifications = validNotifications.filter(n => !n.leida);
    const unreadCount = unreadNotifications.length;

    // Filtramos lo que vamos a mostrar según la pestaña activa
    const displayNotifications = activeTab === 'unread' ? unreadNotifications : validNotifications;

    return (
        <div className="fixed inset-0 z-[60] flex justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="w-full max-w-sm bg-[#0c0c0e] border-l border-white/10 h-full relative z-10 shadow-[-20px_0_50px_rgba(0,0,0,0.8)] flex flex-col animate-in slide-in-from-right duration-300">

                {/* Header Enterprise */}
                <div className="p-6 border-b border-white/5 bg-black/40 shrink-0">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                                <Bell size={18} className={unreadCount > 0 ? "text-gym-orange animate-pulse" : "text-zinc-500"} />
                                Centro de Alertas
                            </h2>
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                                {unreadCount} {unreadCount === 1 ? 'alerta' : 'alertas'} sin leer
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white bg-white/5 rounded-full transition-colors">
                            <X size={16} />
                        </button>
                    </div>

                    {/* 🌟 PESTAÑAS (TABS) */}
                    <div className="flex bg-white/5 rounded-lg p-1">
                        <button
                            onClick={() => setActiveTab('unread')}
                            className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all ${activeTab === 'unread' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Nuevas
                        </button>
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-all ${activeTab === 'all' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                        >
                            Historial
                        </button>
                    </div>
                </div>

                {/* Lista de Notificaciones */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                    {displayNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-zinc-500 opacity-60">
                            {activeTab === 'unread' ? <CheckCheck size={48} className="mb-4 text-emerald-500/50" /> : <Archive size={48} className="mb-4" />}
                            <p className="text-sm font-bold">{activeTab === 'unread' ? '¡Todo al día!' : 'Bandeja vacía'}</p>
                            <p className="text-xs text-center mt-1">No tienes {activeTab === 'unread' ? 'alertas pendientes' : 'registros en tu historial'}.</p>
                        </div>
                    ) : (
                        displayNotifications.map((notif, index) => {
                            let icon, color;
                            switch (notif.type) {
                                case 'ingreso_exitoso':
                                    icon = <CheckCircle size={16} />; color = 'emerald'; break;
                                case 'ingreso_denegado':
                                    icon = <AlertTriangle size={16} />; color = 'rose'; break;
                                case 'pago_recibido':
                                    icon = <Landmark size={16} />; color = 'blue'; break;
                                case 'alerta_sistema':
                                    icon = <ShieldAlert size={16} />; color = 'orange'; break;
                                default:
                                    icon = <Info size={16} />; color = 'blue';
                            }

                            const timeString = new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                            return (
                                <NotificationCard
                                    key={notif.id || index}
                                    icon={icon}
                                    title={notif.title}
                                    desc={notif.message}
                                    time={timeString}
                                    unread={!notif.leida} // 🌟 SOLUCIÓN 2: Lee el estado real
                                    color={color}
                                />
                            );
                        })
                    )}
                </div>

                {/* Footer Enterprise con acciones */}
                <div className="p-4 border-t border-white/5 bg-black/40 shrink-0 flex flex-col gap-2">
                    {unreadCount > 0 && (
                        <button
                            onClick={markAsRead}
                            className="w-full py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <CheckCheck size={14} /> Marcar todas como leídas
                        </button>
                    )}
                    <button className="w-full py-2 text-zinc-500 hover:text-white text-xs font-bold transition-colors underline decoration-transparent hover:decoration-white underline-offset-4">
                        Abrir Auditoría Completa (Próximamente)
                    </button>
                </div>
            </div>
        </div>
    );
}

// Microcomponente Interno Ajustado
function NotificationCard({ icon, title, desc, time, color, unread }) {
    const colors = {
        emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20'
    };

    return (
        <div className={`p-4 rounded-2xl border transition-colors cursor-pointer group flex gap-4 relative overflow-hidden ${unread ? 'bg-white/[0.05] border-white/15 shadow-lg' : 'bg-transparent border-white/5 opacity-60 hover:opacity-100'}`}>
            {unread && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gym-orange shadow-[0_0_10px_rgba(249,115,22,1)]"></div>}

            <div className={`p-2.5 rounded-xl border h-fit shrink-0 shadow-inner ${colors[color]}`}>
                {icon}
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-start gap-2">
                    <p className={`text-sm font-bold tracking-tight transition-colors ${unread ? 'text-white' : 'text-zinc-400'}`}>{title}</p>
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-wider whitespace-nowrap">{time}</span>
                </div>
                <p className="text-xs text-zinc-400 mt-1 leading-snug">{desc}</p>
            </div>
        </div>
    );
}