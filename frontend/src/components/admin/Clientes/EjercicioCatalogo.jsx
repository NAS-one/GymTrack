import { useState, useMemo } from "react";
import { Search, X, Dumbbell } from "lucide-react";

const GRUPO_ICONS = {
  Pecho: "🫁",
  Espalda: "🔙",
  Piernas: "🦵",
  Brazos: "💪",
  Hombros: "🏋️",
  Core: "🧘",
  Cardio: "🏃",
  Otros: "⚡",
};

export function EjercicioCatalogo({
  isOpen,
  ejercicios = [],
  onSelect,
  onClose,
}) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroGrupo, setFiltroGrupo] = useState("Todos");

  //Obtener los grupos musculares únicos
  const grupos = useMemo(() => {
    const set = new Set(ejercicios.map((e) => e.grupo_muscular || "Otros"));
    return ["Todos", ...Array.from(set).sort()];
  }, [ejercicios]);

  //Filtrar ejercicios por búsqueda + grupo
  const ejerciciosFiltrados = useMemo(() => {
    return ejercicios.filter((ej) => {
      const coincideBusqueda = ej.nombre
        .toLowerCase()
        .includes(busqueda.toLowerCase());
      const coincideGrupo =
        filtroGrupo === "Todos" ||
        (ej.grupo_muscular || "Otros") === filtroGrupo;
      return coincideBusqueda && coincideGrupo;
    });
  }, [ejercicios, busqueda, filtroGrupo]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-lg flex items-center justify-center z-[80] p-4 animate-fade-in">
      <div className="bg-[#0d0d0f] border border-white/10 w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="px-5 pt-5 pb-3 border-b border-white/5 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Dumbbell size={20} className="text-orange-400" />
              Catálogo de Ejercicios
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          {/* Buscador */}
          <div className="relative mb-3">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
            />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar ejercicio..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:border-orange-500 outline-none transition-colors"
              autoFocus
            />
          </div>
          {/* Filtros por grupo muscular */}
          <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {grupos.map((grupo) => (
              <button
                key={grupo}
                type="button"
                onClick={() => setFiltroGrupo(grupo)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  filtroGrupo === grupo
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                    : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/5"
                }`}
              >
                {GRUPO_ICONS[grupo] || "💪"} {grupo}
              </button>
            ))}
          </div>
        </div>
        {/* GRID DE EJERCICIOS */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {ejerciciosFiltrados.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-sm">
              No se encontraron ejercicios
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ejerciciosFiltrados.map((ej) => (
                <button
                  key={ej.id}
                  type="button"
                  onClick={() => {
                    onSelect(ej.id);
                    onClose();
                  }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all text-left group"
                >
                  <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 group-hover:bg-orange-500/20 transition-colors">
                    <span className="text-sm">
                      {GRUPO_ICONS[ej.grupo_muscular] || "💪"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate group-hover:text-orange-300 transition-colors">
                      {ej.nombre}
                    </p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                      {ej.grupo_muscular || "Otros"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        {/* FOOTER */}
        <div className="px-5 py-3 border-t border-white/5 shrink-0">
          <p className="text-[10px] text-zinc-600 text-center">
            {ejerciciosFiltrados.length} ejercicios disponibles · Clic para
            seleccionar
          </p>
        </div>
      </div>
    </div>
  );
}
