import z from "zod";

const progresoSchema = z.object({
  id_cliente: z.string().uuid(),
  id_ejercicio: z.string().uuid(),
  id_rutina: z.string().uuid().optional(), // Puede ser un entrenamiento libre sin rutina

  series_reales: z.number().int().positive(),
  reps_reales: z.number().int().positive(),

  carga_real: z.string().min(1, "Debes anotar la carga (ej: 20kg o BW)"),

  // RPE (Rate of Perceived Exertion) es del 1 al 10
  rpe: z.number().int().min(1).max(10).optional(),

  comentarios: z.string().optional(),
});

export function validateProgreso(input) {
  return progresoSchema.safeParse(input);
}
