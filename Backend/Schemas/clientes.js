import z from "zod";

const clienteSchema = z.object({
    // 1. Datos obligatorios
    nombre: z.string().trim().min(1, { message: "El nombre es requerido" }).regex(/^(?=.*[a-zA-Z0-9]).+$/, "El nombre debe contener al menos una letra o número"),
    rut: z
        .string()
        .min(9, { message: "RUT inválido" })
        .refine(
            (val) => {
                return val.includes("-");
            },
            { message: "El RUT debe tener formato válido (con guión)" }
        ),
    email: z
        .string()
        .trim()
        .min(5, { message: "El email no puede estar vacío" })
        .email({ message: "Email inválido" }),

    // 2. Seguridad (Opcional porque en update no se envía siempre)
    password: z
        .string()
        .min(8, { message: "La contraseña debe tener al menos 8 caracteres" })
        .regex(
            /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?.&\-])[A-Za-z\d@$!%*?.&\-]+$/,
            "La contraseña debe contener letras, al menos un número y un símbolo (@$!%*?.&-)"
        )
        .optional()
        .or(z.literal('')),

    // 3. Opcionales existentes
    objetivo: z.string().trim().optional(),

    // 4. NUEVOS CAMPOS (Importante agregarlos para que pasen)
    // Aceptamos string o null (el input date envía string "YYYY-MM-DD" o vacío)
    fecha_nacimiento: z.string().nullable().optional().or(z.literal("")),
    genero: z.string().nullable().optional().or(z.literal("")),
    direccion: z
        .string()
        .trim()
        .nullable()
        .optional()
        .or(z.literal(""))
        .refine(
            (val) => {
                if (!val || val.trim() === "") return true; // Opcional, si está vacío, OK
                // Debe contener al menos una letra y un número (formato dirección)
                return /[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/.test(val) && /\d/.test(val);
            },
            { message: "La dirección debe tener un formato válido (ej: Osorno 123)" }
        ),

    // 5. Entrenador (Lógica de UUID, vacío o null)
    id_entrenador: z
        .union([z.string().uuid(), z.string().length(0), z.null()])
        .optional()
        .transform((val) => (val === "" ? null : val)),

    // IMPORTANTE: NO incluimos 'username' aquí,
    // porque el usuario no lo escribe, se genera solo en la BD.
});

export function validateCliente(object) {
    return clienteSchema.safeParse(object);
}

export function validatePartialCliente(object) {
    return clienteSchema.partial().safeParse(object);
}
