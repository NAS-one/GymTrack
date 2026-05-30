import z from "zod";

const entrenadorSchema = z.object({
  // --- Credenciales ---
  email: z.string().email("Email inválido").optional(),

  // CORRECCIÓN PASSWORD: Si viene vacío o null, lo tratamos como undefined para que .optional() funcione
  password: z
    .union([z.string().min(8, "Mínimo 8 caracteres"), z.literal(""), z.null()])
    .optional()
    .transform((e) => (e === "" || e === null ? undefined : e)),

  // --- Perfil Básico ---
  rut: z.string().trim().min(8, "RUT inválido").optional(),
  nombre: z.string().trim().min(2, "El nombre es obligatorio").optional(),
  especialidad: z.string().trim().optional(),
  telefono: z.string().trim().optional(),

  // --- NUEVOS CAMPOS FINANCIEROS (Faltaban aquí) ---
  turno: z.enum(["Mañana", "Tarde", "Full Time"]).optional(),

  modelo_contrato: z.enum(["sueldo_fijo", "porcentaje"]).optional(),

  // Zod espera números. Si el frontend manda string, esto fallará (ver Paso 2)
  sueldo_base: z.number().nonnegative().optional(),

  porcentaje_retencion: z.number().min(0).max(1).optional(),

  tarifa_arriendo: z.number().nonnegative().optional(),
});

export function validateEntrenador(input) {
  // En creación, forzamos campos obligatorios
  const createSchema = entrenadorSchema.extend({
    email: z.string().email("Email requerido"),
    nombre: z.string().trim().min(2, "Nombre requerido"),
    rut: z.string().trim().min(8, "RUT requerido"),
    password: z.string().min(8, "Password requerido"), // En create el password es obligatorio
    modelo_contrato: z
      .enum(["sueldo_fijo", "porcentaje"])
      .default("sueldo_fijo"),
  }).superRefine((data, ctx) => {
    if (data.modelo_contrato === "sueldo_fijo") {
      const minSalary = data.turno === "Full Time" ? 539000 : 270000;
      if (!data.sueldo_base || data.sueldo_base < minSalary) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `El sueldo base para ${data.turno || 'este turno'} no puede ser menor al mínimo legal ($${minSalary.toLocaleString('es-CL')})`,
          path: ["sueldo_base"]
        });
      }
    }
  });

  return createSchema.safeParse(input);
}

export function validatePartialEntrenador(input) {
  return entrenadorSchema.partial().safeParse(input);
}
