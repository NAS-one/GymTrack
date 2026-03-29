import { sql } from "../bd.js";

export class RutinaModel {
  // 1. CREAR RUTINA COMPLETA (Transacción Header + Detalles)
  static create = async (input) => {
    //1.1 Desestructuramos el input
    const { nombre, id_cliente, id_entrenador, activa, detalles } = input;

    try {
      // --------INICIO TRANSACCIÓN---------
      const result = await sql.begin(async (sql) => {
        // A. Si esta rutina es activa, desactivamos las anteriores de este cliente
        // (Regla de Negocio: Solo una rutina activa a la vez)
        if (activa !== false) {
          // Por defecto es true
          await sql`
             UPDATE rutinas SET activa = false 
             WHERE id_cliente = ${id_cliente} AND activa = true
           `;
        }

        // B. Insertar Cabecera (Rutina)
        const [newRutina] = await sql`
          INSERT INTO rutinas (nombre, id_cliente, id_entrenador, activa)
          VALUES (${nombre}, ${id_cliente}, ${id_entrenador}, ${activa ?? true})
          RETURNING id, nombre, created_at
        `;

        // C. Insertar Detalles (Loop eficiente y Sanitizado)
        // Mapeamos el array explícitamente para convertir undefined en null
        const detallesConId = detalles.map((d) => ({
          id_rutina: newRutina.id,
          id_ejercicio: d.id_ejercicio,
          dia: d.dia,
          series: d.series,
          repeticiones: d.repeticiones,
          // AQUÍ ESTÁ EL FIX 👇: Si no viene carga, ponemos null
          carga_proyectada: d.carga_proyectada || null,
        }));

        // Usamos el helper de postgres.js para inserción masiva
        const insertedDetails = await sql`
          INSERT INTO detalle_rutina ${sql(detallesConId)}
          RETURNING *
        `;
      });
      // -------FIN TRANSACCIÓN---------

      return result;
    } catch (error) {
      if (error.code === "23503")
        throw new Error("Cliente, Entrenador o Ejercicio no existe");
      throw error;
    }
  };

  // 2. OBTENER RUTINA ACTUAL DE UN CLIENTE (Para la App Móvil)
  // Devuelve la rutina activa con todos sus ejercicios anidados
  static getActiveByClient = async ({ id_cliente }) => {
    // Primero buscamos la rutina activa
    const [rutina] = await sql`
      SELECT * FROM rutinas 
      WHERE id_cliente = ${id_cliente} AND activa = true
      LIMIT 1
    `;

    if (!rutina) return null;

    // Luego buscamos sus detalles uniendo con la tabla ejercicios para saber el nombre
    const detalles = await sql`
      SELECT d.*, e.nombre as nombre_ejercicio, e.url_video, e.grupo_muscular
      FROM detalle_rutina d
      JOIN ejercicios e ON d.id_ejercicio = e.id
      WHERE d.id_rutina = ${rutina.id}
      ORDER BY d.dia, d.id -- Ordenamos por día
    `;

    return { ...rutina, plan: detalles };
  };

  // 3. Obtener todas (para el admin/entrenador)
  static getAll = async () => {
    return await sql`SELECT * FROM rutinas`;
  };
}
