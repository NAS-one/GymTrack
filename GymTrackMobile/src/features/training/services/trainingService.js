import api from '../../../api/axios.js';

export const trainingService = {
    // 1. Obtiene la rutina activa del cliente (Tu endpoint GET /rutinas/active/:id_cliente)
    getActiveRoutine: async (clientId) => {
        try {
            const response = await api.get(`/rutinas/active/${clientId}`);
            return response.data.body; // Extraemos el 'body' de tu helper de respuesta
        } catch (error) {
            // Si el backend responde 404 (El cliente no tiene rutinas activas), devolvemos null en lugar de crashear
            if (error.response && error.response.status === 404) return null;
            throw error;
        }
    },

    // 2. Obtiene todos los ejercicios para la biblioteca (Tu endpoint GET /ejercicios)
    getAllExercises: async () => {
        const response = await api.get('/ejercicios');
        return response.data.body;
    },

    // 3. Registra una serie completada (Tu endpoint POST /progresos)
    saveProgress: async (progressData) => {
        const response = await api.post('/progresos', progressData);
        return response.data.body;
    }
};