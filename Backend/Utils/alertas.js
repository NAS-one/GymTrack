// Utils/alertas.js
// guardará la notificación en la tabla de Postgres y disparará el SSE al frontend.
import { NotificacionModel } from '../Models/notificaciones.js';
import { sendNotification } from './sse.js';

export const dispararAlertaStaff = async (titulo, mensaje, tipo) => {
    try {
        // 1. Guardamos la alerta en la Base de Datos para persistencia
        await NotificacionModel.crearParaStaff({ titulo, mensaje, tipo });
        
        // 2. Disparamos la alerta en Tiempo Real (SSE) para los que estén conectados
        sendNotification({
            type: tipo,
            title: titulo,
            message: mensaje,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error al disparar alerta:", error);
    }
};