import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// LA IP DE TU COMPUTADORA
const IP_LOCAL = "192.168.1.89";

const instance = axios.create({
  baseURL: `http://${IP_LOCAL}:3000`,
});

// Interceptor para inyectar el token en cada petición
instance.interceptors.request.use(
  async (config) => {
    // En móvil usamos AsyncStorage
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export default instance;
