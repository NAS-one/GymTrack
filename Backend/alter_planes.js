import { sql } from './bd.js';

async function run() {
  try {
    await sql`ALTER TABLE planes ADD COLUMN IF NOT EXISTS tipo_plan VARCHAR(50) DEFAULT 'regular';`;
    await sql`ALTER TABLE planes ADD COLUMN IF NOT EXISTS requiere_validacion BOOLEAN DEFAULT false;`;
    await sql`ALTER TABLE planes ADD COLUMN IF NOT EXISTS beneficios_extra JSONB DEFAULT '[]'::jsonb;`;
    await sql`ALTER TABLE planes ADD COLUMN IF NOT EXISTS precio_comparacion INTEGER;`;
    console.log("Database altered successfully.");
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

run();
