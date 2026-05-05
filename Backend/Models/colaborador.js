import { sql } from "../bd.js";

export class ColaboradorModel {
  
  static async getAll() {
    return await sql`
      SELECT s.*, u.email, u.estado as estado_usuario
      FROM staff s
      LEFT JOIN usuarios u ON s.id_usuario = u.id
      ORDER BY s.nombre ASC
    `;
  }

  static async create(input) {
    const { email, password, cargo, ...staffData } = input;

    return await sql.begin(async (sql) => {
      let id_usuario = null;

      // Si se proporcionan credenciales, crear usuario
      if (email && password) {
        // Administrador -> rol 'administrador', resto -> rol 'colaborador'
        const rolNombre = cargo === 'Administrador' ? 'administrador' : 'colaborador';
        let [rol] = await sql`SELECT id FROM roles WHERE nombre = ${rolNombre}`;
        
        if (!rol) [rol] = await sql`SELECT id FROM roles WHERE nombre = 'colaborador'`;

        if (rol) {
            const [newUser] = await sql`
              INSERT INTO usuarios (username, email, password, id_rol, estado)
              VALUES (${email.split("@")[0]}, ${email}, ${password}, ${rol.id}, 'active')
              RETURNING id
            `;
            id_usuario = newUser.id;
        }
      }

      // Crear registro en staff
      const [staffMember] = await sql`
        INSERT INTO staff ${sql({
          ...staffData, 
          cargo,
          id_usuario
        })} 
        RETURNING *
      `;

      return staffMember;
    });
  }

  static async update({ id, input }) {
    const { email, password, ...dataToUpdate } = input;

    const [updated] = await sql`
      UPDATE staff 
      SET ${sql(dataToUpdate)}
      WHERE id = ${id}
      RETURNING *
    `;
    
    return updated;
  }

  static async delete(id) {
    await sql`UPDATE usuarios SET estado = 'inactive' WHERE id = (SELECT id_usuario FROM staff WHERE id = ${id})`;
    return await sql`DELETE FROM staff WHERE id = ${id}`;
  }

  static async getStats({ id }) {
    const [perfil] = await sql`
      SELECT s.*, u.email, u.estado as estado_usuario
      FROM staff s
      LEFT JOIN usuarios u ON s.id_usuario = u.id
      WHERE s.id = ${id}
    `;

    if (!perfil) return null;

    if (!perfil.id_usuario) {
        return {
            perfil,
            historial: [],
            kpis: {
                antiguedad_dias: Math.floor((new Date() - new Date(perfil.created_at)) / (86400000)),
                costo_anual_proyectado: (perfil.sueldo_base || 0) * 12,
                asistencia_promedio: 0
            }
        };
    }

    try {
        const [asistenciaMes] = await sql`
            SELECT COUNT(*)::int as total
            FROM asistencia 
            WHERE id_usuario = ${perfil.id_usuario}
            AND EXTRACT(MONTH FROM fecha_entrada) = EXTRACT(MONTH FROM CURRENT_DATE)
        `;

        const historial = await sql`
          WITH meses AS (
            SELECT generate_series(
              DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months',
              DATE_TRUNC('month', CURRENT_DATE),
              '1 month'::interval
            ) as mes_fecha
          )
          SELECT 
            TO_CHAR(m.mes_fecha, 'Mon') as mes,
            ${perfil.sueldo_base || 0} as costo_empresa,
            
            COALESCE((
                SELECT COUNT(*)::int
                FROM asistencia a
                WHERE a.id_usuario = ${perfil.id_usuario}
                AND DATE_TRUNC('month', a.fecha_entrada) = m.mes_fecha
            ), 0) as tareas_completadas

          FROM meses m
          ORDER BY m.mes_fecha ASC
        `;

        return { 
          perfil, 
          historial, 
          kpis: {
            antiguedad_dias: Math.floor((new Date() - new Date(perfil.created_at)) / (86400000)),
            costo_anual_proyectado: (perfil.sueldo_base || 0) * 12,
            asistencia_promedio: asistenciaMes?.total || 0
          }
        };

    } catch (error) {
        console.error("Error SQL en getStats:", error);
        return { perfil, historial: [], kpis: { antiguedad_dias: 0, costo_anual_proyectado: 0, asistencia_promedio: 0 } };
    }
  }
}