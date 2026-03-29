import { Router } from "express";
import { SSEManager } from "../Utils/sse.js";
import jwt from "jsonwebtoken";

export const createNotificationRouter = () => {
    const router = Router();

    // Ruta protegida por token en query string (EventSource no soporta headers Authorization nativamente)
    router.get("/stream", (req, res) => {
        const token = req.query.token;

        if (!token) {
            return res.status(401).json({ error: "Token no proporcionado para el stream SSE" });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Control de seguridad adicional: Solo administradores (y recepcionistas si aplica)
            // Ajusta la lista de roles si usas recepcionista también.
            if (decoded.role !== 'administrador' && decoded.role !== 'recepcionista') {
                return res.status(403).json({ error: "No tienes permisos para escuchar este stream" });
            }

            // Si todo está bien, lo suscribimos al SSE
            SSEManager(req, res);

        } catch (error) {
            return res.status(403).json({ error: "Token SSE inválido o expirado" });
        }
    });

    return router;
};
