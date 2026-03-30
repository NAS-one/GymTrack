import { sql } from "../../Backend/bd.js";

export class DashboardModel {
  static async getSummary() {
    
    // --- LÍMITES DE TIEMPO EXACTOS (MES ACTUAL) ---
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = today; // Momento exacto de la consulta

    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - 6);

    // --- LÍMITES PARA TENDENCIAS (MES PASADO "A LA FECHA") ---
    // Inicio del mes pasado
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    // Mismo día que hoy, pero del mes pasado (para una comparación justa)
    const sameDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate(), today.getHours(), today.getMinutes(), today.getSeconds());

    const [
      // 1. KPIs ACTUALES (Mes actual hasta el segundo exacto de hoy)
      [ingresos],
      [activos],
      [nuevos],
      [totalClientes],
      [asistenciaHoy],
      [maquinasMalas],

      // 1.5 KPIs MES PASADO (Solo hasta el mismo día que hoy para que el % sea real)
      [ingresosMesPasadoMTD],
      [nuevosMesPasadoMTD],

      // 2. Datos para Gráficos y Listas (Estos no cambian para no romper TrendsChart)
      financeHistoryYear,
      financeHistoryWeek,
      attendanceHistoryYear,
      attendanceHistoryWeek,
      planesActive,
      planesHistory,
      ultimosAccesos,
      asistenciaPorHora,
    ] = await Promise.all([
      
      // Consultas Actuales
      sql`SELECT COALESCE(SUM(monto), 0)::int as total FROM pagos WHERE fecha_pago >= ${startOfMonth} AND fecha_pago <= ${endOfDay}`,
      sql`SELECT COUNT(DISTINCT id_cliente)::int as total FROM membresias WHERE estado = 'active' AND fecha_fin >= CURRENT_DATE`,
      sql`SELECT COUNT(*)::int as total FROM clientes WHERE created_at >= ${startOfMonth} AND created_at <= ${endOfDay}`,
      sql`SELECT COUNT(*)::int as count FROM clientes WHERE created_at <= ${endOfDay}`,
      sql`SELECT COUNT(*)::int as total FROM asistencia WHERE fecha_entrada >= ${startOfDay} AND fecha_entrada <= ${endOfDay} AND estado_acceso = 'aprobado'`,
      sql`SELECT COUNT(*)::int as total FROM maquinas WHERE estado != 'operativa' AND fecha_adquisicion <= ${endOfDay}`,

      // Consultas de Comparación (Mes Pasado a la Fecha)
      sql`SELECT COALESCE(SUM(monto), 0)::int as total FROM pagos WHERE fecha_pago >= ${startOfLastMonth} AND fecha_pago <= ${sameDayLastMonth}`,
      sql`SELECT COUNT(*)::int as total FROM clientes WHERE created_at >= ${startOfLastMonth} AND created_at <= ${sameDayLastMonth}`,

      // Consultas Históricas para Gráficos
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
      sql`
        SELECT p.nombre as name, COUNT(DISTINCT m.id_cliente)::int as value 
        FROM membresias m JOIN planes p ON m.id_plan = p.id 
        WHERE m.estado = 'active' AND m.fecha_fin >= CURRENT_DATE GROUP BY p.nombre
      `,
      sql`
        SELECT p.nombre as name, COUNT(m.id)::int as value 
        FROM membresias m JOIN planes p ON m.id_plan = p.id GROUP BY p.nombre
      `,
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

    // --- FUNCIÓN HELPER PARA CALCULAR PORCENTAJE DE CRECIMIENTO ---
    const calculateTrend = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Number((((current - previous) / previous) * 100).toFixed(1));
    };

    const currentIncome = ingresos?.total || 0;
    const prevIncomeMTD = ingresosMesPasadoMTD?.total || 0;
    
    const currentNewMembers = nuevos?.total || 0;
    const prevNewMembersMTD = nuevosMesPasadoMTD?.total || 0;

    return {
      kpi: {
        income: currentIncome,
        incomeTrend: calculateTrend(currentIncome, prevIncomeMTD), // Comparación justa MTD
        
        activeMembers: activos?.total || 0,
        
        newMembers: currentNewMembers,
        newMembersTrend: calculateTrend(currentNewMembers, prevNewMembersMTD), // Comparación justa MTD
        
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