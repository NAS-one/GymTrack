// Schemas/users.js
import z from "zod";

const userSchema = z.object({
    username: z
        .string({
            required_error: "El nombre de usuario es obligatorio",
            invalid_type_error: "El usuario debe ser un texto",
        })
        .trim()
        .min(3, "El usuario debe tener al menos 3 caracteres"),

    email: z
        .string({
            required_error: "El email es obligatorio",
        })
        .trim()
        .min(5, "El email no puede estar vacío")
        .email("Formato de email inválido"),

    password: z
        .string({
            required_error: "La contraseña es obligatoria",
        })
        .min(8, "La contraseña debe tener al menos 8 caracteres")
        .regex(
            /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?.&\-])[A-Za-z\d@$!%*?.&\-]+$/,
            "La contraseña debe contener letras, al menos un número y un símbolo (@$!%*?.&-)"
        ),

    // Validamos que el rol sea uno de los permitidos en tu BD
    role: z.enum(["administrador", "entrenador", "cliente"], {
        errorMap: () => ({
            message: "El rol debe ser 'administrador', 'entrenador' o 'cliente'",
        }),
    }),
});

export function validateUser(input) {
    return userSchema.safeParse(input);
}

export function validatePartialUser(input) {
    return userSchema.partial().safeParse(input);
}
export { userSchema };
