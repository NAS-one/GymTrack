import z from "zod";

const clienteSchema = z.object({
  // 1. Datos obligatorios
  nombre: z.string().min(1, { message: "El nombre es requerido" }),
  rut: z
    .string()
    .min(9, { message: "RUT inválido" })
    .refine(
      (val) => {
        return val.includes("-");
      },
      { message: "El RUT debe tener formato válido (con guión)" }
    ),
  email: z.string().email({ message: "Email inválido" }),

  // 2. Seguridad (Opcional porque en update no se envía siempre)
  password: z
    .string()
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres" })
    .optional(),

  // 3. Opcionales existentes
  objetivo: z.string().optional(),

  // 4. NUEVOS CAMPOS (Importante agregarlos para que pasen)
  // Aceptamos string o null (el input date envía string "YYYY-MM-DD" o vacío)
  fecha_nacimiento: z.string().nullable().optional().or(z.literal("")),
  genero: z.string().nullable().optional().or(z.literal("")),
  direccion: z.string().nullable().optional().or(z.literal("")),

  // 5. Entrenador (Lógica de UUID, vacío o null)
  id_entrenador: z
    .union([z.string().uuid(), z.string().length(0), z.null()])
    .optional()
    .transform((val) => (val === "" ? null : val)),

  // ❌ IMPORTANTE: NO incluimos 'username' aquí,
  // porque el usuario no lo escribe, se genera solo en la BD.
});

export function validateCliente(object) {
  return clienteSchema.safeParse(object);
}

export function validatePartialCliente(object) {
  return clienteSchema.partial().safeParse(object);
}
