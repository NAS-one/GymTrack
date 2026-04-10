// 1. Agregamos useContext a la importación de React
import { useEffect, useState, useContext } from "react";
import axios from "../../api/axios";
// 2. Agregamos el icono 'Eye' (Ojo) a lucide-react
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Dumbbell,
  Youtube,
  Play,
  Eye,
} from "lucide-react";
import { ExerciseModal } from "../../components/admin/Ejercicios/ExerciseModal";
// 3. Importamos tu AuthContext (verifica que la ruta sea correcta)
import { AuthContext } from "../../contexts/AuthContext";

const MUSCLE_GROUPS = [
  "Todos",
  "Pecho",
  "Espalda",
  "Piernas",
  "Hombros",
  "Bíceps",
  "Tríceps",
  "Abdominales",
  "Cardio",
];

export function Ejercicios() {
  // 4. EXTRAEMOS AL USUARIO Y SABEMOS SU ROL
  const { user } = useContext(AuthContext);
  const rolDelUsuario = (user?.role || user?.rol || user?.id_rol || "")
    .toString()
    .toLowerCase();
  const isAdmin = rolDelUsuario === "administrador" || rolDelUsuario === "1";

  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterGroup, setFilterGroup] = useState("Todos");
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/ejercicios");
      setExercises(res.data.body || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  const handleSave = async (data) => {
    try {
      if (selectedExercise)
        await axios.patch(`/ejercicios/${selectedExercise.id}`, data);
      else await axios.post("/ejercicios", data);
      setIsModalOpen(false);
      fetchExercises();
    } catch (e) {
      alert("Error al guardar: " + (e.response?.data?.error || "Desconocido"));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este ejercicio?")) return;
    try {
      await axios.delete(`/ejercicios/${id}`);
      fetchExercises();
    } catch (e) {
      alert("Error al eliminar");
    }
  };

  const filtered = exercises.filter((ex) => {
    const matchesGroup =
      filterGroup === "Todos" || ex.grupo_muscular === filterGroup;
    const matchesSearch = ex.nombre
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesGroup && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Biblioteca de Ejercicios
          </h2>
          <p className="text-gym-gray text-sm">
            Catálogo estandarizado para rutinas de entrenamiento.
          </p>
        </div>

        {/* 5. OCULTAMOS EL BOTÓN DE CREAR SI ES ENTRENADOR */}
        {isAdmin && (
          <button
            onClick={() => {
              setSelectedExercise(null);
              setIsModalOpen(true);
            }}
            className="bg-gym-orange hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-lg transition-all"
          >
            <Plus size={20} /> Nuevo Ejercicio
          </button>
        )}
      </div>

      {/* BARRA DE FILTROS (CHIPS) */}
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
        {MUSCLE_GROUPS.map((group) => (
          <button
            key={group}
            onClick={() => setFilterGroup(group)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
              filterGroup === group
                ? "bg-white text-black border-white"
                : "bg-black/40 text-gym-gray border-white/10 hover:border-white/30 hover:text-white"
            }`}
          >
            {group}
          </button>
        ))}
      </div>

      {/* BUSCADOR */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gym-gray"
        />
        <input
          type="text"
          placeholder="Buscar ejercicio..."
          className="w-full bg-gym-card border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:border-gym-orange outline-none transition-colors"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* GRID DE EJERCICIOS */}
      {loading ? (
        <div className="text-center py-12 text-gym-gray">
          Cargando biblioteca...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((ex) => (
            <div
              key={ex.id}
              className="bg-gym-card border border-white/5 rounded-2xl p-4 hover:border-white/20 transition-all group flex flex-col"
            >
              {/* Header Card */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-zinc-800 to-black border border-white/5 flex items-center justify-center text-gym-orange shadow-inner">
                    <Dumbbell size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm line-clamp-1">
                      {ex.nombre}
                    </h3>
                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider">
                      {ex.grupo_muscular}
                    </span>
                  </div>
                </div>
              </div>

              {/* Descripción Corta */}
              <p className="text-xs text-zinc-500 line-clamp-2 mb-4 flex-1">
                {ex.descripcion || "Sin descripción detallada."}
              </p>

              {/* Footer y Acciones */}
              <div className="flex justify-between items-center pt-3 border-t border-white/5">
                {ex.url_video ? (
                  <a
                    href={ex.url_video}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <Youtube size={14} /> Ver Video
                  </a>
                ) : (
                  <span className="text-[10px] text-zinc-600 italic">
                    Sin video
                  </span>
                )}

                {/* 6. LÓGICA DE BOTONES EN LA TARJETA */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isAdmin ? (
                    <>
                      <button
                        onClick={() => {
                          setSelectedExercise(ex);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(ex.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedExercise(ex);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg"
                      title="Ver detalles"
                    >
                      <Eye size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ExerciseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        exercise={selectedExercise}
        onSave={handleSave}
      />
    </div>
  );
}
