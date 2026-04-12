import { sql } from "../bd.js";

export class PerfilModel {
  // 1. Obtener los datos completos del admin logueado
  static getProfileByUserId = async (id_usuario) => {
    const [profile] = await sql`
      SELECT 
        a.id as id_admin,
        a.nombre, 
        a.cargo, 
        a.foto_perfil,
        u.email, 
        u.username,
        u.password -- Necesario para verificar la contraseña actual después
      FROM administradores a
      JOIN usuarios u ON a.id_usuario = u.id
      WHERE u.id = ${id_usuario}
    `;
    return profile;
  };

// 2. Actualizar los datos personales
  static updateProfile = async (id_usuario, input) => {
    const [updatedAdmin] = await sql`
      UPDATE administradores 
      SET 
        nombre = ${input.nombre},
        cargo = ${input.cargo},
        telefono = ${input.telefono} 
      WHERE id_usuario = ${id_usuario}
      RETURNING nombre, cargo, telefono, foto_perfil
    `;
    return updatedAdmin;
  };

    // 3. Actualizar la contraseña en la tabla usuarios
  static updatePassword = async (id_usuario, newHashedPassword) => {
    const [updatedUser] = await sql`
      UPDATE usuarios
      SET password = ${newHashedPassword},
      ultima_actualizacion_password = CURRENT_TIMESTAMP
      WHERE id = ${id_usuario}
      RETURNING id
    `;
    return updatedUser;
  };

    //  4. Obtener el registro de auditoría de sesiones
  static getAuditoria = async (id_usuario) => {
    // Formateamos la salida directamente en SQL para que el frontend reciba exactamente lo que necesita
    return await sql`
      SELECT 
        dispositivo as title, 
        ip_address as location, 
        TO_CHAR(fecha, 'DD Mon YYYY, HH:MI AM') as time, 
        estado as status
      FROM auditoria_sesiones
      WHERE id_usuario = ${id_usuario}
      ORDER BY fecha DESC
      LIMIT 5
    `;
  };

  //  5. Actualizar el JSONB de preferencias
  static updatePreferencias = async (id_usuario, preferencias) => {
    const [updatedAdmin] = await sql`
      UPDATE administradores
      SET preferencias_alertas = ${sql.json(preferencias)}
      WHERE id_usuario = ${id_usuario}
      RETURNING preferencias_alertas
    `;
    return updatedAdmin;
  };

}