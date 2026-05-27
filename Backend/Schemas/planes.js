import z from "zod";

const planSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, { message: "El nombre debe tener al menos 2 letras" }),
  precio: z.coerce
    .number()
    .min(9990, { message: "El precio mínimo es $9.990" }),
  duracion_meses: z.coerce
    .number()
    .int()
    .min(1, { message: "Mínimo 1 mes de duración" })
    .max(12, { message: "Máximo 12 meses de duración" }),
  descripcion: z.string().trim().optional(),
});

export function validatePlan(input) {
  return planSchema.safeParse(input);
}

export function validatePartialPlan(input) {
  return planSchema.partial().safeParse(input);
}
