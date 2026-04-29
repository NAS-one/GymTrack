import { create } from 'zustand';
import { homeService } from '../features/home/services/homeService.js';

export const useHomeStore = create((set) => ({
    // Estado inicial de las métricas (vacío o en ceros)
    metrics: {
        asistencia: { sesionesMes: 0, racha: 0 },
        volumen: { tonelajeSemanal: 0, variacion: 0 },
        evolucion: { pesoActual: 0, grasa: 0 },
        plan: { nombre: 'Sin plan activo', avance: '0%' }
    },
    isLoading: false,
    error: null,

    // Acción para ir a buscar los datos
    fetchHomeMetrics: async (clientId) => {
        set({ isLoading: true, error: null });
        try {
            const data = await homeService.getMetrics(clientId);
            set({ metrics: data, isLoading: false });
        } catch (error) {
            console.error("Error en Zustand fetchHomeMetrics:", error);
            set({ error: 'Error al cargar métricas del dashboard', isLoading: false });
        }
    },

    clearHomeData: () => set({
        metrics: { asistencia: {}, volumen: {}, evolucion: {}, plan: {} }
    })
}));