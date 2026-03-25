import z from "zod";

const medidaSchema = z.object({
  id_cliente: z.string().uuid(),

  // Validaciones lógicas
  peso: z.number().positive("El peso debe ser positivo"),
  altura: z
    .number()
    .positive("La altura debe ser positiva")
    .max(3.0, "La altura se espera en metros (ej: 1.75)"),

  // Opcionales (el cliente puede solo pesarse y no medir su grasa)
  porcentaje_grasa: z.number().min(0).max(100).optional(),
  circunferencia_cintura: z.number().positive().optional(),

  // Opcional: Si quieren registrar una medida de una fecha pasada
  fecha_registro: z.string().date().optional(),
});

export function validateMedida(input) {
  return medidaSchema.safeParse(input);
}

export function validatePartialMedida(input) {
  return medidaSchema.partial().safeParse(input);
}
