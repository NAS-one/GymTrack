import { sql } from "../bd.js";

export class ReporteModel {
  static getAll = async () => {
    return await sql`SELECT * FROM reportes ORDER BY fecha_generacion DESC`;
  };

  static getAdminByUserId = async (id_usuario) => {
    return await sql`SELECT id FROM administradores WHERE id_usuario = ${id_usuario}`;
  };

  // ==========================================
  // 1. FINANZAS
  // ==========================================
  static getFinanzasData = async (inicio, fin, metodoPago) => {
    if (metodoPago && metodoPago !== 'todos') {
      return await sql`
        SELECT TO_CHAR(p.fecha_pago, 'DD/MM/YYYY HH24:MI') as "Fecha de Pago", p.monto as "Monto Ingresado", p.metodo_pago as "Vía de Pago", c.nombre as "Cliente Emisor"
        FROM pagos p JOIN membresias m ON p.id_membresia = m.id JOIN clientes c ON m.id_cliente = c.id
        WHERE p.fecha_pago >= ${inicio} AND p.fecha_pago <= ${fin} AND p.metodo_pago = ${metodoPago}
      `;
    }
    return await sql`
      SELECT TO_CHAR(p.fecha_pago, 'DD/MM/YYYY HH24:MI') as "Fecha de Pago", p.monto as "Monto Ingresado", p.metodo_pago as "Vía de Pago", c.nombre as "Cliente Emisor"
      FROM pagos p JOIN membresias m ON p.id_membresia = m.id JOIN clientes c ON m.id_cliente = c.id
      WHERE p.fecha_pago >= ${inicio} AND p.fecha_pago <= ${fin}
    `;
  };

  // ==========================================
  // 2. ASISTENCIA
  // ==========================================
  static getAsistenciaData = async (inicio, fin, jornada) => {
    if (jornada === 'mañana') {
      return await sql`
        SELECT TO_CHAR(fecha_entrada, 'DD/MM/YYYY') as "Fecha", TO_CHAR(fecha_entrada, 'HH24:MI:SS') as "Hora Acceso", estado_acceso as "Estado Resolutivo"
        FROM asistencia 
        WHERE fecha_entrada >= ${inicio} AND fecha_entrada <= ${fin} AND EXTRACT(HOUR FROM fecha_entrada) BETWEEN 6 AND 13
      `;
    } else if (jornada === 'tarde') {
      return await sql`
        SELECT TO_CHAR(fecha_entrada, 'DD/MM/YYYY') as "Fecha", TO_CHAR(fecha_entrada, 'HH24:MI:SS') as "Hora Acceso", estado_acceso as "Estado Resolutivo"
        FROM asistencia 
        WHERE fecha_entrada >= ${inicio} AND fecha_entrada <= ${fin} AND EXTRACT(HOUR FROM fecha_entrada) BETWEEN 14 AND 22
      `;
    }
    return await sql`
      SELECT TO_CHAR(fecha_entrada, 'DD/MM/YYYY') as "Fecha", TO_CHAR(fecha_entrada, 'HH24:MI:SS') as "Hora Acceso", estado_acceso as "Estado Resolutivo"
      FROM asistencia 
      WHERE fecha_entrada >= ${inicio} AND fecha_entrada <= ${fin}
    `;
  };

  // ==========================================
  // 3. INVENTARIO
  // ==========================================
  static getInventarioData = async (inicio, fin, estadoMaquina) => {
    if (estadoMaquina && estadoMaquina !== 'todos') {
      return await sql`
        SELECT nombre as "Maquinaria / Equipo", marca as "Fabricante", codigo_serie as "N° Serie", estado as "Condición Actual", TO_CHAR(fecha_adquisicion, 'DD/MM/YYYY') as "Fecha Ingreso Inventario"
        FROM maquinas 
        WHERE fecha_adquisicion >= ${inicio} AND fecha_adquisicion <= ${fin} AND estado = ${estadoMaquina}
      `;
    }
    return await sql`
      SELECT nombre as "Maquinaria / Equipo", marca as "Fabricante", codigo_serie as "N° Serie", estado as "Condición Actual", TO_CHAR(fecha_adquisicion, 'DD/MM/YYYY') as "Fecha Ingreso Inventario"
      FROM maquinas 
      WHERE fecha_adquisicion >= ${inicio} AND fecha_adquisicion <= ${fin}
    `;
  };

