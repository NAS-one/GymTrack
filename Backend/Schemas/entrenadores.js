import z from "zod";

const entrenadorSchema = z.object({
  // --- Credenciales ---
  email: z.string().email("Email inválido").optional(),

  // CORRECCIÓN PASSWORD: Si viene vacío o null, lo tratamos como undefined para que .optional() funcione
  password: z
    .union([z.string().min(6, "Mínimo 6 caracteres"), z.literal(""), z.null()])
    .optional()
    .transform((e) => (e === "" || e === null ? undefined : e)),

  // --- Perfil Básico ---
  rut: z.string().min(8, "RUT inválido").optional(),
  nombre: z.string().min(2, "El nombre es obligatorio").optional(),
  especialidad: z.string().optional(),
  telefono: z.string().optional(),

  // --- NUEVOS CAMPOS FINANCIEROS (Faltaban aquí) ---
  turno: z.enum(["Mañana", "Tarde", "Full Time"]).optional(),

  modelo_contrato: z.enum(["sueldo_fijo", "porcentaje"]).optional(),

  // Zod espera números. Si el frontend manda string, esto fallará (ver Paso 2)
  sueldo_base: z.number().nonnegative().optional(),

  porcentaje_retencion: z.number().min(0).max(1).optional(),
});

export function validateEntrenador(input) {
  // En creación, forzamos campos obligatorios
  const createSchema = entrenadorSchema.extend({
    email: z.string().email("Email requerido"),
    nombre: z.string().min(2, "Nombre requerido"),
    rut: z.string().min(8, "RUT requerido"),
    password: z.string().min(6, "Password requerido"), // En create el password es obligatorio
    modelo_contrato: z
      .enum(["sueldo_fijo", "porcentaje"])
      .default("sueldo_fijo"),
  });

  return createSchema.safeParse(input);
}

export function validatePartialEntrenador(input) {
  return entrenadorSchema.partial().safeParse(input);
}
