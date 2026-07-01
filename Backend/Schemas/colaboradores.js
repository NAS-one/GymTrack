import z from "zod";

const staffSchema = z.object({
  nombre: z.string().trim().min(2, "Nombre requerido").regex(/^(?=.*[a-zA-Z0-9]).+$/, "El nombre debe contener al menos una letra o número"),
  rut: z.string().trim().min(8, "RUT inválido").optional().or(z.literal('')),

  // Opcionales que pueden venir vacíos
  telefono: z.string().trim().optional().or(z.literal('')),
  direccion: z.string().trim().optional().or(z.literal('')),

  // Cargos permitidos
  cargo: z.enum(['Administrador', 'Mantenimiento', 'Aseo']),
  turno: z.enum(['Mañana', 'Tarde', 'Noche', 'Full Time', 'Part Time']),

  // Sueldo
  sueldo_base: z.number().int().nonnegative("El sueldo debe ser positivo").optional(),

  // Credenciales opcionales (para crear usuario con login)
  email: z.string().email("Email inválido").optional().or(z.literal('')),
  password: z.string().min(8).optional().or(z.literal(''))
});

export function validateStaff(input) {
  const schemaWithValidation = staffSchema.superRefine((data, ctx) => {
    const minSalary = data.turno === "Full Time" ? 539000 : 270000;
    if (data.sueldo_base !== undefined && data.sueldo_base < minSalary) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `El sueldo base para turno ${data.turno} no puede ser menor a $${minSalary.toLocaleString('es-CL')}`,
        path: ["sueldo_base"]
      });
    }
  });
  return schemaWithValidation.safeParse(input);
}

export function validatePartialStaff(input) {
  return staffSchema.partial().safeParse(input);
}