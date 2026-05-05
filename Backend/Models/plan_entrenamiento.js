import { sql } from "../bd.js";

export class PlanEntrenamientoModel {
  // Crear un plan vacío
  static create = async ({ nombre, objetivo, id_entrenador }) => {
    const [plan] = await sql`
      INSERT INTO planes_entrenamiento (nombre, objetivo, id_entrenador)
      VALUES (${nombre}, ${objetivo || null}, ${id_entrenador})
      RETURNING *`;
    return plan;
  };

  // Obtener todos los planes del usuario logueado con sus rutinas
  static getByCreador = async ({ id_entrenador }) => {
    const planes = await sql`
      SELECT * FROM planes_entrenamiento
      WHERE id_entrenador = ${id_entrenador}
      ORDER BY created_at DESC`;

    for (let plan of planes) {
      const rutinas = await sql`
        SELECT r.*,
          (SELECT COUNT(*) FROM detalle_rutina WHERE id_rutina = r.id) as total_ejercicios
        FROM rutinas r
        WHERE r.id_plan = ${plan.id}
        ORDER BY r.created_at ASC`;

      plan.rutinas = rutinas;
      plan.total_rutinas = rutinas.length;
    }

    return planes;
  };

  // Obtener un plan por ID con rutinas + detalles completos
  static getById = async ({ id }) => {
    const [plan] = await sql`
      SELECT * FROM planes_entrenamiento WHERE id = ${id}`;
    if (!plan) return null;

    const rutinas = await sql`
      SELECT * FROM rutinas WHERE id_plan = ${id} ORDER BY created_at ASC`;

    for (let rutina of rutinas) {
      const detalles = await sql`
        SELECT d.*, e.nombre as nombre_ejercicio, e.grupo_muscular
        FROM detalle_rutina d
        JOIN ejercicios e ON d.id_ejercicio = e.id
        WHERE d.id_rutina = ${rutina.id}
        ORDER BY d.dia, d.id`;

      rutina.plan = detalles;
    }

    plan.rutinas = rutinas;
    return plan;
  };

  // Eliminar un plan (cascada elimina sus rutinas-plantilla)
  static delete = async ({ id }) => {
    const result = await sql`
      DELETE FROM planes_entrenamiento WHERE id = ${id} RETURNING id`;

    if (result.length === 0) throw new Error("Plan no encontrado");
    return { success: true };
  };

  // Asignar plan a un cliente (clona todas las rutinas del plan)
  static asignarACliente = async ({ id_plan, id_cliente }) => {
    return await sql.begin(async (sql) => {
      // 1. Verificar que el plan existe
      const [plan] =
        await sql`SELECT * FROM planes_entrenamiento WHERE id = ${id_plan}`;

      if (!plan) throw new Error("Plan no encontrado");

      // 2. Traer todas las rutinas del plan
      const rutinas =
        await sql`SELECT * FROM rutinas WHERE id_plan = ${id_plan}`;

      if (rutinas.length === 0) throw new Error("El plan no tiene rutinas");

      // 3. Validar que el cliente no supere 7 rutinas activas
      const [count] = await sql`
        SELECT COUNT(*) as total FROM rutinas
        WHERE id_cliente = ${id_cliente} AND activa = true`;

      if (parseInt(count.total) + rutinas.length > 7) {
        throw new Error(
          `El cliente ya tiene ${count.total} rutinas activas. Este plan agregaría ${rutinas.length} más (máximo 7).`,
        );
      }

      // 4. Clonar cada rutina al cliente
      for (let rutina of rutinas) {
        const [nuevaRutina] = await sql`
          INSERT INTO rutinas (nombre, id_cliente, id_entrenador, activa, es_plantilla)
          VALUES (${rutina.nombre}, ${id_cliente}, ${rutina.id_entrenador}, true, false)
          RETURNING id`;

        // 5. Clonar los detalles de cada rutina
        const detalles =
          await sql`SELECT * FROM detalle_rutina WHERE id_rutina = ${rutina.id}`;
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
      }
      return { success: true, rutinas_clonadas: rutinas.length };
    });
  };
}
