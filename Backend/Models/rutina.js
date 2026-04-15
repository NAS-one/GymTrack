import { sql } from "../bd.js";

export class RutinaModel {
  // 1. CREAR RUTINA COMPLETA
  static create = async (input) => {
    const {
      nombre,
      id_cliente,
      id_entrenador,
      activa,
      detalles,
      es_plantilla,
    } = input;

    try {
      const result = await sql.begin(async (sql) => {
        //Optimizar: Recibir directamente el id_entrenador y id_cliente
        //reales desde el payload del Frontend para evitar estas dos consultas
        // ----------------------------------------------------------------
        // Si nos mandan el id_usuario, buscamos su id_entrenador real
        const [coach] = await sql`
          SELECT id FROM entrenadores 
          WHERE id = ${id_entrenador} OR id_usuario = ${id_entrenador} 
          LIMIT 1
        `;

        if (!coach) throw new Error("Entrenador no existe");

        let alumno = null;

        //Solo pedimos que el alumno exista si no es una plantilla predeterminada
        if (!es_plantilla) {
          const [clienteRecord] = await sql`
            SELECT id FROM clientes
            WHERE id = ${id_cliente} or id_usuario = ${id_cliente}
            LIMIT 1`;

          if (!clienteRecord) throw new Error("Cliente no existe");
          alumno = clienteRecord;

          // ----------------------------------------------------------------

          //A. Validar máximo 7 rutinas activas por cliente
          if (activa !== false) {
            const [count] = await sql`
              SELECT COUNT(*) as total FROM rutinas
              WHERE id_cliente = ${alumno.id} AND activa = true`;

            if (parseInt(count.total) >= 7) {
              throw new Error(
                "El cliente ya tiene el máximo de 7 rutinas activas",
              );
            }
          }
        }

        // B. Insertarmos Rutina usando los IDs validados
        const [newRutina] =
          await sql`INSERT INTO rutinas (nombre, id_cliente, id_entrenador, activa, es_plantilla)
          VALUES (${nombre}, ${alumno ? alumno.id : null}, ${coach.id}, ${activa ?? true}, ${es_plantilla ?? false})
          RETURNING id, nombre, created_at
        `;

        // C. Insertar Detalles (Loop eficiente y Sanitizado)
        const detallesConId = detalles.map((d) => ({
          id_rutina: newRutina.id,
          id_ejercicio: d.id_ejercicio,
          dia: d.dia,
          series: d.series,
          repeticiones: d.repeticiones,
          carga_proyectada: d.carga_proyectada || null,
        }));

        await sql`
          INSERT INTO detalle_rutina ${sql(detallesConId)}
          RETURNING *
        `;
      });

      return result;
    } catch (error) {
      throw error;
    }
  };
  // 2. OBTENER RUTINA ACTUAL DE UN CLIENTE (Para la App Móvil)
  static getActivaByClient = async ({ id_cliente }) => {
    //Buscamos todas las rutinas activas del cliente
    const rutinas = await sql`
      SELECT * FROM rutinas
      WHERE id_cliente = ${id_cliente} AND activa = true
      ORDER BY created_at ASC`;

    if (rutinas.length === 0) return [];

    //Para cada rytuba cargamos sus detalles
    for (let rutina of rutinas) {
      const detalles = await sql`
        SELECT d.*, e.nombre as nombre_ejercicio, e.url_video, e.grupo_muscular
        FROM detalle_rutina d
        JOIN ejercicios e ON d.id_ejercicio = e.id
        WHERE d.id_rutina = ${rutina.id}
        ORDER BY d.dia, d.id`;

      rutina.plan = detalles;
    }
    return rutinas;
  };

  // 3. Obtener todas (para el admin/entrenador)
  static getAll = async () => {
    return await sql`SELECT * FROM rutinas`;
  };

