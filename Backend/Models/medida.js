import postgres from "postgres";

const sql = postgres({
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

export class MedidaModel {
  // 1. Crear registro
  static create = async (input) => {
    const {
      id_cliente,
      peso,
      altura,
      porcentaje_grasa,
      circunferencia_cintura,
      fecha_registro,
    } = input;

    try {
      const [registro] = await sql`
        INSERT INTO medidas_fisicas (
          id_cliente, peso, altura, 
          porcentaje_grasa, circunferencia_cintura, fecha_registro
        )
        VALUES (
          ${id_cliente}, 
          ${peso}, 
          ${altura}, 
          ${porcentaje_grasa || null}, 
          ${circunferencia_cintura || null}, 
          ${fecha_registro || sql`CURRENT_DATE`}
        )
        RETURNING *
      `;
      return registro;
    } catch (error) {
      if (error.code === "23503") throw new Error("El cliente no existe");
      throw error;
    }
  };

  // 2. Historial para Gráficos (Ordenado Cronológicamente)
  static getByCliente = async ({ id_cliente }) => {
    return await sql`
      SELECT * FROM medidas_fisicas 
      WHERE id_cliente = ${id_cliente}
      ORDER BY fecha_registro ASC
    `;
  };

  // 3. Actualizar (por si hubo error de dedo)
  static update = async ({ id, input }) => {
    const allowedColumns = [
      "peso",
      "altura",
      "porcentaje_grasa",
      "circunferencia_cintura",
      "fecha_registro",
    ];
    const cleanInput = {};

    for (const key of allowedColumns) {
      if (input[key] !== undefined) cleanInput[key] = input[key];
    }

    if (Object.keys(cleanInput).length === 0) return null;

    try {
      const [updated] = await sql`
        UPDATE medidas_fisicas 
        SET ${sql(cleanInput)}
        WHERE id = ${id}
        RETURNING *
      `;
      return updated;
    } catch (error) {
      if (error.code === "22P02") throw new Error("UUID inválido");
      throw error;
    }
  };

  // 4. Eliminar registro
  static delete = async ({ id }) => {
    try {
      const result =
        await sql`DELETE FROM medidas_fisicas WHERE id = ${id} RETURNING id`;
      return result.length > 0;
    } catch (error) {
      return false;
    }
  };
}
