// backend/db.js
import postgres from "postgres";
import dotenv from "dotenv"; // Importante para leer las variables de entorno

// Cargar las variables del .env
dotenv.config();

// 1. Configuración de conexión
// AGREGAMOS 'export' AL INICIO para que otros archivos puedan usar 'sql'
export const sql = postgres({
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
  // Evitar que el driver convierta timestamps a Date de JavaScript (causa desfase de zona horaria)
  types: {
    // OID 1114 = TIMESTAMP WITHOUT TIME ZONE → devolver como string crudo
    1114: {
      to: 1114,
      from: [1114],
      serialize: (x) => x,
      parse: (x) => x, // Devuelve el string tal cual viene de PostgreSQL
    },
  },
});

// Opcional: Un log para saber si conectó (solo visual)
console.log(`Conectado a la BD: ${process.env.DB_NAME}`);
