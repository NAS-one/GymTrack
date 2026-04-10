import { sql } from "../bd.js";

export class MembresiaModel {
  //1. Crear nueva membresía
  static create = async (input) => {
    // Extraemos los datos necesarios
    const { id_cliente, tipo_plan, fecha_inicio } = input;

    // --------------Lógica de Fechas--------------
    // 1. Si no envían fecha de inicio, usamos HOY
    const inicio = fecha_inicio ? new Date(fecha_inicio) : new Date();
    const fin = new Date(inicio); // Clonamos la fecha para calcular el fin

    // 2. Calculamos fecha de fin según el plan
    if (tipo_plan === "Mensual") fin.setMonth(fin.getMonth() + 1);
    if (tipo_plan === "Trimestral") fin.setMonth(fin.getMonth() + 3);
    if (tipo_plan === "Anual") fin.setFullYear(fin.getFullYear() + 1);

    try {
      // 3. Inserción
      const [newMembership] = await sql`
        INSERT INTO membresias (id_cliente, tipo_plan, fecha_inicio, fecha_fin, estado)
        VALUES (
          ${id_cliente}, 
          ${tipo_plan}, 
          ${inicio.toISOString().split("T")[0]}, -- Formato YYYY-MM-DD
          ${fin.toISOString().split("T")[0]},    -- Fecha calculada
          'active'
        )
        RETURNING *
      `;

      // 4. Devolvemos la nueva membresía creada
      return newMembership;

      // Manejo de errores de clave foránea
    } catch (error) {
      if (error.code === "23503")
        throw new Error("El cliente especificado no existe");
      throw error;
    }
  };

  //2. Obtener todas las membresías
  static getAll = async () => {
    // JOIN para ver el nombre del cliente dueño de la membresía
    return await sql`
      SELECT m.*, c.nombre as nombre_cliente, c.rut
      FROM membresias m
      JOIN clientes c ON m.id_cliente = c.id
    `;
  };

  //3. Obtener membresía por ID
  static getByCliente = async ({ id_cliente }) => {
    return await sql`
      SELECT * FROM membresias WHERE id_cliente = ${id_cliente}
    `;
  };

  // Cancelar membresía (No borrar, sino cambiar estado)
  static cancel = async ({ id }) => {
    const [cancelled] = await sql`
      UPDATE membresias SET estado = 'cancelled' 
      WHERE id = ${id}
      RETURNING *
    `;
    return cancelled;
  };
}
