// Models/notificaciones.js
import { sql } from "../bd.js";

export class NotificacionModel {
    // 1. Insertar una notificación en el buzón de TODOS los miembros del Staff
    static crearParaStaff = async ({ titulo, mensaje, tipo }) => {
        await sql`
            INSERT INTO notificaciones (titulo, mensaje, tipo, id_usuario)
            SELECT ${titulo}, ${mensaje}, ${tipo}, u.id
            FROM usuarios u
            JOIN roles r ON u.id_rol = r.id
            WHERE r.nombre IN ('administrador', 'recepcionista')
        `;
    };

    // 2. Obtener el buzón personal del usuario que inició sesión
    static getMisNotificaciones = async (id_usuario) => {
        const notificaciones = await sql`
            SELECT id, titulo, mensaje, tipo, leida, created_at as timestamp
            FROM notificaciones
            WHERE id_usuario = ${id_usuario}
            ORDER BY created_at DESC
            LIMIT 50
        `;
        return notificaciones;
    };

    // 3. Marcar todas las notificaciones de un usuario como leídas
    static marcarComoLeidas = async (id_usuario) => {
        await sql`
            UPDATE notificaciones 
            SET leida = TRUE 
            WHERE id_usuario = ${id_usuario} AND leida = FALSE
        `;
    };
}