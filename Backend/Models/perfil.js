import { sql } from "../bd.js";

export class PerfilModel {
  // 1. Obtener los datos completos del admin/staff logueado
  static getProfileByUserId = async (id_usuario) => {
    const [profile] = await sql`
      SELECT 
        s.id as id_admin,
        s.nombre, 
        s.cargo,
        s.rut,
        s.direccion,
        s.turno,
        s.sueldo_base,
        s.fecha_contratacion,
        s.foto_perfil,
        s.preferencias_alertas,
        u.email, 
        u.username,
        u.password
      FROM staff s
      JOIN usuarios u ON s.id_usuario = u.id
      WHERE u.id = ${id_usuario}
    `;
    return profile;
  };

// 2. Actualizar los datos personales
  static updateProfile = async (id_usuario, input) => {
    const [updatedStaff] = await sql`
      UPDATE staff 
      SET 
        nombre = ${input.nombre},
        cargo = ${input.cargo},
        telefono = ${input.telefono},
        rut = ${input.rut || null},
        direccion = ${input.direccion || null},
        turno = ${input.turno || 'Full Time'},
        sueldo_base = ${input.sueldo_base || null}
      WHERE id_usuario = ${id_usuario}
      RETURNING nombre, cargo, telefono, rut, direccion, turno, sueldo_base, foto_perfil
    `;
    return updatedStaff;
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
    const [updatedStaff] = await sql`
      UPDATE staff
      SET preferencias_alertas = ${sql.json(preferencias)}
      WHERE id_usuario = ${id_usuario}
      RETURNING preferencias_alertas
    `;
    return updatedStaff;
  };

}