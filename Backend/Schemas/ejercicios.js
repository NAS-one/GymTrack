import z from "zod";

const ejercicioSchema = z.object({
  nombre: z.string().trim().min(2, "El nombre es muy corto"),
  grupo_muscular: z.string().trim().min(2, "Debes especificar el grupo muscular"),
  url_video: z
    .string()
    .url("Debe ser una URL válida")
    .optional()
    .or(z.literal("")),
  descripcion: z.string().trim().optional(),
});

export function validateEjercicio(input) {
  return ejercicioSchema.safeParse(input);
}

export function validatePartialEjercicio(input) {
  return ejercicioSchema.partial().safeParse(input);
}
