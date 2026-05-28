import { sql } from './bd.js';

async function migrate() {
  try {
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS unique_telefono_staff ON staff(telefono) WHERE telefono IS NOT NULL AND telefono != '';`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS unique_telefono_entrenadores ON entrenadores(telefono) WHERE telefono IS NOT NULL AND telefono != '';`;
    console.log("Indexes created successfully.");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}
migrate();
