import { sql } from "../bd.js";

export class MaquinaModel {
  // 1. Obtener todas
  static async getAll() {
    return await sql`
      SELECT * FROM maquinas 
      ORDER BY 
        CASE 
            WHEN estado = 'en_mantencion' THEN 1
            WHEN estado = 'fuera_servicio' THEN 2
            ELSE 3
        END ASC, 
        nombre ASC
    `;
  }

  // 2. Crear Máquina
  static async create(input) {
    const { nombre, marca, codigo_serie, fecha_adquisicion, id_usuario } =
      input;

    const [maquina] = await sql`
      INSERT INTO maquinas (
        nombre, 
        marca, 
        codigo_serie, 
        fecha_adquisicion, 
        estado, 
        id_staff
      )
      VALUES (
        ${nombre}, 
        ${marca}, 
        ${codigo_serie}, 
        ${fecha_adquisicion}, 
        'operativa', 
        (SELECT id FROM staff WHERE id_usuario = ${id_usuario} LIMIT 1)
      )
      RETURNING *
    `;

    return maquina;
  }

  // 3. ACTUALIZAR (Versión Dinámica)
  static async update({ id, input }) {
    // 1. Definimos qué columnas se permite actualizar (Lista blanca)
    // Esto evita errores si llegan campos raros y protege la BD.
    const allowedColumns = [
      "nombre",
      "marca",
      "codigo_serie",
      "fecha_adquisicion",
      "estado",
    ];

    // 2. Filtramos el input
    // Solo tomamos las propiedades que NO sean undefined
    const cleanInput = {};
    for (const key of allowedColumns) {
      if (input[key] !== undefined) {
        cleanInput[key] = input[key];
      }
    }

    // Si no hay nada que actualizar, devolvemos null o error
    if (Object.keys(cleanInput).length === 0) {
      throw new Error("No hay datos para actualizar");
    }

    // 3. Consulta Mágica
    // sql(cleanInput) genera automáticamente: nombre = 'x', marca = 'y'...
    const [maquina] = await sql`
      UPDATE maquinas 
      SET ${sql(cleanInput)}
      WHERE id = ${id}
      RETURNING *
    `;

    return maquina;
  }

  // 4. Eliminar
  static async delete({ id }) {
    const [deleted] =
      await sql`DELETE FROM maquinas WHERE id = ${id} RETURNING id`;
    return !!deleted;
  }
}