  // ==========================================
  // 4. COMUNIDAD / CLIENTES
  // ==========================================
  static getClientesData = async (inicio, fin, estado) => {
    // ⚠️ ATENCIÓN: Si tu base de datos NO tiene la columna "created_at", el servidor dará error 500.
    // Si ese es el caso, simplemente borra la línea que dice "WHERE c.created_at >= ${inicio}..." de aquí abajo.
    
    if (estado === 'active') {
      return await sql`
        SELECT c.nombre as "Nombre del Socio", c.rut as "RUT", c.email as "Correo Electrónico", 'Vigente' as "Estado Actual", TO_CHAR(m.fecha_fin, 'DD/MM/YYYY') as "Vencimiento", COALESCE(e.nombre, 'No Asignado') as "Entrenador Personal"
        FROM clientes c LEFT JOIN membresias m ON c.id = m.id_cliente LEFT JOIN entrenadores e ON c.id_entrenador = e.id
        WHERE c.created_at >= ${inicio} AND c.created_at <= ${fin} AND m.estado = 'active' AND m.fecha_fin >= CURRENT_DATE
      `;
    } else if (estado === 'expired') {
      return await sql`
        SELECT c.nombre as "Nombre del Socio", c.rut as "RUT", c.email as "Correo Electrónico", 'Vencido' as "Estado Actual", TO_CHAR(m.fecha_fin, 'DD/MM/YYYY') as "Vencimiento", COALESCE(e.nombre, 'No Asignado') as "Entrenador Personal"
        FROM clientes c LEFT JOIN membresias m ON c.id = m.id_cliente LEFT JOIN entrenadores e ON c.id_entrenador = e.id
        WHERE c.created_at >= ${inicio} AND c.created_at <= ${fin} AND m.estado = 'active' AND m.fecha_fin < CURRENT_DATE
      `;
    } else if (estado === 'none') {
      return await sql`
        SELECT c.nombre as "Nombre del Socio", c.rut as "RUT", c.email as "Correo Electrónico", 'Sin Plan' as "Estado Actual", 'N/A' as "Vencimiento", COALESCE(e.nombre, 'No Asignado') as "Entrenador Personal"
        FROM clientes c LEFT JOIN membresias m ON c.id = m.id_cliente LEFT JOIN entrenadores e ON c.id_entrenador = e.id
        WHERE c.created_at >= ${inicio} AND c.created_at <= ${fin} AND (m.estado IS NULL OR m.estado != 'active')
      `;
    } 
    
    return await sql`
      SELECT c.nombre as "Nombre del Socio", c.rut as "RUT", c.email as "Correo Electrónico", COALESCE(m.estado, 'Sin Plan') as "Estado Actual", COALESCE(TO_CHAR(m.fecha_fin, 'DD/MM/YYYY'), 'N/A') as "Vencimiento", COALESCE(e.nombre, 'No Asignado') as "Entrenador Personal"
      FROM clientes c LEFT JOIN membresias m ON c.id = m.id_cliente LEFT JOIN entrenadores e ON c.id_entrenador = e.id
      WHERE c.created_at >= ${inicio} AND c.created_at <= ${fin}
    `;
  };

