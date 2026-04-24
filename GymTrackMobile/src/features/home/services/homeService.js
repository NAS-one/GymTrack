import api from '../../../api/axios';

export const homeService = {
    // Hace una petición GET a la nueva ruta de tu backend
    getMetrics: async (clientId) => {
        try {
            const response = await api.get(`/app_home/metrics/${clientId}`);
            return response.data.body; // Retorna el payload directo al Store
        } catch (error) {
            throw error;
        }
    }
};