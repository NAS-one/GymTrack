import z from "zod";

// Definimos los planes válidos para evitar errores de tipeo
const PLANES = ["Mensual", "Trimestral", "Anual"];

const membresiaSchema = z.object({
  // Vinculamos al cliente (obligatorio)
  id_cliente: z.string().uuid({ message: "ID de cliente inválido" }),

  // El tipo de plan determina la fecha de fin
  tipo_plan: z.enum(PLANES, {
    errorMap: () => ({
      message: "El plan debe ser: Mensual, Trimestral o Anual",
    }),
  }),

  // Opcional: Si queremos forzar una fecha de inicio distinta a "hoy"
  fecha_inicio: z.string().date().optional(),

  // Estado inicial (por defecto será active)
  estado: z.enum(["active", "pending", "cancelled"]).optional(),
});

// Exportamos la función para validar un registro completo (POST)
export function validateMembresia(input) {
  //safeParse: devuelve { success: true/false, data, error } sin lanzar excepciones.
  return membresiaSchema.safeParse(input);
}

// Validación parcial para actualizaciones.
export function validatePartialMembresia(input) {
  //partial() hace que todos los campos sean opcionales.
  return membresiaSchema.partial().safeParse(input);
}
