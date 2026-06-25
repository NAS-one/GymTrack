import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom'; // 1. Hook de URL
import axios from '../../api/axios';
import { Plus, Search, Edit, Trash2, Box, CheckCircle, AlertTriangle, XCircle, Wrench, Filter } from 'lucide-react';
import { MachineModal } from '../../components/admin/Inventario/MachineModal';
import { toast } from 'sonner';
import { useConfirm } from '../../contexts/ConfirmContext';

export function Inventario() {
  const confirm = useConfirm();
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // --- FILTROS INTELIGENTES ---
  const [searchParams, setSearchParams] = useSearchParams();
  const [filterState, setFilterState] = useState('all'); // 'all', 'issues', 'operativa'

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);

  // 1. LEER URL AL INICIAR
  useEffect(() => {
    const statusParam = searchParams.get('status'); // puede ser 'issues'
    if (statusParam) setFilterState(statusParam);

    fetchMachines();
  }, [searchParams]);

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/inventario');
      setMachines(res.data.body || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Actualizar filtro y URL
  const handleFilterChange = (newState) => {
    setFilterState(newState);
    if (newState !== 'all') setSearchParams({ status: newState });
    else setSearchParams({});
  };

  const handleSave = async (data) => {
    try {
      if (selectedMachine) await axios.patch(`/inventario/${selectedMachine.id}`, data);
      else await axios.post('/inventario', data);
      setIsModalOpen(false);
      fetchMachines();
      toast.success(selectedMachine ? 'Máquina actualizada' : 'Máquina registrada', {
        description: `"${data.nombre}" fue guardada correctamente.`
      });
    } catch (e) {
      console.error(e);
      const mensajeError = e.response?.data?.error
        || (Array.isArray(e.response?.data) ? e.response.data[0]?.message : null)
        || 'Error al guardar el equipo. Intenta nuevamente.';
      toast.error('Error al guardar equipo', { description: mensajeError });
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: '¿Eliminar máquina?',
      description: 'Esta acción no se puede deshacer.',
      confirmText: 'Sí, eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    });
    if (!isConfirmed) return;
    try {
      await axios.delete(`/inventario/${id}`);
      fetchMachines();
      toast.success('Máquina eliminada correctamente');
    } catch (e) {
      const mensajeError = e.response?.data?.error || 'Error al eliminar el equipo.';
      toast.error('Error', { description: mensajeError });
    }
  };

  const changeStatus = async (machine, newStatus) => {
    try {
      await axios.patch(`/inventario/${machine.id}`, { estado: newStatus });
      setMachines(prev => prev.map(m => m.id === machine.id ? { ...m, estado: newStatus } : m));
    } catch (e) {
      const mensajeError = e.response?.data?.error || 'No se pudo cambiar el estado del equipo.';
      toast.error('Error', { description: mensajeError });
    }
  };

  // --- LÓGICA DE FILTRADO ---
  const filtered = machines.filter(m => {
    const matchesSearch = m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || m.codigo_serie.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro por Tab
    let matchesStatus = true;
    if (filterState === 'issues') matchesStatus = m.estado !== 'operativa'; // Todo lo que no sirve
    else if (filterState !== 'all') matchesStatus = m.estado === filterState;

    return matchesSearch && matchesStatus;
  });

  const statusConfig = {
    operativa: { color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: <CheckCircle size={16} />, label: 'Operativa' },
    en_mantencion: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: <Wrench size={16} />, label: 'Mantención' },
    fuera_servicio: { color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: <XCircle size={16} />, label: 'Dañada' },
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Inventario de Máquinas</h2>
          <p className="text-gym-gray text-sm">Gestiona el estado operativo de tus equipos.</p>
        </div>
        <button onClick={() => { setSelectedMachine(null); setIsModalOpen(true); }} className="bg-gym-orange hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg transition-all">
          <Plus size={20} /> Añadir Equipo
        </button>
      </div>

      {/* BARRA DE FILTROS (TABS) */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-gym-card p-2 rounded-xl border border-white/5">

        {/* Tabs de Estado */}
        <div className="flex bg-black/20 p-1 rounded-lg">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'operativa', label: 'Operativas' },
            { id: 'issues', label: 'Con Problemas', icon: <AlertTriangle size={14} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleFilterChange(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${filterState === tab.id
                ? 'bg-gym-orange text-white shadow-md'
                : 'text-gym-gray hover:text-white hover:bg-white/5'
                }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gym-gray" />
          <input
            type="text"
            placeholder="Buscar máquina..."
            className="w-full bg-transparent pl-10 pr-4 py-2 text-white focus:outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* GRID */}
      {loading ? (
        <div className="text-center py-12 text-gym-gray">Cargando inventario...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-zinc-500 border-2 border-dashed border-white/5 rounded-2xl">No se encontraron máquinas con este filtro.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((machine) => {
            const status = statusConfig[machine.estado] || statusConfig.operativa;
            return (
              <div key={machine.id} className={`bg-gym-card border ${status.border} rounded-2xl p-5 relative group hover:-translate-y-1 transition-all shadow-lg`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-gym-gray">
                      <Box size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white leading-tight">{machine.nombre}</h3>
                      <p className="text-xs text-zinc-500">{machine.marca}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase flex items-center gap-1 ${status.color} ${status.bg}`}>
                    {status.icon} {status.label}
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between text-xs">
                    <span className="text-gym-gray">N° Serie:</span>
                    <span className="text-white font-mono">{machine.codigo_serie}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gym-gray">Adquirida:</span>
                    <span className="text-white">{new Date(machine.fecha_adquisicion).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex gap-2 justify-between items-center opacity-100 lg:opacity-40 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    <button onClick={() => changeStatus(machine, 'operativa')} title="Operativa" className={`p-1.5 rounded-lg transition-colors ${machine.estado === 'operativa' ? 'bg-green-500 text-black' : 'hover:bg-green-500/20 text-green-500'}`}><CheckCircle size={16} /></button>
                    <button onClick={() => changeStatus(machine, 'en_mantencion')} title="Mantención" className={`p-1.5 rounded-lg transition-colors ${machine.estado === 'en_mantencion' ? 'bg-yellow-500 text-black' : 'hover:bg-yellow-500/20 text-yellow-500'}`}><Wrench size={16} /></button>
                    <button onClick={() => changeStatus(machine, 'fuera_servicio')} title="Dañada" className={`p-1.5 rounded-lg transition-colors ${machine.estado === 'fuera_servicio' ? 'bg-red-500 text-black' : 'hover:bg-red-500/20 text-red-500'}`}><AlertTriangle size={16} /></button>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setSelectedMachine(machine); setIsModalOpen(true); }} className="p-1.5 text-gym-gray hover:text-white hover:bg-white/10 rounded-lg"><Edit size={16} /></button>
                    <button onClick={() => handleDelete(machine.id)} className="p-1.5 text-gym-gray hover:text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <MachineModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} machine={selectedMachine} onSave={handleSave} />
    </div>
  );
}