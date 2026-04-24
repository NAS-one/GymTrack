import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// REEMPLAZA ESTO CON LA IP DE TU COMPUTADORA
const IP_LOCAL = '192.168.50.165';

const instance = axios.create({
    baseURL: `http://${IP_LOCAL}:3000`, // Tu backend Node.js
});

// Interceptor para inyectar el token en cada petición
instance.interceptors.request.use(
    async (config) => {
        // En móvil usamos AsyncStorage en lugar de localStorage
        const token = await AsyncStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default instance;