import { sql } from "../bd.js";

export class ColaboradorModel {
  
  static async getAll() {
    return await sql`
      SELECT c.*, u.email, u.estado as estado_usuario
      FROM colaboradores c
      LEFT JOIN usuarios u ON c.id_usuario = u.id
      ORDER BY c.nombre ASC
    `;
  }

  static async create(input) {
    // Extraemos campos para lógica manual (creación de usuario)
    const { email, password, cargo, ...staffData } = input;

    return await sql.begin(async (sql) => {
      let id_usuario = null;

      // 1. Lógica Usuario (Login)
      if (email && password) {
        const rolNombre = cargo.toLowerCase() === "recepcionista" ? "recepcionista" : "mantenimiento";
        let [rol] = await sql`SELECT id FROM roles WHERE nombre = ${rolNombre}`;
        
        // Fallback por si no existe el rol exacto
        if (!rol) [rol] = await sql`SELECT id FROM roles WHERE nombre = 'mantenimiento'`;

        if (rol) {
            const [newUser] = await sql`
              INSERT INTO usuarios (username, email, password, id_rol, estado)
              VALUES (${email.split("@")[0]}, ${email}, ${password}, ${rol.id}, 'active')
              RETURNING id
            `;
            id_usuario = newUser.id;
        }
      }

      // 2. Crear Staff
      const [colaborador] = await sql`
        INSERT INTO colaboradores ${sql({
          ...staffData, 
          cargo,        // Re-integramos cargo
          id_usuario    // Añadimos el ID creado
        })} 
        RETURNING *
      `;

      return colaborador;
    });
  }

  // --- UPDATE OPTIMIZADO ---
  static async update({ id, input }) {
    // Eliminamos email/password del input directo a la tabla colaboradores
    // (Ya que esos van a la tabla usuarios, lógica omitida por simplicidad aquí)
    const { email, password, ...dataToUpdate } = input;

    // postgres.js detecta automáticamente las columnas a actualizar basado en el objeto
    const [updated] = await sql`
      UPDATE colaboradores 
      SET ${sql(dataToUpdate)}
      WHERE id = ${id}
      RETURNING *
    `;
    
    return updated;
  }

  static async delete(id) {
    await sql`UPDATE usuarios SET estado = 'inactive' WHERE id = (SELECT id_usuario FROM colaboradores WHERE id = ${id})`;
    return await sql`DELETE FROM colaboradores WHERE id = ${id}`;
  }
// Metodo para obtener estadisticas de un colaborador
static async getStats({ id }) {
    // 1. Obtener Perfil
    const [perfil] = await sql`
      SELECT c.*, u.email, u.estado as estado_usuario
      FROM colaboradores c
      LEFT JOIN usuarios u ON c.id_usuario = u.id
      WHERE c.id = ${id}
    `;

    if (!perfil) return null;

    // --- BLOQUE DEFENSIVO ---
    // Si el colaborador no tiene usuario (ej: personal de aseo sin login),
    // NO podemos buscar en la tabla asistencia (que requiere id_usuario).
    // Devolvemos datos vacíos para evitar el Error 500.
    if (!perfil.id_usuario) {
        return {
            perfil,
            historial: [], // Gráfico vacío
            kpis: {
                antiguedad_dias: Math.floor((new Date() - new Date(perfil.created_at)) / (86400000)),
                costo_anual_proyectado: perfil.sueldo_base * 12,
                asistencia_promedio: 0 // Sin asistencia registrada
            }
        };
    }

    // 2. CONSULTAS DE ASISTENCIA (Solo si tiene id_usuario)
    try {
        // A. KPI del mes actual
        const [asistenciaMes] = await sql`
            SELECT COUNT(*)::int as total
            FROM asistencia 
            WHERE id_usuario = ${perfil.id_usuario}
            AND EXTRACT(MONTH FROM fecha_entrada) = EXTRACT(MONTH FROM CURRENT_DATE)
        `;

        // B. Historial de 6 meses
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
            ${perfil.sueldo_base} as costo_empresa,
            
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
            costo_anual_proyectado: perfil.sueldo_base * 12,
            asistencia_promedio: asistenciaMes?.total || 0
          }
        };

    } catch (error) {
        console.error("Error SQL en getStats:", error);
        // En caso de error en la subconsulta, devolvemos el perfil básico para no romper el frontend
        return { perfil, historial: [], kpis: { antiguedad_dias: 0, costo_anual_proyectado: 0, asistencia_promedio: 0 } };
    }
  }
}