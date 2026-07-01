import z from "zod";

const planSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, { message: "El nombre debe tener al menos 2 letras" })
    .regex(/^(?=.*[a-zA-ZáéíóúÁÉÍÓÚñÑ]).+$/, "El nombre debe contener al menos una letra"),
  precio: z.coerce
    .number()
    .min(6750, { message: "El precio mínimo es $6.750 (Máx. 85% desc.)" }),
  duracion_meses: z.coerce
    .number()
    .int()
    .min(1, { message: "Mínimo 1 mes de duración" })
    .max(36, { message: "Máximo 36 meses de duración" }),
  descripcion: z.string().trim().optional(),
  precio_comparacion: z.coerce.number().optional().nullable(),
  tipo_plan: z.enum(['regular', 'oferta', 'estudiante', 'combo']).default('regular'),
  requiere_validacion: z.boolean().default(false),
  beneficios_extra: z.array(z.string()).default([]),
});

export function validatePlan(input) {
  return planSchema.safeParse(input);
}

export function validatePartialPlan(input) {
  return planSchema.partial().safeParse(input);
}