  // ==========================================
  // 5. RENDIMIENTO DE PLANES
  // ==========================================
  static getPlanesData = async (inicio, fin, filtro) => {
    if (filtro === 'activos') {
      return await sql`
        SELECT p.nombre as "Categoría del Plan", p.duracion_meses as "Cobertura (Meses)", p.precio as "Tarifa Base", COUNT(m.id) as "Volumen de Ventas", COALESCE(SUM(pa.monto), 0) as "Capital Generado"
        FROM planes p LEFT JOIN membresias m ON p.id = m.id_plan AND m.fecha_inicio >= ${inicio} AND m.fecha_inicio <= ${fin} LEFT JOIN pagos pa ON m.id = pa.id_membresia
        GROUP BY p.id, p.nombre, p.duracion_meses, p.precio HAVING COUNT(m.id) > 0 ORDER BY "Capital Generado" DESC
      `;
    } else if (filtro === 'populares') {
      return await sql`
        SELECT p.nombre as "Categoría del Plan", p.duracion_meses as "Cobertura (Meses)", p.precio as "Tarifa Base", COUNT(m.id) as "Volumen de Ventas", COALESCE(SUM(pa.monto), 0) as "Capital Generado"
        FROM planes p LEFT JOIN membresias m ON p.id = m.id_plan AND m.fecha_inicio >= ${inicio} AND m.fecha_inicio <= ${fin} LEFT JOIN pagos pa ON m.id = pa.id_membresia
        GROUP BY p.id, p.nombre, p.duracion_meses, p.precio ORDER BY "Volumen de Ventas" DESC LIMIT 5
      `;
    }
    return await sql`
      SELECT p.nombre as "Categoría del Plan", p.duracion_meses as "Cobertura (Meses)", p.precio as "Tarifa Base", COUNT(m.id) as "Volumen de Ventas", COALESCE(SUM(pa.monto), 0) as "Capital Generado"
      FROM planes p LEFT JOIN membresias m ON p.id = m.id_plan AND m.fecha_inicio >= ${inicio} AND m.fecha_inicio <= ${fin} LEFT JOIN pagos pa ON m.id = pa.id_membresia
      GROUP BY p.id, p.nombre, p.duracion_meses, p.precio ORDER BY "Volumen de Ventas" DESC
    `;
  };

  // ==========================================
  // 6. EFICIENCIA DE ENTRENADORES
  // ==========================================
  static getEntrenadoresData = async (inicio, fin, filtro) => {
    if (filtro === 'sueldo_fijo') {
      return await sql`
        SELECT e.nombre as "Profesional Asignado", e.especialidad as "Área de Expertise", e.modelo_contrato as "Acuerdo Comercial", e.sueldo_base as "Remuneración Fija", COUNT(c.id) as "Cartera de Clientes"
        FROM entrenadores e LEFT JOIN clientes c ON e.id = c.id_entrenador AND c.created_at >= ${inicio} AND c.created_at <= ${fin}
        WHERE e.created_at <= CURRENT_DATE AND e.modelo_contrato = 'sueldo_fijo'
        GROUP BY e.id, e.nombre, e.especialidad, e.modelo_contrato, e.sueldo_base ORDER BY "Cartera de Clientes" DESC
      `;
    } else if (filtro === 'porcentaje') {
      return await sql`
        SELECT e.nombre as "Profesional Asignado", e.especialidad as "Área de Expertise", e.modelo_contrato as "Acuerdo Comercial", e.sueldo_base as "Remuneración Fija", COUNT(c.id) as "Cartera de Clientes"
        FROM entrenadores e LEFT JOIN clientes c ON e.id = c.id_entrenador AND c.created_at >= ${inicio} AND c.created_at <= ${fin}
        WHERE e.created_at <= CURRENT_DATE AND e.modelo_contrato = 'porcentaje'
        GROUP BY e.id, e.nombre, e.especialidad, e.modelo_contrato, e.sueldo_base ORDER BY "Cartera de Clientes" DESC
      `;
    }
    return await sql`
      SELECT e.nombre as "Profesional Asignado", e.especialidad as "Área de Expertise", e.modelo_contrato as "Acuerdo Comercial", e.sueldo_base as "Remuneración Fija", COUNT(c.id) as "Cartera de Clientes"
      FROM entrenadores e LEFT JOIN clientes c ON e.id = c.id_entrenador AND c.created_at >= ${inicio} AND c.created_at <= ${fin}
      WHERE e.created_at <= CURRENT_DATE 
      GROUP BY e.id, e.nombre, e.especialidad, e.modelo_contrato, e.sueldo_base ORDER BY "Cartera de Clientes" DESC
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