  static update = async ({ id, input }) => {
    const { nombre, detalles } = input;

    try {
      await sql.begin(async (sql) => {
        //1. Actualizamos el nombre de la rutina
        await sql`
        UPDATE rutinas
        SET nombre = ${nombre}
        WHERE id = ${id}`;

        //2. Eliminamos el detalle de la rutina vieja
        await sql`
        DELETE FROM detalle_rutina
        WHERE id_rutina = ${id}`;

        //3. Insertamos la nueva distribucion de ejercicios
        if (detalles && detalles.length > 0) {
          const detallesConId = detalles.map((d) => ({
            id_rutina: id,
            id_ejercicio: d.id_ejercicio,
            dia: d.dia,
            series: d.series,
            repeticiones: d.repeticiones,
            carga_proyectada: d.carga_proyectada || null,
          }));

          await sql`INSERT INTO detalle_rutina ${sql(detallesConId)}`;
        }
      });

      return { success: true };
    } catch (error) {
      console.error(error);
      throw new Error("Error al actualizar la rutina");
    }
  };

  static getPlantillas = async ({ id_entrenador }) => {
    const plantillas = await sql`
      SELECT r.*
      FROM rutinas r
      JOIN entrenadores e ON r.id_entrenador = e.id
      WHERE r.es_plantilla = true AND (e.id = ${id_entrenador} OR e.id_usuario=${id_entrenador})
      ORDER BY r.created_at ASC`;

    if (plantillas.length > 0) {
      for (let p of plantillas) {
        const detalles = await sql`
        SELECT d.*, e.nombre as nombre_ejercicio 
        FROM detalle_rutina d
        JOIN ejercicios e ON d.id_ejercicio = e.id
        WHERE d.id_rutina = ${p.id}`;

        p.plan = detalles;
        p.total_ejercicios = detalles.length;
      }
    }

    return plantillas;
  };

  //Eliminar Rutina
  static delete = async ({ id }) => {
    try {
      const result = await sql`
      DELETE FROM rutinas
      WHERE id = ${id}
      RETURNING id`;

      if (result.length === 0) throw new Error("Rutina no encontrada");
      return { success: true };
    } catch (error) {
      throw error;
    }
  };

  //Clonar plantilla a un alumno
  static asignarPlantilla = async ({ id_plantilla, id_cliente }) => {
    try {
      return await sql.begin(async (sql) => {
        //Traer informacion de la plantilla original
        const [plantilla] =
          await sql`SELECT * FROM rutinas WHERE id = ${id_plantilla}`;
        if (!plantilla) throw new Error("Plantilla no encontrada");
        // Validar máximo 7 rutinas activas
        const [count] = await sql`
          SELECT COUNT(*) as total FROM rutinas 
          WHERE id_cliente = ${id_cliente} AND activa = true
        `;
        if (parseInt(count.total) >= 7) {
          throw new Error("El cliente ya tiene el máximo de 7 rutinas activas");
        }

        //Nueva rutina vinculada al cliente
        const [nuevaRutina] = await sql`
        INSERT INTO rutinas (nombre, id_cliente, id_entrenador, activa, es_plantilla)
        VALUES (${plantilla.nombre}, ${id_cliente}, ${plantilla.id_entrenador}, true, false)
        RETURNING id`;

        //Traer los ejericios de la plantilla y clonarlos en la nueva
        const detalles =
          await sql`SELECT * FROM detalle_rutina WHERE id_rutina = ${id_plantilla}`;
        if (detalles.length > 0) {
          const detallesClonados = detalles.map((d) => ({
            id_rutina: nuevaRutina.id,
            id_ejercicio: d.id_ejercicio,
            dia: d.dia,
            series: d.series,
            repeticiones: d.repeticiones,
            carga_proyectada: d.carga_proyectada || null,
          }));
          await sql`INSERT INTO detalle_rutina ${sql(detallesClonados)}`;
        }
        return { success: true, id_nueva_rutina: nuevaRutina.id };
      });
    } catch (error) {
      throw error;
    }
  };
}
