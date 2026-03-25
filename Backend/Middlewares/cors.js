// Middlewares/cors.js
import cors from "cors";

// Definimos los orígenes permitidos por defecto
const ACCEPTED_ORIGINS = [
  "http://localhost:8080", // Frontend local (Servor/http-server)
  "http://localhost:3000", // React default port
  "http://localhost:5173", // Vite default port
  "http://localhost:5174", // Vite default port
];

export const corsMiddleware = ({ acceptedOrigins = ACCEPTED_ORIGINS } = {}) =>
  cors({
    origin: (origin, callback) => {
      // 1. Permitir solicitudes sin origen (como Postman, Mobile Apps o Server-to-Server)
      if (!origin) {
        return callback(null, true);
      }

      // 2. Permitir si el origen está en la lista blanca
      if (acceptedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // 3. Bloquear cualquier otro origen
      return callback(
        new Error("🚫 La política CORS ha bloqueado esta solicitud.")
      );
    },
    credentials: true, // Permitir cookies y credenciales en solicitudes CORS
  });
