import z from "zod";

// 1. Esquema para CADA ejercicio dentro de la rutina
const detalleSchema = z.object({
  id_ejercicio: z.string().uuid(),
  dia: z.string().trim().min(1, "Debes especificar el día (ej: Lunes)"),
  series: z.number().int().positive(),
  repeticiones: z.string(), // String para permitir "12" o "10-12"
  carga_proyectada: z.string().optional(),
});

// 2. Esquema para la Rutina COMPLETA (Cabecera + Detalles)
const rutinaSchema = z.object({
  nombre: z.string().trim().min(3).regex(/^(?=.*[a-zA-ZáéíóúÁÉÍÓÚñÑ]).+$/, "El nombre debe contener al menos una letra"),
  id_cliente: z.string().uuid().nullable().optional(),
  id_entrenador: z.string().uuid(),
  activa: z.boolean().optional(),
  es_plantilla: z.boolean().optional(),
  id_plan: z.string().uuid().nullable().optional(),

  // Aquí validamos el array de detalles
  detalles: z
    .array(detalleSchema)
    .min(1, "La rutina debe tener al menos un ejercicio"),
}).refine(data => data.es_plantilla || data.id_cliente, {
  message: "El id_cliente es obligatorio si la rutina no es una plantilla",
  path: ["id_cliente"],
});

// Función para validar una rutina completa
export function validateRutina(input) {
  //safeParse devuelve un objeto con { success: boolean, data?, error? }
  return rutinaSchema.safeParse(input);
}

// Función para validación parcial
export function validatePartialRutina(input) {
  return rutinaSchema.partial().safeParse(input);
}
