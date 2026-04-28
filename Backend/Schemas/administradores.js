//Se asegura de que los datos que entran cumplan con las reglas antes de molestar al resto del sistema.

//validation schema for administradores.js
import z from "zod";

//Esquema objeto json para Administrador
const administradorSchema = z.object({
  // --- Datos de Usuario Base (Credenciales) ---
  username: z.string().trim().min(3),
  email: z.string().trim().email(),
  password: z.string().min(8),

  // --- Datos de Perfil (Administrador) ---
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  cargo: z.string().trim().optional(),
});

// 8. Exportamos la función para validar un registro completo (POST)
export function validateAdministrador(input) {
  //safeParse: devuelve { success: true/false, data, error } sin lanzar excepciones.
  return administradorSchema.safeParse(input);
}
// Validación parcial para actualizaciones.
export function validatePartialAdministrador(input) {
  // partial() hace que todos los campos sean opcionales.
  return administradorSchema.partial().safeParse(input);
}
