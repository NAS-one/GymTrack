import { sql } from "../bd.js";

export class ClienteModel {
  // 1. OBTENER TODOS
  static async getAll() {
    return await sql`
      SELECT 
        c.id, c.rut, c.nombre, c.objetivo, c.fecha_nacimiento, c.genero, c.direccion,
        u.email, u.estado as estado_usuario,
        e.nombre as nombre_entrenador,
        
        -- SUBCONSULTA INTELIGENTE:
        -- Ordenamos primero por si es 'active' (true va antes que false en desc), 
        -- y luego por fecha. Así la activa siempre gana.
        (
            SELECT m.estado 
            FROM membresias m 
            WHERE m.id_cliente = c.id 
            ORDER BY (m.estado = 'active') DESC, m.fecha_fin DESC 
            LIMIT 1
        ) as estado_membresia,
        
        (
            SELECT m.fecha_fin 
            FROM membresias m 
            WHERE m.id_cliente = c.id 
            ORDER BY (m.estado = 'active') DESC, m.fecha_fin DESC 
            LIMIT 1
        ) as vencimiento_plan

      FROM clientes c
      JOIN usuarios u ON c.id_usuario = u.id
      LEFT JOIN entrenadores e ON c.id_entrenador = e.id
      WHERE u.estado != 'inactive'
      ORDER BY c.created_at DESC
    `;
  }

  // 2. CREAR
  static async create(input) {
    const {
      rut,
      nombre,
      email,
      password,
      id_entrenador,
      objetivo,
      fecha_nacimiento,
      genero,
      direccion,
    } = input;

    return await sql.begin(async (sql) => {
      // Obtener rol
      const [role] = await sql`SELECT id FROM roles WHERE nombre = 'cliente'`;
      if (!role) throw new Error("Rol 'cliente' no existe en la BD");

      // Crear Usuario
      const baseUsername = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
      const [newUser] = await sql`
        INSERT INTO usuarios (username, email, password, estado, id_rol)
        VALUES (${baseUsername}, ${email}, ${password}, 'pendiente', ${role.id})
        RETURNING id
      `;

      // Crear Cliente
      const [newClient] = await sql`
        INSERT INTO clientes (rut, nombre, objetivo, id_usuario, id_entrenador, fecha_nacimiento, genero, direccion)
        VALUES (${rut}, ${nombre}, ${objetivo}, ${newUser.id}, ${id_entrenador || null}, ${fecha_nacimiento || null}, ${genero || null}, ${direccion || null})
        RETURNING *
      `;

      return newClient;
    });
  }

  // 3. ACTUALIZAR
  static async update({ id, input }) {
    const {
      nombre,
      rut,
      objetivo,
      id_entrenador,
      fecha_nacimiento,
      genero,
      direccion,
    } = input;

    const [updatedClient] = await sql`
      UPDATE clientes 
      SET 
        nombre = COALESCE(${nombre}, nombre),
        rut = COALESCE(${rut}, rut),
        objetivo = COALESCE(${objetivo}, objetivo),
        id_entrenador = COALESCE(${id_entrenador}, id_entrenador),
        fecha_nacimiento = COALESCE(${fecha_nacimiento}, fecha_nacimiento),
        genero = COALESCE(${genero}, genero),
        direccion = COALESCE(${direccion}, direccion)
      WHERE id = ${id}
      RETURNING *
    `;
    return updatedClient;
  }

  // 4. ELIMINAR (Soft Delete)
  static async delete({ id }) {
    // Desactivamos el usuario asociado
    const [disabledUser] = await sql`
      UPDATE usuarios SET estado = 'inactive'
      FROM clientes
      WHERE usuarios.id = clientes.id_usuario AND clientes.id = ${id}
      RETURNING usuarios.id
    `;
    return !!disabledUser;
  }

  // 5. OBTENER PERFIL 360 (Corregido para Asistencia Universal)
  static async getStats({ id }) {
    // Primero obtenemos el id_usuario del cliente para buscar su asistencia
    const [cliente] =
      await sql`SELECT id_usuario FROM clientes WHERE id = ${id}`;
    if (!cliente) throw new Error("Cliente no encontrado");

    const [pagos, medidas, asistencia, planesDisponibles, rutina] =
      await Promise.all([
        // A. Historial de Pagos
        sql`
        SELECT p.monto, p.metodo_pago, p.fecha_pago, pl.nombre as tipo_plan
        FROM pagos p
        JOIN membresias m ON p.id_membresia = m.id
        LEFT JOIN planes pl ON m.id_plan = pl.id
        WHERE m.id_cliente = ${id}
        ORDER BY p.fecha_pago DESC LIMIT 10
      `,
        // B. Evolución Física (Mantenemos SELECT * para traer los nuevos campos de medidas)
        sql`SELECT * FROM medidas_fisicas WHERE id_cliente = ${id} ORDER BY fecha_registro ASC`,

        // C. Asistencia (CORREGIDO: Usamos id_usuario)
        sql`
        SELECT fecha_entrada 
        FROM asistencia 
        WHERE id_usuario = ${cliente.id_usuario} 
        AND fecha_entrada > NOW() - INTERVAL '6 months' 
        ORDER BY fecha_entrada ASC
      `,

        // D. Planes Disponibles (Para el select de renovación)
        sql`SELECT id, nombre, precio, duracion_meses FROM planes WHERE estado = 'active' ORDER BY precio ASC`,

        // E. Rutina activa real
        sql`SELECT r.nombre as nombre_rutina,
      r.fecha_inicio,
      dr.dia,
      e.grupo_muscular as musculo,
      e.nombre as ejercicio,
      dr.series,
      dr.repeticiones as reps,
      dr.carga_proyectada as carga
      FROM rutinas r
      JOIN detalle_rutina dr ON r.id = dr.id_rutina
      JOIN ejercicios e ON dr.id_ejercicio = e.id
      WHERE r.id_cliente = ${id} AND r.activa = true
      ORDER BY
        CASE dr.dia
            WHEN 'Lunes' THEN 1 WHEN 'Martes' THEN 2 WHEN 'Miércoles' THEN 3
            WHEN 'Jueves' THEN 4 WHEN 'Viernes' THEN 5 WHEN 'Sábado' THEN 6 WHEN 'Domingo' THEN 7
            ELSE 8
          END`,
      ]);

    return {
      pagos,
      medidas,
      asistencia,
      planesDisponibles,
      rutinaActual: rutina,
    };
  }

  // Registrar nuevas medidas fisicas
  static async addMedidas({
    id_cliente,
    peso,
    altura,
    porcentaje_grasa,
    circunferencia_cintura,
  }) {
    const [nuevaMedida] = await sql`
      INSERT INTO medidas_fisicas (
        id_cliente, 
        peso, 
        altura, 
        porcentaje_grasa, 
        circunferencia_cintura,
        fecha_registro
      ) VALUES (
        ${id_cliente}, 
        ${peso}, 
        ${altura}, 
        ${porcentaje_grasa}, 
        ${circunferencia_cintura},
        CURRENT_DATE
      )
      RETURNING *
    `;
    return nuevaMedida;
  }
}
