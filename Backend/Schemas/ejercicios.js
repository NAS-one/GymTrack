import z from "zod";

const ejercicioSchema = z.object({
  nombre: z.string().min(2, "El nombre es muy corto"),
  grupo_muscular: z.string().min(2, "Debes especificar el grupo muscular"), // Ej: Pecho, Espalda
  url_video: z
    .string()
    .url("Debe ser una URL válida")
    .optional()
    .or(z.literal("")), // Opcional
  descripcion: z.string().optional(),
});

export function validateEjercicio(input) {
  return ejercicioSchema.safeParse(input);
}

export function validatePartialEjercicio(input) {
  return ejercicioSchema.partial().safeParse(input);
}
