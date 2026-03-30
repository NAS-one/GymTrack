import postgres from "postgres";

const sql = postgres({
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

export class EntrenadorModel {
  // 1. OBTENER TODOS (Con cálculo de sueldo inteligente)
  static async getAll() {
    return await sql`
      SELECT 
        e.id, e.rut, e.nombre, e.especialidad, e.telefono, 
        e.sueldo_base, e.turno,
        e.modelo_contrato, e.porcentaje_retencion, e.tarifa_arriendo,
        u.email, u.username, u.estado,
        
        -- Contar clientes activos asignados
        (
          SELECT COUNT(*)::int 
          FROM clientes c 
          JOIN usuarios uc ON c.id_usuario = uc.id
          WHERE c.id_entrenador = e.id AND uc.estado = 'active'
        ) as carga_clientes,

        -- Calcular Sueldo Estimado según MODELO
        CASE 
            -- A. Sueldo Fijo: Base + Bono por alumno
            WHEN e.modelo_contrato = 'sueldo_fijo' THEN (
                e.sueldo_base + 
                (5000 * (
                    SELECT COUNT(*)::int 
                    FROM clientes c 
                    JOIN usuarios uc ON c.id_usuario = uc.id
                    WHERE c.id_entrenador = e.id AND uc.estado = 'active'
                ))
            )
            -- B. Porcentaje: Suma de lo que le corresponde por sesiones realizadas este mes
            WHEN e.modelo_contrato = 'porcentaje' THEN (
               COALESCE((
                   SELECT SUM(monto_entrenador) 
                   FROM sesiones_entrenador s 
                   WHERE s.id_entrenador = e.id 
                   AND s.estado = 'realizada' 
                   AND EXTRACT(MONTH FROM s.fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
               ), 0)
            )
            -- C. Arriendo: No le pagamos, él nos paga (Retornamos 0 o negativo)
            WHEN e.modelo_contrato = 'arriendo_espacio' THEN 0 
            ELSE 0 
        END as sueldo_estimado

      FROM entrenadores e
      JOIN usuarios u ON e.id_usuario = u.id
      WHERE u.estado = 'active'
      ORDER BY e.nombre ASC
    `;
  }

  // 2. CREAR
  static async create(input) {
    const {
      email,
      password,
      rut,
      nombre,
      especialidad,
      telefono,
      turno,
      // Nuevos campos
      modelo_contrato,
      sueldo_base,
      porcentaje_retencion,
      tarifa_arriendo,
    } = input;

    return await sql.begin(async (sql) => {
      const [role] =
        await sql`SELECT id FROM roles WHERE nombre = 'entrenador'`;
      if (!role) throw new Error("Rol 'entrenador' no configurado");

      let baseUsername = email.split("@")[0];

      const [newUser] = await sql`
        INSERT INTO usuarios (username, password, email, estado, id_rol)
        VALUES (${`t_${baseUsername}`}, ${password}, ${email}, 'active', ${
          role.id
        })
        RETURNING id
      `;

      const [newTrainer] = await sql`
        INSERT INTO entrenadores (
            rut, nombre, especialidad, telefono, id_usuario, turno,
            modelo_contrato, sueldo_base, porcentaje_retencion, tarifa_arriendo
        )
        VALUES (
            ${rut}, ${nombre}, ${especialidad}, ${telefono}, ${newUser.id}, ${
              turno || "Mañana"
            },
            ${modelo_contrato || "sueldo_fijo"}, 
            ${sueldo_base || 0}, 
            ${porcentaje_retencion || 0}, 
            ${tarifa_arriendo || 0}
        )
        RETURNING *
      `;

      return { ...newUser, ...newTrainer };
    });
  }

  // 3. ACTUALIZAR
  static async update({ id, input }) {
    const {
      nombre,
      rut,
      especialidad,
      telefono,
      turno,
      modelo_contrato,
      sueldo_base,
      porcentaje_retencion,
      tarifa_arriendo,
    } = input;

    try {
      const [updatedTrainer] = await sql`
        UPDATE entrenadores 
        SET 
          nombre = COALESCE(${nombre}, nombre),
          rut = COALESCE(${rut}, rut),
          especialidad = COALESCE(${especialidad}, especialidad),
          telefono = COALESCE(${telefono}, telefono),
          turno = COALESCE(${turno}, turno),
          -- Nuevos campos
          modelo_contrato = COALESCE(${modelo_contrato}, modelo_contrato),
          sueldo_base = COALESCE(${sueldo_base}, sueldo_base),
          porcentaje_retencion = COALESCE(${porcentaje_retencion}, porcentaje_retencion),
          tarifa_arriendo = COALESCE(${tarifa_arriendo}, tarifa_arriendo)
        WHERE id = ${id}
        RETURNING *
      `;
      return updatedTrainer;
    } catch (error) {
      if (error.code === "23505") throw new Error("El RUT ya está registrado");
      throw error;
    }
  }

  // 4. ELIMINAR (Deshabilitar)
  static async delete({ id }) {
    const [disabledUser] = await sql`
      UPDATE usuarios
      SET estado = 'inactive'
      FROM entrenadores
      WHERE usuarios.id = entrenadores.id_usuario
      AND entrenadores.id = ${id}
      RETURNING usuarios.id
    `;
    return !!disabledUser;
  }

  // 5. OBTENER DETALLE Y ESTADÍSTICAS AVANZADAS (CORREGIDO)
  static async getStats({ id }) {
    // A. Datos del Entrenador
    const [perfil] = await sql`
      SELECT 
        e.*, u.email, u.estado,
        (SELECT COUNT(*)::int FROM clientes c WHERE c.id_entrenador = e.id) as total_clientes_asignados
      FROM entrenadores e
      JOIN usuarios u ON e.id_usuario = u.id
      WHERE e.id = ${id}
    `;

    if (!perfil) return null; // Validación de seguridad

    // B. Lista de clientes
    const clientes = await sql`
      SELECT 
        c.id, c.nombre, c.rut, p.nombre as tipo_plan, m.fecha_fin, m.estado as estado_membresia
      FROM clientes c
      LEFT JOIN membresias m ON m.id_cliente = c.id AND m.estado = 'active'
      LEFT JOIN planes p ON m.id_plan = p.id
      WHERE c.id_entrenador = ${id}
    `;

    // C. HISTORIAL FINANCIERO (CORREGIDO: Casting explícito)
    const historial = await sql`
      WITH meses AS (
          SELECT generate_series(
              DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months',
              DATE_TRUNC('month', CURRENT_DATE),
              '1 month'::interval
          ) as mes
      )
      SELECT 
          TO_CHAR(m.mes, 'Mon') as nombre_mes,
          
          -- 1. Ingresos Generados
          COALESCE((
              SELECT SUM(p.monto)
              FROM pagos p
              JOIN membresias mem ON p.id_membresia = mem.id
              JOIN clientes c ON mem.id_cliente = c.id
              WHERE c.id_entrenador = ${id}
              AND DATE_TRUNC('month', p.fecha_pago) = m.mes
          ), 0)::int as ingreso_generado,

          -- 2. Costo Entrenador
          CASE 
              WHEN ${perfil.modelo_contrato} = 'sueldo_fijo' THEN ${perfil.sueldo_base}
              
              WHEN ${perfil.modelo_contrato} = 'arriendo_espacio' THEN 0
              
              WHEN ${perfil.modelo_contrato} = 'porcentaje' THEN 
                  (COALESCE((
                      SELECT SUM(p.monto)
                      FROM pagos p
                      JOIN membresias mem ON p.id_membresia = mem.id
                      JOIN clientes c ON mem.id_cliente = c.id
                      WHERE c.id_entrenador = ${id}
                      AND DATE_TRUNC('month', p.fecha_pago) = m.mes
                  ), 0) * (1 - ${perfil.porcentaje_retencion}::numeric))::int -- 👈 AQUÍ ESTÁ EL FIX (::numeric)
              ELSE 0
          END as costo_entrenador

      FROM meses m
      ORDER BY m.mes ASC
    `;

    return { perfil, clientes, historial };
  }

  // 6. REASIGNACIÓN
  static async reassignClients({ oldTrainerId, newTrainerId }) {
    const result = await sql`
      UPDATE clientes
      SET id_entrenador = ${newTrainerId}
      WHERE id_entrenador = ${oldTrainerId}
      RETURNING id
    `;
    return result.length;
  }

  //7. Obtener resumen para dashboard
  static async getDashboardSummary({ id_usuario }) {
    //Primer, cruzamos el ID del usuario con el de entrenadores
    //para saber que entrenador  es el que mira la pantalla
    const [entrenador] = await sql`
      SELECT id
      FROM entrenadores
      WHERE id_usuario = ${id_usuario}
      `;
    //Si la cuenta no es de un entrenador, detenemos todo aqui
    if (!entrenador) return null;

    const id_entrenador = entrenador.id;
    //En vez de usar 4 "await" que suma tiempo de carga
    //usamos promise.all para disparar todas las consultas a Postgres al mismo instante.
    const [[alumnosResult], [rutinasResult], [asistenciaResult], logsResult] =
      await Promise.all([
        //Consulta 1 : ¿Cuantos clientes tiene a su cargo?
        sql`
        SELECT COUNT(*)::int  as total
        FROM clientes
        WHERE id_entrenador = ${id_entrenador}`,

        //Consulta 2: ¿Cuantas rutinas a creado y estan vigentes?
        sql`
        SELECT COUNT(*)::int as total
        FROM rutinas
        WHERE id_entrenador = ${id_entrenador} AND activa = true`,

        //Consulta 3: ¿ Cuantos alumnos vinieron al gimnasio hoy?
        sql`
        SELECT COUNT (DISTINCT a.id_usuario)::int as total
        FROM asistencia a
        JOIN clientes c ON a.id_usuario = c.id_usuario
        WHERE c.id_entrenador = ${id_entrenador}
        AND DATE(a.fecha_entrada) = CURRENT_DATE`,

        //Consulta 4: El "LiveFeed" o actividades recientes.
        sql`
        SELECT c.nombre as cliente, a.fecha_entrada as fecha
        FROM asistencia a
        JOIN clientes c ON a.id_usuario = c.id_usuario
        WHERE c.id_entrenador = ${id_entrenador}
        ORDER BY a.fecha_entrada DESC
        LIMIT 5`,
      ]);

    //Adaptamos el array de logs devuelto por SQL para que los componentes
    //visuales de React lo puedan leer directamente.
    const recentLogs = logsResult.map((log) => ({
      text: `${log.cliente} registró su ingreso`,
      time: log.fecha,
    }));

    return {
      kpi: {
        misAlumnos: alumnosResult.total || 0,
        sugerenciasIA: 0, //Lo dejamos en 0 hasta que implementemos la IA
        asistenciaHoy: asistenciaResult.total || 0,
        rutinasActivas: rutinasResult.total || 0,
      },
      recentLogs,
    };
  } // <-- Aquí termina getDashboardSummary

  // ==========================================
  // 8. OBTENER LISTA DE "MIS ALUMNOS" (CORREGIDO)
  // ==========================================
  static async getMisAlumnos({ id_usuario }) {
    // 1. Obtenemos el ID del entrenador
    const [entrenador] =
      await sql`SELECT id FROM entrenadores WHERE id_usuario = ${id_usuario}`;
    if (!entrenador) return null;

    // 2. Traemos a los clientes filtrando duplicados del historial
    return await sql`
      WITH ClientesUnicos AS (
        SELECT DISTINCT ON (c.id)
          c.id, 
          c.nombre, 
          c.rut,
          u.email,
          c.fecha_nacimiento,
          c.genero,
          c.direccion,
          c.objetivo,
          COALESCE(p.nombre, 'Sin Plan Vigente') as plan,
          COALESCE(m.estado, 'inactive') as estado,
          m.fecha_fin as vencimiento_plan
        FROM clientes c
        JOIN usuarios u ON c.id_usuario = u.id
        LEFT JOIN membresias m ON m.id_cliente = c.id AND m.estado = 'active'
        LEFT JOIN planes p ON m.id_plan = p.id
        WHERE c.id_entrenador = ${entrenador.id}
        ORDER BY c.id, m.fecha_fin DESC
      )
      SELECT * FROM ClientesUnicos ORDER BY nombre ASC;
    `;
  }
}
