import { sql } from "../bd.js";

export class PlanModel {
  // 1. OBTENER TODOS (Ahora con contador de usuarios activos)
  static async getAll() {
    return await sql`
      SELECT 
        p.*,
        (
          SELECT COUNT(*)::int 
          FROM membresias m 
          WHERE m.id_plan = p.id AND m.estado = 'active'
        ) as usuarios_activos
      FROM planes p
      WHERE p.estado = 'active' 
      ORDER BY p.precio ASC
    `;
  }

  // 2. Crear
  static async create(input) {
    const { nombre, precio, duracion_meses, descripcion } = input;
    const [plan] = await sql`
      INSERT INTO planes (nombre, precio, duracion_meses, descripcion)
      VALUES (${nombre}, ${precio}, ${duracion_meses}, ${descripcion})
      RETURNING *
    `;
    return plan;
  }

  // 3. Actualizar
  static async update({ id, input }) {
    const { nombre, precio, duracion_meses, descripcion } = input;

    // Solo actualizamos si hay datos (COALESCE mantiene el valor anterior si viene null)
    const [plan] = await sql`
      UPDATE planes 
      SET 
        nombre = COALESCE(${nombre}, nombre),
        precio = COALESCE(${precio}, precio),
        duracion_meses = COALESCE(${duracion_meses}, duracion_meses),
        descripcion = COALESCE(${descripcion}, descripcion)
      WHERE id = ${id}
      RETURNING *
    `;
    return plan;
  }

  // 4. Eliminar (Soft Delete)
  static async delete({ id }) {
    const [plan] = await sql`
      UPDATE planes SET estado = 'inactive' WHERE id = ${id} RETURNING id
    `;
    return !!plan;
  }

  // 5. OBTENER DETALLE PROFUNDO (Para el Modal)
  static async getStats({ id }) {
    try {
      const [stats, ingresos, clientes] = await Promise.all([
        // A. KPI Generales
        sql`
          SELECT 
            (SELECT COUNT(*)::int FROM membresias WHERE id_plan = ${id}) as total_historico,
            (SELECT COUNT(*)::int FROM membresias WHERE id_plan = ${id} AND estado = 'active') as activos_ahora,
            (
              SELECT COALESCE(SUM(pg.monto), 0)::int 
              FROM pagos pg
              JOIN membresias m ON pg.id_membresia = m.id
              WHERE m.id_plan = ${id}
            ) as ingresos_totales
        `,
        // B. Gráfico de Ingresos por Mes (Últimos 6 meses)
        sql`
          SELECT 
            TO_CHAR(pg.fecha_pago, 'YYYY-MM') as mes,
            SUM(pg.monto)::int as total
          FROM pagos pg
          JOIN membresias m ON pg.id_membresia = m.id
          WHERE m.id_plan = ${id}
          AND pg.fecha_pago > NOW() - INTERVAL '6 months'
          GROUP BY 1
          ORDER BY 1 ASC
        `,
        // C. Lista de Clientes Activos en este Plan
        sql`
          SELECT c.nombre, c.rut, m.fecha_inicio, m.fecha_fin
          FROM clientes c
          JOIN membresias m ON c.id = m.id_cliente
          WHERE m.id_plan = ${id} AND m.estado = 'active'
          ORDER BY m.fecha_fin ASC
          LIMIT 20
        `,
      ]);

      return {
        kpi: stats[0],
        grafico: ingresos,
        clientes,
      };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
