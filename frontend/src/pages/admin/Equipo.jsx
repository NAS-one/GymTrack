import { useEffect, useState } from 'react';
import axios from '../../api/axios';
import {
    Search, Plus, Users, Mail, Phone, Dumbbell,
    Edit, Trash2, Trophy, Eye, Briefcase, Sparkles,
    Monitor, Wrench, ShieldAlert
} from 'lucide-react';

// Importación de Modales
import { TrainerModal } from '../../components/admin/Entrenadores/TrainerModal';
import { TrainerDetailModal } from '../../components/admin/Entrenadores/TrainerDetailModal';
import { StaffModal } from '../../components/admin/Staff/StaffModal';
import { StaffDetailModal } from '../../components/admin/Staff/StaffDetailModal';

export function Equipo() {
    // --- ESTADOS ---
    const [activeTab, setActiveTab] = useState('entrenadores'); // 'entrenadores' | 'staff'
    const [trainers, setTrainers] = useState([]);
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Estados de Modales
    const [isTrainerModalOpen, setIsTrainerModalOpen] = useState(false);
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);


    // Selección para edición/visualización
    const [selectedPerson, setSelectedPerson] = useState(null);
    const [detailTrainerId, setDetailTrainerId] = useState(null);
    const [detailStaffId, setDetailStaffId] = useState(null);

    // --- EFECTOS ---
    useEffect(() => {
        fetchData();
    }, []);

    // --- PETICIONES A LA API---
    const fetchData = async () => {
        try {
            setLoading(true);
            const [resT, resS] = await Promise.all([
                axios.get('/entrenadores').catch(err => { console.error("Error Entrenadores:", err); return { data: [] }; }),
                axios.get('/staff').catch(err => { console.error("Error Staff:", err); return { data: [] }; })
            ]);

            // 1. Normalización de Entrenadores
            let rawTrainers = resT.data.body || resT.data || [];
            // Si viene anidado doble por error del backend
            if (rawTrainers.body) rawTrainers = rawTrainers.body;

            // 2. Normalización de Staff
            let rawStaff = resS.data.body || resS.data || [];
            if (rawStaff.body) rawStaff = rawStaff.body;

            // 3. Asignación Segura (Evita "filter is not a function")
            setTrainers(Array.isArray(rawTrainers) ? rawTrainers : []);
            setStaff(Array.isArray(rawStaff) ? rawStaff : []);

        } catch (error) {
            console.error("Error crítico cargando equipo:", error);
            setTrainers([]);
            setStaff([]);
        } finally {
            setLoading(false);
        }
    };

    // --- HANDLERS ---

    // Abrir modal de creación
    const handleOpenCreate = () => {
        setSelectedPerson(null); // Limpiamos selección
        if (activeTab === 'entrenadores') setIsTrainerModalOpen(true);
        else setIsStaffModalOpen(true);
    };

    // Abrir modal de edición
    const handleEdit = (person) => {
        setSelectedPerson(person);
        if (activeTab === 'entrenadores') setIsTrainerModalOpen(true);
        else setIsStaffModalOpen(true);
    };

    // Eliminar registro
    const handleDelete = async (id) => {
        if (!window.confirm("¿Estás seguro de desactivar a este miembro?")) return;

        const endpoint = activeTab === 'entrenadores' ? `/entrenadores/${id}` : `/staff/${id}`;

        try {
            await axios.delete(endpoint);
            fetchData(); // Recargar tabla
        } catch (e) {
            alert("Error al eliminar el registro.");
        }
    };

    // Guardar Entrenador (Lógica del TrainerModal antiguo)
    const handleSaveTrainer = async (formData) => {
        try {
            if (selectedPerson) {
                await axios.patch(`/entrenadores/${selectedPerson.id}`, formData);
            } else {
                await axios.post('/entrenadores', formData);
            }
            setIsTrainerModalOpen(false);
            fetchData(); // Recargar lista
        } catch (err) {
            // Re-lanzamos el error para que el Modal lo capture y muestre el mensaje rojo
            throw err;
        }
    };

    // --- FILTRADO EN FRONTEND ---
    const currentList = activeTab === 'entrenadores' ? trainers : staff;

    // Protección extra: Si por alguna razón currentList no es array, usamos []
    const safeList = Array.isArray(currentList) ? currentList : [];

    const filteredList = safeList.filter(p =>
        (p.nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.rut || "").includes(searchTerm) ||
        (p.especialidad || p.cargo || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in-up pb-10">

            {/* ENCABEZADO */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Gestión de Talento</h2>
                    <p className="text-gym-gray">Administra contratos, turnos y roles del equipo.</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="bg-gym-orange hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20"
                >
                    <Plus size={20} /> {activeTab === 'entrenadores' ? 'Nuevo Entrenador' : 'Nuevo Colaborador'}
                </button>
            </div>

            {/* TABS (PESTAÑAS) */}
            <div className="flex gap-6 border-b border-white/10">
                <button
                    onClick={() => { setActiveTab('entrenadores'); setSearchTerm(""); }}
                    className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'entrenadores' ? 'border-gym-orange text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                >
                    <Dumbbell size={18} /> Entrenadores
                    <span className="bg-white/10 px-1.5 rounded text-[10px] ml-1">{trainers.length}</span>
                </button>
                <button
                    onClick={() => { setActiveTab('staff'); setSearchTerm(""); }}
                    className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'staff' ? 'border-gym-orange text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
                >
                    <Briefcase size={18} /> Staff Operativo
                    <span className="bg-white/10 px-1.5 rounded text-[10px] ml-1">{staff.length}</span>
                </button>
            </div>

            {/* BARRA DE BÚSQUEDA */}
            <div className="bg-gym-card p-4 rounded-xl border border-white/5">
                <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gym-gray" />
                    <input
                        type="text"
                        placeholder={`Buscar por nombre, rut o cargo...`}
                        className="w-full bg-gym-dark/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-gym-orange outline-none transition-colors"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* GRID DE RESULTADOS */}
            {loading ? (
                <div className="text-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gym-orange mx-auto mb-4"></div>
                    <p className="text-gym-gray">Cargando equipo...</p>
                </div>
            ) : filteredList.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-2xl text-zinc-500">
                    <Users size={48} className="mx-auto mb-3 opacity-20" />
                    <p>No se encontraron resultados para tu búsqueda.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredList.map((person) => (
                        <PersonCard
                            key={person.id}
                            person={person}
                            type={activeTab} // 'entrenadores' o 'staff'
                            onView={activeTab === 'entrenadores'
                                ? () => setDetailTrainerId(person.id)  // Entrenadores
                                : () => setDetailStaffId(person.id)   // Staff
                            }
                            onEdit={() => handleEdit(person)}
                            onDelete={() => handleDelete(person.id)}
                        />
                    ))}
                </div>
            )}

            {/* --- MODALES --- */}

            {/* Modal Entrenador */}
            <TrainerModal
                isOpen={isTrainerModalOpen}
                onClose={() => setIsTrainerModalOpen(false)}
                trainerToEdit={selectedPerson}
                onSave={handleSaveTrainer}
            />

            {/* Modal Detalle (Stats) */}
            <TrainerDetailModal
                isOpen={!!detailTrainerId}
                onClose={() => setDetailTrainerId(null)}
                trainerId={detailTrainerId}
                allTrainers={trainers}
                onUpdate={fetchData}
            />

            {/* Modal Staff (Nuevo) */}
            <StaffModal
                isOpen={isStaffModalOpen}
                onClose={() => setIsStaffModalOpen(false)}
                staffToEdit={selectedPerson}
                onSave={() => {
                    fetchData(); // Solo recargamos, el modal guarda internamente
                    // Nota: No cerramos aquí explícitamente porque el modal lo hace
                }}
            />
            <StaffDetailModal
                isOpen={!!detailStaffId}
                onClose={() => setDetailStaffId(null)}
                staffId={detailStaffId}
            />

        </div>
    );
}

