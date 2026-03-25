// src/api/axios.js
import axios from "axios";

// 1. Instancia personalizada de Axios
// Axios configurado al localhost:3000.
const instance = axios.create({
  baseURL: "http://localhost:3000", // Tu Backend
  withCredentials: true, // Opcional: necesario si usaras cookies en el futuro
});

// 2. Interceptor de Solicitud (Request)
// "Antes de que la petición salga, haz esto..."
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");             // Leemos el token del disco

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;     // Si existe, lo agregamos al header Authorization
    }

    return config;                                          // Devolvemos la configuración
  },
  (error) => {
    return Promise.reject(error);                           // Si hay un error, lo devolvemos
  }
);

// 3. Exportamos ESTA instancia, no la de la librería por defecto
export default instance;
