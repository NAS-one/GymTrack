import z from "zod";

const planSchema = z.object({
  nombre: z
    .string()
    .min(2, { message: "El nombre debe tener al menos 2 letras" }),
  // Zod recibe strings del formulario, así que usamos coerce para convertir a número
  precio: z.coerce
    .number()
    .min(0, { message: "El precio no puede ser negativo" }),
  duracion_meses: z.coerce
    .number()
    .int()
    .min(1, { message: "Mínimo 1 mes de duración" }),
  descripcion: z.string().optional(),
});

export function validatePlan(input) {
  return planSchema.safeParse(input);
}

export function validatePartialPlan(input) {
  return planSchema.partial().safeParse(input);
}
