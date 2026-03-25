import { CheckCircle2, XCircle, User, Clock, ChevronRight, Activity } from 'lucide-react';

export function LiveFeed({ logs = [], onViewAll }) {
  
  // Helper para hora (ej: 14:30)
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-gym-card p-0 rounded-2xl border border-white/5 h-full flex flex-col overflow-hidden shadow-lg relative group">
      
      {/* Header con efecto Glass */}
      <div className="p-5 border-b border-white/5 bg-white/5 backdrop-blur-md flex justify-between items-center z-10">
        <h3 className="text-lg font-bold text-white flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          Acceso en Tiempo Real
        </h3>
        <button 
            onClick={onViewAll}
            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors hover:bg-white/10 px-2 py-1 rounded-lg"
        >
            Ver Historial <ChevronRight size={14}/>
        </button>
      </div>

      {/* Lista con Scroll Personalizado */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 relative">
        
        {logs.length > 0 ? (
            logs.map((log, i) => {
                const isApproved = log.estado_acceso === 'aprobado';
                return (
                    <div 
                        key={i} 
                        onClick={onViewAll} // O navegar al perfil del usuario
                        className={`
                            relative flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer group/item
                            hover:scale-[1.02] active:scale-[0.98] duration-200
                            ${isApproved 
                                ? 'bg-zinc-900/50 border-white/5 hover:border-green-500/30 hover:bg-green-500/5' 
                                : 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'
                            }
                        `}
                    >
                        {/* Avatar / Icono Estado */}
                        <div className="relative">
                            <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-inner
                                ${isApproved 
                                    ? 'bg-gradient-to-br from-zinc-700 to-black text-white' 
                                    : 'bg-red-500/20 text-red-200'
                                }
                            `}>
                                {log.nombre ? log.nombre.charAt(0).toUpperCase() : <User size={16}/>}
                            </div>
                            
                            {/* Badge de estado pequeño superpuesto */}
                            <div className={`absolute -bottom-1 -right-1 rounded-full p-0.5 border-2 border-[#18181b] ${isApproved ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}>
                                {isApproved ? <CheckCircle2 size={10}/> : <XCircle size={10}/>}
                            </div>
                        </div>

                        {/* Info Principal */}
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-0.5">
                                <p className={`text-sm font-bold truncate ${isApproved ? 'text-white' : 'text-red-200'}`}>
                                    {log.nombre || "Desconocido"}
                                </p>
                                <span className="text-xs font-mono text-zinc-500 flex items-center gap-1 bg-black/20 px-1.5 py-0.5 rounded">
                                    <Clock size={10}/> {formatTime(log.fecha_entrada)}
                                </span>
                            </div>
                            
                            <p className="text-xs text-zinc-400 flex items-center gap-2">
                                {isApproved ? (
                                    <span className="flex items-center gap-1 text-green-400/80">
                                        Acceso Autorizado
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1 text-red-400 font-medium">
                                        Acceso Denegado
                                    </span>
                                )}
                                <span className="text-zinc-700">•</span>
                                <span className="truncate opacity-70">Entrada Principal</span>
                            </p>
                        </div>
                    </div>
                );
            })
        ) : (
            // Empty State Profesional
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-3 min-h-[200px]">
                <div className="p-4 rounded-full bg-white/5 animate-pulse">
                    <Activity size={32} className="opacity-50"/>
                </div>
                <p className="text-sm font-medium">Esperando accesos...</p>
            </div>
        )}
      </div>
      
      {/* Footer Decorativo (Gradient Fade) */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#09090b] to-transparent pointer-events-none"></div>
    </div>
  );
}