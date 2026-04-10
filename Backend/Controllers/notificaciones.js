// Controllers/notificaciones.js
import { success, error } from "../Utils/responses.js";

export class NotificacionController {
    constructor({ NotificacionModel }) {
        this.NotificacionModel = NotificacionModel;
    }

    obtenerHistorial = async (req, res) => {
        try {
            const historial = await this.NotificacionModel.getMisNotificaciones(req.user.id);
            // 🌟 CORRECCIÓN: Pasamos 'historial' directo, sin envolverlo en otro objeto
            success(req, res, historial, 200);
        } catch (e) {
            console.error("Error al obtener notificaciones:", e);
            error(req, res, "Error interno", 500);
        }
    };

marcarLeidas = async (req, res) => {
        try {
            // 🌟 1. Debugging: Imprimimos el ID para asegurarnos de que el token lo traiga
            console.log("Intentando marcar como leídas para el usuario:", req.user?.id);

            if (!req.user || !req.user.id) {
                return error(req, res, "Usuario no autenticado correctamente", 401);
            }

            // 🌟 2. Forzamos a que PostgreSQL nos devuelva cuántas filas actualizó
            const resultado = await this.NotificacionModel.marcarComoLeidas(req.user.id);
            
            success(req, res, { message: "Notificaciones actualizadas" }, 200);
        } catch (e) {
            console.error("Error al marcar leídas:", e);
            error(req, res, "Error interno", 500);
        }
    };
}