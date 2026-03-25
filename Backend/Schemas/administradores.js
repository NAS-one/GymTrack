//Se asegura de que los datos que entran cumplan con las reglas antes de molestar al resto del sistema.

//validation schema for administradores.js
import z from "zod";

//Esquema objeto json para Administrador
const administradorSchema = z.object({
  // --- Datos de Usuario Base (Credenciales) ---
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),

  // --- Datos de Perfil (Administrador) ---
  nombre: z.string().min(1, "El nombre es obligatorio"),
  cargo: z.string().optional(), // Ej: 'Gerente', 'Recepción'
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
