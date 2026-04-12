import { Router } from "express";
import { SSEManager } from "../Utils/sse.js";
import { verifyToken } from "../Middlewares/auth.js";
import { NotificacionController } from "../Controllers/notificaciones.js";
import { NotificacionModel } from "../Models/notificaciones.js";

export const createNotificacionesRouter = () => {
    const router = Router();
    const controller = new NotificacionController({ NotificacionModel });

    // 1. El túnel de Tiempo Real (SSE)
    router.get("/stream", verifyToken, SSEManager);

    // 2. Obtener el historial de la Base de Datos
    router.get("/", verifyToken, controller.obtenerHistorial);

    // 3. Marcar todo como leído
    router.put("/leer", verifyToken, controller.marcarLeidas);

    return router;
};