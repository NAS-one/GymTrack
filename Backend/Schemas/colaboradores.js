import z from "zod";

const colaboradorSchema = z.object({
  nombre: z.string().trim().min(2, "Nombre requerido"),
  rut: z.string().trim().min(8, "RUT inválido"),
  
  // Opcionales que pueden venir vacíos
  telefono: z.string().trim().optional().or(z.literal('')),
  direccion: z.string().trim().optional().or(z.literal('')),
  
  // Validamos que sea uno de los cargos permitidos
  cargo: z.enum(['Recepcionista', 'Aseo', 'Mantenimiento', 'Administración', 'Ventas']),
  turno: z.enum(['Mañana', 'Tarde', 'Noche', 'Full Time', 'Part Time']),
  
  // Validación estricta de números (El frontend debe enviar number, no string)
  sueldo_base: z.number().int().nonnegative("El sueldo debe ser positivo"),
  
  // Credenciales opcionales
  email: z.string().email("Email inválido").optional().or(z.literal('')),
  password: z.string().min(8).optional().or(z.literal(''))
});

export function validateColaborador(input) {
  return colaboradorSchema.safeParse(input);
}

export function validatePartialColaborador(input) {
  return colaboradorSchema.partial().safeParse(input);
}