// Gestor de Estado Global-> guarda los datos en la memoria RAM del cel, para evitar pedirla al backend otra vez.

import { create } from 'zustand';
import { trainingService } from '../features/training/services/trainingService.js';

export const useTrainingStore = create((set, get) => ({
    // Estados iniciales
    rutinaHoy: null,
    misPlanes: [],
    rutinasBiblioteca: [],
    isLoading: false,
    error: null,

    // Función para extraer los datos reales de PostgreSQL
    fetchTrainingData: async (clientId) => {
        set({ isLoading: true, error: null });
        try {
            // Ejecutamos ambas peticiones al mismo tiempo para mayor velocidad
            const [rutinaActivaDB, ejerciciosDB] = await Promise.all([
                trainingService.getActiveRoutine(clientId),
                trainingService.getAllExercises()
            ]);

            // 1. MAPEAMOS LA RUTINA ACTIVA (Si existe)
            let rutinaFormateada = null;
            let planesFormateados = [];

            if (rutinaActivaDB) {
                // Adaptamos la BD a la UI de la Fase 2
                rutinaFormateada = {
                    titulo: rutinaActivaDB.nombre,
                    // Como tu BD no devuelve el cálculo de series en este endpoint principal aún, 
                    // ponemos valores por defecto o calculados si vienen en los 'detalles'
                    ejercicios: rutinaActivaDB.detalles?.length || 0,
                    series: rutinaActivaDB.detalles?.reduce((acc, det) => acc + det.series, 0) || 0,
                    tiempo: '60 mins' // Puedes agregar esto a tu tabla de rutinas en el futuro
                };

                planesFormateados = [{
                    id: rutinaActivaDB.id,
                    nombre: rutinaActivaDB.nombre,
                    equipo: 'Gym',
                    dias: rutinaActivaDB.detalles?.length || 1, // Días distintos en el detalle
                    activo: true,
                    semana: ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
                    diasActivos: ['L', 'X', 'V'] // Lógica a refinar con días reales
                }];
            } else {
                // Fallback si no tiene rutinas asignadas
                rutinaFormateada = { titulo: 'Sin rutina asignada', ejercicios: 0, series: 0, tiempo: '--' };
            }

            // 2. MAPEAMOS LOS EJERCICIOS A LA BIBLIOTECA
            // Agrupamos los ejercicios de a 2 para que se vean bien en las tarjetas de la UI
            const bibliotecaFormateada = [];
            for (let i = 0; i < ejerciciosDB.length; i += 2) {
                bibliotecaFormateada.push({
                    id: ejerciciosDB[i].id,
                    nombre: `Librería de ${ejerciciosDB[i].grupo_muscular.toUpperCase()}`,
                    ej1: ejerciciosDB[i].nombre,
                    ej2: ejerciciosDB[i + 1] ? ejerciciosDB[i + 1].nombre : 'Más ejercicios...'
                });
            }

            // 3. GUARDAMOS EN MEMORIA
            set({
                rutinaHoy: rutinaFormateada,
                misPlanes: planesFormateados,
                rutinasBiblioteca: bibliotecaFormateada,
                isLoading: false
            });

        } catch (error) {
            console.error("Error cargando store:", error);
            set({ error: "Error de conexión con el servidor", isLoading: false });
        }
    },

    clearTrainingData: () => set({ rutinaHoy: null, misPlanes: [], rutinasBiblioteca: [] })
}));