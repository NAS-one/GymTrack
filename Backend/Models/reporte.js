import postgres from "postgres";
const sql = postgres({
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

export class ReporteModel {
  static getAll = async () => {
    return await sql`SELECT * FROM reportes ORDER BY fecha_generacion DESC`;
  };

  static create = async (input) => {
    const { titulo, tipo, contenido, id_administrador } = input;
    // postgres.js convierte automáticamente el objeto JS 'contenido' a JSONB
    const [reporte] = await sql`
      INSERT INTO reportes (titulo, tipo, contenido, id_administrador)
      VALUES (${titulo}, ${tipo}, ${contenido}, ${id_administrador})
      RETURNING *
    `;
    return reporte;
  };
}
