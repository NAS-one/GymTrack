import { sql } from "../bd.js";

export class EjercicioModel {
  static async getAll() {
    return await sql`SELECT * FROM ejercicios ORDER BY grupo_muscular ASC, nombre ASC`;
  }

  static async create(input) {
    const { nombre, grupo_muscular, url_video, descripcion } = input;

    // Validar duplicados por nombre
    const [exist] =
      await sql`SELECT id FROM ejercicios WHERE nombre = ${nombre}`;
    if (exist) throw new Error("Ya existe un ejercicio con este nombre");

    const [ejercicio] = await sql`
      INSERT INTO ejercicios (nombre, grupo_muscular, url_video, descripcion)
      VALUES (${nombre}, ${grupo_muscular}, ${url_video}, ${descripcion})
      RETURNING *
    `;
    return ejercicio;
  }

  static async update({ id, input }) {
    const allowedColumns = [
      "nombre",
      "grupo_muscular",
      "url_video",
      "descripcion",
    ];
    const cleanInput = {};

    for (const key of allowedColumns) {
      if (input[key] !== undefined) cleanInput[key] = input[key];
    }

    if (Object.keys(cleanInput).length === 0)
      throw new Error("No hay datos para actualizar");

    const [ejercicio] = await sql`
      UPDATE ejercicios SET ${sql(cleanInput)} WHERE id = ${id} RETURNING *
    `;
    return ejercicio;
  }

  static async delete({ id }) {
    const [deleted] =
      await sql`DELETE FROM ejercicios WHERE id = ${id} RETURNING id`;
    return !!deleted;
  }
}
