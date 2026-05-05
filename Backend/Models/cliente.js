import { sql } from "../bd.js";

export class ClienteModel {

    // HELPER: Dado un id (puede ser id_cliente o id_usuario), devuelve el id_cliente real.
    // Si el id ya corresponde a un cliente, devuelve null (no hace nada).
    // Si corresponde a un usuario, devuelve el id_cliente asociado.
    static async findIdByUserId(id) {
        // ¿Existe un cliente con ese id directamente?
        const [asCliente] = await sql`SELECT id FROM clientes WHERE id = ${id}`;
        if (asCliente) return null; // ya es un id_cliente válido, no necesita conversión

        // ¿Existe un cliente con ese id_usuario?
        const [asUsuario] = await sql`SELECT id FROM clientes WHERE id_usuario = ${id}`;
        return asUsuario ? asUsuario.id : null;
    }


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
            fecha_nacimiento,
            genero,
            direccion,
            email,
        } = input;

        // id_entrenador necesita tratamiento especial:
        // COALESCE(null, valor) -> devuelve el valor anterior (nunca puede quedar en null)
        // Solución: si viene en el payload (incluso como null), lo seteamos directamente.
        const entrenadorVino = Object.prototype.hasOwnProperty.call(input, 'id_entrenador');
        const nuevoEntrenador = entrenadorVino ? (input.id_entrenador ?? null) : 'KEEP';

        let updatedClient;

        if (nuevoEntrenador === 'KEEP') {
            // No vino id_entrenador en el payload → conservar el actual
            [updatedClient] = await sql`
          UPDATE clientes SET
            nombre           = COALESCE(${nombre ?? null}, nombre),
            rut              = COALESCE(${rut ?? null}, rut),
            objetivo         = COALESCE(${objetivo ?? null}, objetivo),
            fecha_nacimiento = COALESCE(${fecha_nacimiento ?? null}, fecha_nacimiento),
            genero           = COALESCE(${genero ?? null}, genero),
            direccion        = COALESCE(${direccion ?? null}, direccion)
          WHERE id = ${id}
          RETURNING *
        `;
        } else {
            // Vino id_entrenador (puede ser null para desvincular)
            [updatedClient] = await sql`
          UPDATE clientes SET
            nombre           = COALESCE(${nombre ?? null}, nombre),
            rut              = COALESCE(${rut ?? null}, rut),
            objetivo         = COALESCE(${objetivo ?? null}, objetivo),
            id_entrenador    = ${nuevoEntrenador},
            fecha_nacimiento = COALESCE(${fecha_nacimiento ?? null}, fecha_nacimiento),
            genero           = COALESCE(${genero ?? null}, genero),
            direccion        = COALESCE(${direccion ?? null}, direccion)
          WHERE id = ${id}
          RETURNING *
        `;
        }

        // Actualizar email en la tabla usuarios si fue enviado
        if (email) {
            await sql`
          UPDATE usuarios SET email = ${email}
          FROM clientes
          WHERE usuarios.id = clientes.id_usuario AND clientes.id = ${id}
        `;
        }

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
        // Intentar buscar por id de cliente primero, luego por id_usuario
        let clienteRecords = await sql`SELECT id, id_usuario FROM clientes WHERE id = ${id}`;
        
        if (clienteRecords.length === 0) {
            clienteRecords = await sql`SELECT id, id_usuario FROM clientes WHERE id_usuario = ${id}`;
        }

        const cliente = clienteRecords[0];
        if (!cliente) throw new Error("Cliente no encontrado");

        const resolvedId = cliente.id; // El id_cliente orgánico
        const resolvedUserId = cliente.id_usuario;

        const [infoPersonal, pagos, medidas, asistencia, planesDisponibles, rutina] =
            await Promise.all([
                // Info personal directa
                sql`
          SELECT c.*, u.email, u.username 
          FROM clientes c 
          JOIN usuarios u ON c.id_usuario = u.id 
          WHERE c.id = ${resolvedId}
        `,

                // A. Historial de Pagos
                sql`
        SELECT p.monto, p.metodo_pago, p.fecha_pago, pl.nombre as tipo_plan
        FROM pagos p
        JOIN membresias m ON p.id_membresia = m.id
        LEFT JOIN planes pl ON m.id_plan = pl.id
        WHERE m.id_cliente = ${resolvedId}
        ORDER BY p.fecha_pago DESC LIMIT 10
      `,
                // B. Evolución Física (Mantenemos SELECT * para traer los nuevos campos de medidas)
                sql`SELECT * FROM medidas_fisicas WHERE id_cliente = ${resolvedId} ORDER BY fecha_registro ASC`,

                // C. Asistencia (Usamos id_usuario)
                sql`
        SELECT fecha_entrada 
        FROM asistencia 
        WHERE id_usuario = ${resolvedUserId} 
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
      WHERE r.id_cliente = ${resolvedId} AND r.activa = true
      ORDER BY
        CASE dr.dia
            WHEN 'Lunes' THEN 1 WHEN 'Martes' THEN 2 WHEN 'Miércoles' THEN 3
            WHEN 'Jueves' THEN 4 WHEN 'Viernes' THEN 5 WHEN 'Sábado' THEN 6 WHEN 'Domingo' THEN 7
            ELSE 8
          END`,
            ]);

        return {
            infoPersonal: infoPersonal[0] || null,
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
    