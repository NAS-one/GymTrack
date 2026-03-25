import { useState, useEffect, useRef } from 'react';
import axios from '../api/axios';
import { ScanBarcode, CheckCircle, XCircle, Calendar, User, Briefcase, Dumbbell } from 'lucide-react';

export function Acceso() {
  const [input, setInput] = useState('');
  const [lastAccess, setLastAccess] = useState(null); // null, success, denied, not_found
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  // Auto-focus para lector de códigos
  useEffect(() => {
    const focusInterval = setInterval(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 2000);
    return () => clearInterval(focusInterval);
  }, []);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setLastAccess(null);

    try {
      const res = await axios.post('/acceso', { identificador: input });

      const accessData = res.data.body || res.data; // Soporte body wrapper

      if (res.data.error || accessData.estado_acceso === 'denegado') {
        setLastAccess({ type: 'denied', data: accessData });
        playAudio('error');
      } else {
        setLastAccess({ type: 'success', data: accessData });
        playAudio('success');
      }

    } catch (error) {
      console.error(error);
      setLastAccess({
        type: 'not_found',
        data: { nombre: 'Desconocido', mensaje: 'RUT o ID no registrado', tipo: 'error' }
      });
      playAudio('error');
    } finally {
      setLoading(false);
      setInput('');
      setTimeout(() => setLastAccess(null), 4000); // Reset a los 4s
    }
  };

  const playAudio = (type) => {
    // Implementación futura de sonidos
    // const audio = new Audio(type === 'success' ? '/ok.mp3' : '/error.mp3');
    // audio.play().catch(e => console.log('Audio error:', e));
  };

  // Helper para mostrar rol
  const getRoleBadge = (type) => {
    if (type === 'staff') return <span className="flex items-center gap-1 text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded text-xs font-bold uppercase border border-purple-500/20"><Briefcase size={12} /> Staff</span>;
    if (type === 'entrenador') return <span className="flex items-center gap-1 text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded text-xs font-bold uppercase border border-orange-500/20"><Dumbbell size={12} /> Coach</span>;
    return <span className="flex items-center gap-1 text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded text-xs font-bold uppercase border border-blue-500/20"><User size={12} /> Cliente</span>;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] animate-fade-in pb-10">

      {/* HEADER */}
      <div className="mb-8 text-center pt-10">
        <h2 className="text-4xl font-black text-white mb-2 tracking-tight">TERMINAL DE ACCESO</h2>
        <p className="text-gym-gray text-lg">Acerque su código QR o ingrese su RUT</p>
      </div>

      {/* INPUT AREA */}
      <div className="max-w-md mx-auto w-full mb-10 relative z-50">
        <form onSubmit={handleScan} className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-gym-orange to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Esperando lectura..."
            className="relative w-full bg-gym-dark border-2 border-white/10 rounded-2xl py-5 pl-12 pr-4 text-2xl text-center text-white focus:border-gym-orange focus:outline-none transition-all shadow-2xl font-mono uppercase"
            autoFocus
            disabled={loading}
          />
          <ScanBarcode className="absolute left-5 top-1/2 -translate-y-1/2 text-gym-gray group-hover:text-white transition-colors" size={32} />
        </form>
      </div>

      {/* RESULT AREA */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-[300px]">

        {/* ESTADO 1: ESPERANDO */}
        {!lastAccess && !loading && (
          <div className="text-center opacity-20 animate-pulse flex flex-col items-center">
            <ScanBarcode size={140} className="mb-6" />
            <h3 className="text-3xl font-bold uppercase tracking-widest">Listo</h3>
          </div>
        )}

        {/* ESTADO 2: CARGANDO */}
        {loading && (
          <div className="flex flex-col items-center animate-bounce">
            <div className="w-16 h-16 border-4 border-gym-orange border-t-transparent rounded-full animate-spin mb-4"></div>
            <span className="text-xl font-bold text-gym-orange">Verificando...</span>
          </div>
        )}

        {/* ESTADO 3: RESULTADO */}
        {lastAccess && (
          <div className={`w-full max-w-xl p-8 rounded-3xl border-4 shadow-[0_0_50px_rgba(0,0,0,0.5)] transform transition-all scale-100 flex flex-col items-center text-center gap-6 ${lastAccess.type === 'success'
              ? 'bg-green-900/20 border-green-500 shadow-green-500/10'
              : 'bg-red-900/20 border-red-500 shadow-red-500/10'
            }`}>

            {/* ICONO GIGANTE */}
            <div className={`p-6 rounded-full border-4 shadow-lg ${lastAccess.type === 'success' ? 'bg-green-500 text-white border-green-400' : 'bg-red-500 text-white border-red-400'
              }`}>
              {lastAccess.type === 'success' ? <CheckCircle size={80} strokeWidth={3} /> : <XCircle size={80} strokeWidth={3} />}
            </div>

            {/* TEXTOS */}
            <div className="space-y-2">
              <h2 className={`text-5xl font-black uppercase tracking-tighter ${lastAccess.type === 'success' ? 'text-green-400' : 'text-red-500'
                }`}>
                {lastAccess.type === 'success' ? 'AUTORIZADO' : 'DENEGADO'}
              </h2>

              <div className="flex flex-col items-center gap-1">
                <p className="text-3xl text-white font-bold leading-tight">{lastAccess.data.nombre}</p>
                {lastAccess.data.tipo && getRoleBadge(lastAccess.data.tipo)}
              </div>
            </div>

            {/* DETALLES DINÁMICOS */}
            {lastAccess.type !== 'not_found' && (
              <div className="w-full bg-black/40 rounded-xl border border-white/5 p-4 mt-2">
                {/* Si es CLIENTE mostramos plan */}
                {lastAccess.data.tipo === 'cliente' && lastAccess.data.nombre_plan && (
                  <div className="mb-3 pb-3 border-b border-white/10 flex justify-between items-center">
                    <span className="text-gym-gray text-sm uppercase font-bold">Plan</span>
                    <span className="text-white font-bold">{lastAccess.data.nombre_plan}</span>
                  </div>
                )}

                {/* Mensaje de Estado (Para todos) */}
                <div className="flex justify-between items-center">
                  <span className="text-gym-gray text-sm uppercase font-bold">Estado</span>
                  <span className={`font-bold ${lastAccess.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {lastAccess.data.mensaje}
                  </span>
                </div>

                {/* Fecha Fin (Solo Clientes) */}
                {lastAccess.data.fecha_fin && (
                  <div className="mt-3 pt-3 border-t border-white/10 text-xs text-zinc-500 flex justify-center gap-2">
                    <Calendar size={12} /> Vencimiento: {new Date(lastAccess.data.fecha_fin).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}