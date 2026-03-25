import { useState, useEffect } from 'react';
import axios from '../../api/axios';
import { User, Phone, Clock, Briefcase, Moon, Sun, Sunset, Dumbbell, Monitor, Sparkles } from 'lucide-react';

export function StaffTimeline() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 1. CARGA DE DATOS (Autónoma)
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true);
        // Obtenemos lista completa de personal
        const [resTrainers, resStaff] = await Promise.all([
          axios.get('/entrenadores').catch(() => ({ data: { body: [] } })),
          axios.get('/staff').catch(() => ({ data: { body: [] } }))
        ]);

        // Normalización
        let trainers = resTrainers.data.body || resTrainers.data || [];
        if (trainers.body) trainers = trainers.body;

        let staff = resStaff.data.body || resStaff.data || [];
        if (staff.body) staff = staff.body;

        // Unificación y Mapeo
        const allStaff = [
          ...trainers.map(t => ({ ...t, cargo: 'Entrenador', type: 'coach' })),
          ...staff.map(s => ({ ...s, type: 'staff' }))
        ];

        setStaffList(allStaff);
      } catch (e) {
        console.error("Error cargando timeline:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();

    // Actualizar reloj cada minuto
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // 2. CONFIGURACIÓN DE TURNOS
  const shiftConfig = {
    'Mañana': { start: 6, end: 14, icon: <Sun size={12} />, color: 'from-orange-400 to-yellow-400' },
    'Tarde': { start: 14, end: 22, icon: <Sunset size={12} />, color: 'from-blue-500 to-indigo-500' },
    'Noche': { start: 18, end: 23, icon: <Moon size={12} />, color: 'from-indigo-600 to-purple-600' },
    'Full Time': { start: 8, end: 18, icon: <Briefcase size={12} />, color: 'from-emerald-500 to-teal-500' }
  };

  // 3. HELPER: Calcular Progreso
  const getShiftStatus = (turnoNombre) => {
    const config = shiftConfig[turnoNombre] || shiftConfig['Mañana']; // Fallback
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;

    const start = config.start;
    const end = config.end;
    const totalDuration = end - start;
    const elapsed = currentHour - start;

    let percent = 0;
    let status = 'future'; // future, active, completed

    if (elapsed < 0) {
      percent = 0;
      status = 'future';
    } else if (elapsed >= totalDuration) {
      percent = 100;
      status = 'completed';
    } else {
      percent = (elapsed / totalDuration) * 100;
      status = 'active';
    }

    return { percent, status, config };
  };

  // 4. HELPER: Icono según Cargo
  const getRoleIcon = (roleStr = "") => {
    const role = roleStr.toLowerCase();
    if (role.includes('entrenador')) return <Dumbbell size={14} className="text-gym-orange" />;
    if (role.includes('recep')) return <Monitor size={14} className="text-purple-400" />;
    if (role.includes('aseo')) return <Sparkles size={14} className="text-blue-400" />;
    return <User size={14} className="text-zinc-400" />;
  };

  // Ordenar: Activos -> Futuros -> Completados
  const sortedStaff = [...staffList].sort((a, b) => {
    const statA = getShiftStatus(a.turno).status;
    const statB = getShiftStatus(b.turno).status;
    const order = { 'active': 1, 'future': 2, 'completed': 3 };
    return order[statA] - order[statB];
  });

  return (
    <div className="bg-gym-card p-0 rounded-2xl border border-white/5 h-full flex flex-col overflow-hidden shadow-lg relative min-h-[350px]">

      {/* Header */}
      <div className="p-5 border-b border-white/5 bg-white/5 backdrop-blur-md flex justify-between items-center z-10 shrink-0">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock size={18} className="text-gym-orange" /> Turnos de Hoy
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5 font-mono">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {staffList.length} Personas
          </p>
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gym-orange"></div>
          </div>
        ) : sortedStaff.length > 0 ? (
          sortedStaff.map((member) => {
            const { percent, status, config } = getShiftStatus(member.turno);

            // Estilos dinámicos
            const isCompleted = status === 'completed';
            const isActive = status === 'active';
            const opacityClass = isCompleted ? 'opacity-40 grayscale' : isActive ? 'opacity-100' : 'opacity-60';

            return (
              <div key={member.id} className={`relative group ${opacityClass} transition-all duration-300`}>

                {/* Info Superior */}
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-bold text-zinc-300 shadow-inner">
                        {member.nombre.charAt(0)}
                      </div>
                      {/* Punto Estado */}
                      <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#18181b] 
                                    ${isActive ? 'bg-green-500 animate-pulse' : isCompleted ? 'bg-zinc-500' : 'bg-yellow-500'}
                                    `}></div>
                    </div>

                    <div>
                      <p className="text-sm font-bold text-white leading-none truncate max-w-[120px]">{member.nombre}</p>
                      <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
                        {getRoleIcon(member.cargo)} {member.cargo || "Staff"}
                      </p>
                    </div>
                  </div>

                  {/* WhatsApp (Hover) */}
                  {member.telefono && (
                    <button
                      onClick={() => window.open(`https://wa.me/${member.telefono}`, '_blank')}
                      className="p-2 rounded-full bg-green-500/10 text-green-500 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 hover:bg-green-500 hover:text-black"
                      title="Contactar"
                    >
                      <Phone size={14} />
                    </button>
                  )}
                </div>

                {/* Barra de Progreso */}
                <div className="relative h-1.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/5">
                  <div
                    className={`absolute top-0 left-0 h-full rounded-full bg-gradient-to-r ${config.color} transition-all duration-1000 ease-out`}
                    style={{ width: `${percent}%` }}
                  >
                    {isActive && <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 blur-[2px]"></div>}
                  </div>
                </div>

                {/* Etiquetas */}
                <div className="flex justify-between text-[9px] text-zinc-600 mt-1.5 font-mono font-medium uppercase tracking-wide">
                  <span className="flex items-center gap-1">{config.icon} {config.start}:00</span>
                  <span className={isActive ? "text-gym-orange font-bold" : ""}>
                    {isActive ? "En turno" : isCompleted ? "Finalizado" : "Próximamente"}
                  </span>
                  <span>{config.end}:00</span>
                </div>

              </div>
            );
          })
        ) : (
          <p className="text-center text-zinc-500 text-xs py-10">No hay personal asignado.</p>
        )}
      </div>
    </div>
  );
}