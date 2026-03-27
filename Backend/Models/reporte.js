import { sql } from "../../Backend/bd.js";

export class ReporteModel {
  static getAll = async () => {
    return await sql`SELECT * FROM reportes ORDER BY fecha_generacion DESC`;
  };

  static getAdminByUserId = async (id_usuario) => {
    return await sql`SELECT id FROM administradores WHERE id_usuario = ${id_usuario}`;
  };

  // --- FINANZAS CON MÚLTIPLES FILTROS ---
  static getFinanzasData = async (inicio, fin, metodoPago) => {
    let query = sql`
      SELECT p.fecha_pago, p.monto, p.metodo_pago, m.estado as estado_membresia, c.nombre as cliente 
      FROM pagos p
      JOIN membresias m ON p.id_membresia = m.id
      JOIN clientes c ON m.id_cliente = c.id
      WHERE p.fecha_pago >= ${inicio} AND p.fecha_pago <= ${fin}
    `;
    
    // Si eligió un método de pago específico, agregamos la condición
    if (metodoPago && metodoPago !== 'todos') {
      query = sql`${query} AND p.metodo_pago = ${metodoPago}`;
    }
    
    return await query;
  };

  // --- ASISTENCIA CON FILTRO DE HORAS ---
  static getAsistenciaData = async (inicio, fin, estadoAcceso, jornada) => {
    let query = sql`
      SELECT fecha_entrada, estado_acceso, TO_CHAR(fecha_entrada, 'HH24:MI:SS') as hora 
      FROM asistencia 
      WHERE fecha_entrada >= ${inicio} AND fecha_entrada <= ${fin}
    `;

    if (estadoAcceso && estadoAcceso !== 'todos') {
      query = sql`${query} AND estado_acceso = ${estadoAcceso}`;
    }

    // Filtrar por Mañana (06:00-14:00) o Tarde (14:00-22:00) usando EXTRACT
    if (jornada === 'mañana') {
      query = sql`${query} AND EXTRACT(HOUR FROM fecha_entrada) BETWEEN 6 AND 13`;
    } else if (jornada === 'tarde') {
      query = sql`${query} AND EXTRACT(HOUR FROM fecha_entrada) BETWEEN 14 AND 22`;
    }

    return await query;
  };

  // --- INVENTARIO ---
  static getInventarioData = async (estadoMaquina) => {
    if (estadoMaquina && estadoMaquina !== 'todos') {
      return await sql`SELECT nombre, marca, codigo_serie, estado, fecha_adquisicion FROM maquinas WHERE estado = ${estadoMaquina}`;
    }
    return await sql`SELECT nombre, marca, codigo_serie, estado, fecha_adquisicion FROM maquinas`;
  };

// --- CLIENTES / COMUNIDAD ---
  static getClientesData = async (estado) => {
    // 🌟 Forma 100% segura para postgres.js: Declarar la consulta completa según el caso
    
    if (estado === 'active') {
      return await sql`
        SELECT 
            c.nombre, 
            c.rut, 
            c.email, 
            COALESCE(m.estado, 'Sin Plan') as estado_membresia,
            TO_CHAR(m.fecha_fin, 'DD/MM/YYYY') as vencimiento_plan,
            COALESCE(e.nombre, 'Sin Entrenador') as entrenador_asignado
        FROM clientes c
        LEFT JOIN membresias m ON c.id = m.id_cliente
        LEFT JOIN entrenadores e ON c.id_entrenador = e.id
        WHERE m.estado = 'active' AND m.fecha_fin >= CURRENT_DATE
      `;
    } 
    
    if (estado === 'expired') {
      return await sql`
        SELECT 
            c.nombre, 
            c.rut, 
            c.email, 
            COALESCE(m.estado, 'Sin Plan') as estado_membresia,
            TO_CHAR(m.fecha_fin, 'DD/MM/YYYY') as vencimiento_plan,
            COALESCE(e.nombre, 'Sin Entrenador') as entrenador_asignado
        FROM clientes c
        LEFT JOIN membresias m ON c.id = m.id_cliente
        LEFT JOIN entrenadores e ON c.id_entrenador = e.id
        WHERE m.estado = 'active' AND m.fecha_fin < CURRENT_DATE
      `;
    } 
    
    if (estado === 'none') {
      return await sql`
        SELECT 
            c.nombre, 
            c.rut, 
            c.email, 
            COALESCE(m.estado, 'Sin Plan') as estado_membresia,
            TO_CHAR(m.fecha_fin, 'DD/MM/YYYY') as vencimiento_plan,
            COALESCE(e.nombre, 'Sin Entrenador') as entrenador_asignado
        FROM clientes c
        LEFT JOIN membresias m ON c.id = m.id_cliente
        LEFT JOIN entrenadores e ON c.id_entrenador = e.id
        WHERE m.estado IS NULL OR m.estado != 'active'
      `;
    }

    // Por defecto (estado === 'all')
    return await sql`
      SELECT 
          c.nombre, 
          c.rut, 
          c.email, 
          COALESCE(m.estado, 'Sin Plan') as estado_membresia,
          TO_CHAR(m.fecha_fin, 'DD/MM/YYYY') as vencimiento_plan,
          COALESCE(e.nombre, 'Sin Entrenador') as entrenador_asignado
      FROM clientes c
      LEFT JOIN membresias m ON c.id = m.id_cliente
      LEFT JOIN entrenadores e ON c.id_entrenador = e.id
    `;
  };

  static create = async (input) => {
    const { titulo, tipo, contenido, id_administrador } = input;
    const [reporte] = await sql`
      INSERT INTO reportes (titulo, tipo, contenido, id_administrador)
      VALUES (${titulo}, ${tipo}, ${sql.json(contenido)}, ${id_administrador})
      RETURNING *
    `;
    return reporte;
  };


  static delete = async (id) => {
    return await sql`DELETE FROM reportes WHERE id = ${id}`;
  };
}