import { sql } from "../bd.js";

// --- HELPER: Formateador RUT  ---
const formatearRut = (rutRaw) => {
  const valor = rutRaw.replace(/[^0-9kK]/g, "");
  if (valor.length < 2) return rutRaw;
  const cuerpo = valor.slice(0, -1);
  const dv = valor.slice(-1).toUpperCase();
  return `${cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${dv}`;
};

export class AsistenciaModel {
  // 1. OBTENER HISTORIAL
  static async getAll({ year, month, day, type }) {
    let query = sql`
      SELECT 
        a.id, 
        a.fecha_entrada, 
        a.estado_acceso,
        COALESCE(c.nombre, col.nombre, e.nombre, 'Usuario Desconocido') as nombre,
        COALESCE(c.rut, col.rut, e.rut, 'N/A') as rut,
        CASE 
            WHEN c.id IS NOT NULL THEN 'cliente'
            WHEN col.id IS NOT NULL THEN 'staff'
            WHEN e.id IS NOT NULL THEN 'entrenador'
            ELSE 'otro'
        END as tipo_usuario
      FROM asistencia a
      LEFT JOIN clientes c ON a.id_usuario = c.id_usuario
      LEFT JOIN colaboradores col ON a.id_usuario = col.id_usuario
      LEFT JOIN entrenadores e ON a.id_usuario = e.id_usuario
    `;

    const conditions = [];

    if (year && month) {
      if (day) {
        conditions.push(
          sql`DATE(a.fecha_entrada) = ${`${year}-${month}-${day}`}`,
        );
      } else {
        conditions.push(
          sql`EXTRACT(YEAR FROM a.fecha_entrada) = ${year} AND EXTRACT(MONTH FROM a.fecha_entrada) = ${month}`,
        );
      }
    }

    if (type && type !== "all") {
      if (type === "cliente") conditions.push(sql`c.id IS NOT NULL`);
      if (type === "staff") conditions.push(sql`col.id IS NOT NULL`);
      if (type === "entrenador") conditions.push(sql`e.id IS NOT NULL`);
    }

    if (conditions.length > 0) {
      query = sql`${query} WHERE ${conditions.reduce((a, b) => sql`${a} AND ${b}`)}`;
    }

    const limitClause = year && month ? sql`` : sql`LIMIT 100`;
    return await sql`${query} ORDER BY a.fecha_entrada DESC ${limitClause}`;
  }

  // 2. REGISTRAR ACCESO
  static async registrarNuevoAcceso(identificador) {
    return await sql.begin(async (sql) => {
      // A. PREPARACIÓN DE DATOS
      // 1. Versión Formateada (12.345.678-K) - Para estética o coincidencias exactas
      let rutFormateado = identificador;
      if (identificador.length < 20) {
        rutFormateado = formatearRut(identificador);
      }

      // 2. Versión Limpia  PARA COMPARACIÓN INFALIBLE
      // Quitamos puntos, guiones y espacios, y pasamos a mayúscula
      const rutLimpio = identificador.replace(/[^0-9kK]/g, "").toUpperCase();

      console.log(`🔍 Buscando: Fmt="${rutFormateado}" | Clean="${rutLimpio}"`);

      // B. BÚSQUEDA UNIVERSAL (Clientes, Staff, Entrenadores)
      const [usuario] = await sql`
        WITH usuarios_unificados AS (
            SELECT id_usuario, nombre, rut, 'cliente' as tipo, id as perfil_id FROM clientes
            UNION ALL
            SELECT id_usuario, nombre, rut, 'staff' as tipo, id as perfil_id FROM colaboradores
            UNION ALL
            SELECT id_usuario, nombre, rut, 'entrenador' as tipo, id as perfil_id FROM entrenadores
        )
        SELECT * FROM usuarios_unificados
        WHERE 
           -- 1. Coincidencia Exacta (Por si acaso)
           rut = ${rutFormateado} 
           
           -- 2. COINCIDENCIA ROBUSTA (Limpiamos la BD en tiempo real para comparar)
           -- Quitamos puntos (.) y guiones (-) de la columna 'rut' de la base de datos
           OR UPPER(REPLACE(REPLACE(rut, '.', ''), '-', '')) = ${rutLimpio}
           
           -- 3. Coincidencia por ID de Usuario (QR interno)
           OR id_usuario::text = ${identificador}
        LIMIT 1
      `;

      if (!usuario) {
        console.log("No encontrado en ninguna tabla.");
        throw new Error("USUARIO_NO_ENCONTRADO");
      }

      console.log(`Encontrado: ${usuario.nombre} (${usuario.tipo})`);

      // C. VALIDACIÓN DE ACCESO
      let estado_acceso = "denegado";
      let mensaje = "";

      if (usuario.tipo === "cliente") {
        // Lógica Clientes (Membresía)
        const [membresia] = await sql`
            SELECT m.estado, m.fecha_fin, p.nombre as plan
            FROM membresias m
            JOIN planes p ON m.id_plan = p.id
            WHERE m.id_cliente = ${usuario.perfil_id} AND m.estado = 'active'
            ORDER BY m.fecha_fin DESC LIMIT 1
          `;

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        if (!membresia) {
          mensaje = "Sin membresía activa";
        } else if (new Date(membresia.fecha_fin) < hoy) {
          mensaje = "Plan vencido";
        } else {
          estado_acceso = "aprobado";
          mensaje = `Bienvenido ${usuario.nombre}`;
        }
      } else {
        // Lógica Staff/Entrenadores (Pase Libre)
        estado_acceso = "aprobado";
        mensaje = `Hola ${usuario.nombre}`;
      }

      // D. REGISTRAR
      await sql`
        INSERT INTO asistencia (id_usuario, estado_acceso, fecha_entrada)
        VALUES (${usuario.id_usuario}, ${estado_acceso}, CURRENT_TIMESTAMP)
      `;

      return {
        nombre: usuario.nombre,
        tipo: usuario.tipo,
        estado_acceso,
        mensaje,
        // Datos extra para el frontend
        nombre_plan:
          usuario.tipo === "cliente" ? "Sin Plan" : "Personal Interno",
        fecha_fin: null,
      };
    });
  }
}
