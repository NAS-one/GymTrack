import { sql } from "../bd.js";

export class PlanModel {
  // 1. OBTENER TODOS — con contadores corregidos (DISTINCT + fecha vigente)
  static async getAll() {
    return await sql`
      SELECT 
        p.*,
        (
          SELECT COUNT(DISTINCT m.id_cliente)::int 
          FROM membresias m 
          WHERE m.id_plan = p.id 
            AND m.estado = 'active' 
            AND m.fecha_fin >= CURRENT_DATE
        ) as usuarios_activos,
        (
          SELECT COUNT(DISTINCT m.id_cliente)::int 
          FROM membresias m 
          WHERE m.id_plan = p.id 
            AND (m.estado != 'active' OR m.fecha_fin < CURRENT_DATE)
        ) as usuarios_vencidos
      FROM planes p
      WHERE p.estado = 'active' 
      ORDER BY p.precio ASC
    `;
  }

  // 2. Crear
  static async create(input) {
    const { 
      nombre, precio, duracion_meses, descripcion, 
      tipo_plan = 'regular', requiere_validacion = false, beneficios_extra = [], precio_comparacion = null 
    } = input;
    const [plan] = await sql`
      INSERT INTO planes (nombre, precio, duracion_meses, descripcion, tipo_plan, requiere_validacion, beneficios_extra, precio_comparacion)
      VALUES (${nombre}, ${precio}, ${duracion_meses}, ${descripcion}, ${tipo_plan}, ${requiere_validacion}, ${sql.json(beneficios_extra)}, ${precio_comparacion})
      RETURNING *
    `;
    return plan;
  }

  // 3. Actualizar
  static async update({ id, input }) {
    const { 
      nombre, precio, duracion_meses, descripcion,
      tipo_plan, requiere_validacion, beneficios_extra, precio_comparacion
    } = input;

    // Solo actualizamos si hay datos (COALESCE mantiene el valor anterior si viene null)
    // Para beneficios_extra, si viene, lo parseamos como JSON
    const [plan] = await sql`
      UPDATE planes 
      SET 
        nombre = COALESCE(${nombre}, nombre),
        precio = COALESCE(${precio}, precio),
        duracion_meses = COALESCE(${duracion_meses}, duracion_meses),
        descripcion = COALESCE(${descripcion}, descripcion),
        tipo_plan = COALESCE(${tipo_plan}, tipo_plan),
        requiere_validacion = COALESCE(${requiere_validacion}, requiere_validacion),
        beneficios_extra = COALESCE(${beneficios_extra ? sql.json(beneficios_extra) : null}, beneficios_extra),
        precio_comparacion = ${precio_comparacion !== undefined ? precio_comparacion : sql`precio_comparacion`}
      WHERE id = ${id}
      RETURNING *
    `;
    return plan;
  }

  // 4. Contar planes activos
  static async countActivePlans() {
    const [result] = await sql`
      SELECT COUNT(*)::int as total FROM planes WHERE estado = 'active'
    `;
    return result.total;
  }

  // 5. Contar usuarios realmente vigentes en un plan
  static async getUsersOnPlan({ id }) {
    const [result] = await sql`
      SELECT COUNT(DISTINCT m.id_cliente)::int as total 
      FROM membresias m 
      WHERE m.id_plan = ${id} 
        AND m.estado = 'active' 
        AND m.fecha_fin >= CURRENT_DATE
    `;
    return result.total;
  }

  // 6. Eliminar (Soft Delete) — con validaciones
  static async delete({ id }) {
    const [plan] = await sql`
      UPDATE planes SET estado = 'inactive' WHERE id = ${id} RETURNING id
    `;
    return !!plan;
  }

  // 7. Obtener planes archivados (inactivos) con info histórica
  static async getArchived() {
    return await sql`
      SELECT 
        p.*,
        (
          SELECT COUNT(*)::int 
          FROM membresias m 
          WHERE m.id_plan = p.id
        ) as total_membresias_historicas,
        (
          SELECT COUNT(*)::int 
          FROM membresias m 
          WHERE m.id_plan = p.id AND m.estado = 'active'
        ) as usuarios_activos_restantes,
        (
          SELECT COALESCE(SUM(pg.monto), 0)::int 
          FROM pagos pg
          JOIN membresias m ON pg.id_membresia = m.id
          WHERE m.id_plan = p.id
        ) as ingresos_historicos
      FROM planes p
      WHERE p.estado = 'inactive' 
      ORDER BY p.nombre ASC
    `;
  }

  // 8. OBTENER DETALLE PROFUNDO (Para el Modal)
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

