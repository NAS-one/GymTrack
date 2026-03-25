import { sql } from "../../Backend/bd.js";

export class DashboardModel {
  static async getSummary() {
    const today = new Date();
    
    // --- LÍMITES DE TIEMPO EXACTOS DESDE NODE (Hora Local) ---
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    // Rango exacto de 7 días para los gráficos de "Semana"
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - 6);

    const [
      [ingresos],
      [activos],
      [nuevos],
      [totalClientes],
      [asistenciaHoy],
      [maquinasMalas],
      financeHistoryYear,
      financeHistoryWeek,
      attendanceHistoryYear,
      attendanceHistoryWeek,
      planesActive,
      planesHistory,
      ultimosAccesos,
      asistenciaPorHora,
    ] = await Promise.all([
      
      // 1. KPIs
      sql`SELECT COALESCE(SUM(monto), 0)::int as total FROM pagos WHERE fecha_pago >= ${startOfMonth} AND fecha_pago <= ${endOfDay}`,
      sql`SELECT COUNT(DISTINCT id_cliente)::int as total FROM membresias WHERE estado = 'active' AND fecha_fin >= CURRENT_DATE`,
      sql`SELECT COUNT(*)::int as total FROM clientes WHERE created_at >= ${startOfMonth} AND created_at <= ${endOfDay}`,
      sql`SELECT COUNT(*)::int as count FROM clientes WHERE created_at <= ${endOfDay}`,
      sql`SELECT COUNT(*)::int as total FROM asistencia WHERE fecha_entrada >= ${startOfDay} AND fecha_entrada <= ${endOfDay} AND estado_acceso = 'aprobado'`,
      sql`SELECT COUNT(*)::int as total FROM maquinas WHERE estado != 'operativa' AND fecha_adquisicion <= ${endOfDay}`,

      // 2. Gráficos Ingresos
      sql`
        SELECT EXTRACT(YEAR FROM fecha_pago)::int as year, TO_CHAR(fecha_pago, 'FMMon') as name, SUM(monto)::int as value
        FROM pagos WHERE fecha_pago >= NOW() - INTERVAL '1 year'
        GROUP BY year, name, DATE_TRUNC('month', fecha_pago) ORDER BY DATE_TRUNC('month', fecha_pago) ASC
      `,
      sql`
        SELECT TO_CHAR(fecha_pago, 'FMDy') as name, SUM(monto)::int as value
        FROM pagos WHERE fecha_pago >= ${startOfWeek} AND fecha_pago <= ${endOfDay}
        GROUP BY name, DATE(fecha_pago) ORDER BY DATE(fecha_pago) ASC
      `,

      // 3. Gráficos Asistencia
      sql`
        SELECT EXTRACT(YEAR FROM fecha_entrada)::int as year, TO_CHAR(fecha_entrada, 'FMMon') as name, COUNT(*)::int as value
        FROM asistencia WHERE estado_acceso = 'aprobado' AND fecha_entrada >= NOW() - INTERVAL '1 year'
        GROUP BY year, name, DATE_TRUNC('month', fecha_entrada) ORDER BY DATE_TRUNC('month', fecha_entrada) ASC
      `,
      sql`
        SELECT TO_CHAR(fecha_entrada, 'FMDy') as name, COUNT(*)::int as value
        FROM asistencia WHERE estado_acceso = 'aprobado' AND fecha_entrada >= ${startOfWeek} AND fecha_entrada <= ${endOfDay}
        GROUP BY name, DATE(fecha_entrada) ORDER BY DATE(fecha_entrada) ASC
      `,

      // 4. Membresías
      sql`
        SELECT p.nombre as name, COUNT(DISTINCT m.id_cliente)::int as value 
        FROM membresias m JOIN planes p ON m.id_plan = p.id 
        WHERE m.estado = 'active' AND m.fecha_fin >= CURRENT_DATE GROUP BY p.nombre
      `,
      sql`
        SELECT p.nombre as name, COUNT(m.id)::int as value 
        FROM membresias m JOIN planes p ON m.id_plan = p.id GROUP BY p.nombre
      `,

      // 5. Listas y Mapa de Calor (Sin duplicados)
      sql`
        SELECT COALESCE(c.nombre, col.nombre, e.nombre, 'Usuario') as nombre, a.fecha_entrada, a.estado_acceso
        FROM asistencia a
        LEFT JOIN clientes c ON c.id_usuario = a.id_usuario
        LEFT JOIN colaboradores col ON col.id_usuario = a.id_usuario
        LEFT JOIN entrenadores e ON e.id_usuario = a.id_usuario
        WHERE a.fecha_entrada <= ${endOfDay} ORDER BY a.fecha_entrada DESC LIMIT 5
      `,
      sql`
          SELECT EXTRACT(HOUR FROM fecha_entrada)::int as hora, COUNT(*)::int as cantidad
          FROM asistencia
          WHERE fecha_entrada >= ${startOfDay} AND fecha_entrada <= ${endOfDay} AND estado_acceso = 'aprobado'
          GROUP BY hora ORDER BY hora ASC
      `
    ]);

    return {
      kpi: {
        income: ingresos?.total || 0,
        activeMembers: activos?.total || 0,
        newMembers: nuevos?.total || 0,
        totalClients: totalClientes?.count || 0,
        todayAttendance: asistenciaHoy?.total || 0,
        machinesBroken: maquinasMalas?.total || 0,
      },
      
      chartData: {
        revenueYear: financeHistoryYear,
        revenueWeek: financeHistoryWeek,
        attendanceYear: attendanceHistoryYear,
        attendanceWeek: attendanceHistoryWeek,
        membershipActive: planesActive,
        membershipHistory: planesHistory
      },
      
      recentLogs: ultimosAccesos,
      peakHours: asistenciaPorHora,
    };
  }
}