// --- SUB-COMPONENTE: TARJETA DE PERSONA ---
function PersonCard({ person, type, onView, onEdit, onDelete }) {

    // Icono según cargo (Para Staff)
    const getRoleIcon = (cargo) => {
        const c = (cargo || "").toLowerCase();
        if (c.includes('aseo')) return <Sparkles size={14} className="text-blue-400" />;
        if (c.includes('recep')) return <Monitor size={14} className="text-purple-400" />;
        if (c.includes('mantenimiento')) return <Wrench size={14} className="text-yellow-400" />;
        if (c.includes('admin')) return <ShieldAlert size={14} className="text-red-400" />;
        return <Briefcase size={14} className="text-zinc-400" />;
    };

    const isCoach = type === 'entrenadores';
    const roleLabel = isCoach ? person.especialidad : person.cargo;
    const roleIcon = isCoach ? <Trophy size={10} /> : getRoleIcon(person.cargo);

    return (
        <div className="bg-gym-card border border-white/5 rounded-2xl p-6 hover:border-gym-orange/50 transition-all group relative overflow-hidden flex flex-col h-full">

            {/* Fondo Decorativo */}
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full -mr-4 -mt-4 transition-all ${isCoach ? 'bg-gym-orange/5 group-hover:bg-gym-orange/10' : 'bg-blue-500/5 group-hover:bg-blue-500/10'}`}></div>

            {/* Header */}
            <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br border border-white/10 flex items-center justify-center text-xl font-bold text-white shadow-lg ${isCoach ? 'from-gray-700 to-gray-900' : 'from-blue-900 to-black'}`}>
                        {person.nombre.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg leading-tight truncate max-w-[140px]">{person.nombre}</h3>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded mt-1 ${isCoach ? 'text-gym-orange bg-gym-orange/10' : 'text-blue-400 bg-blue-500/10'}`}>
                            {roleIcon} {roleLabel || 'General'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Info Contacto */}
            <div className="space-y-2 mb-6 flex-1">
                {person.email && (
                    <div className="flex items-center gap-2 text-sm text-gym-gray truncate">
                        <Mail size={14} className="min-w-[14px]" /> <span className="truncate">{person.email}</span>
                    </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gym-gray">
                    <Phone size={14} className="min-w-[14px]" /> {person.telefono || 'Sin teléfono'}
                </div>
                {!isCoach && person.direccion && (
                    <div className="text-xs text-zinc-500 mt-2 line-clamp-1">
                        📍 {person.direccion}
                    </div>
                )}
            </div>

            {/* Footer / Acciones */}
            <div className="border-t border-white/5 pt-4 flex justify-between items-center mt-auto">

                {/* Info Izquierda */}
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-zinc-500">
                        {isCoach ? 'Contrato' : 'Turno'}
                    </span>
                    <span className="text-xs font-bold text-white">
                        {isCoach
                            ? (person.modelo_contrato || "Sueldo Fijo").replace('_', ' ')
                            : person.turno
                        }
                    </span>
                </div>

                {/* Botones Derecha */}
                <div className="flex gap-1">
                    {/* Botón Ver (Ahora para todos) */}
                    <button onClick={onView} className="p-2 text-zinc-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors" title="Ver Ficha">
                        <Eye size={18} />
                    </button>
                    <button onClick={onEdit} className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Editar">
                        <Edit size={18} />
                    </button>
                    <button onClick={onDelete} className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Desactivar">
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}