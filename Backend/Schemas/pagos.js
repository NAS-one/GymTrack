import z from "zod";

const pagoSchema = z.object({
  // El dinero siempre debe ser positivo
  monto: z
    .number({
      required_error: "El monto es obligatorio",
      invalid_type_error: "El monto debe ser un número",
    })
    .positive("El monto debe ser mayor a 0"),

  metodo_pago: z.enum(["Efectivo", "Tarjeta", "Transferencia"], {
    errorMap: () => ({
      message: "Método inválido. Use: Efectivo, Tarjeta o Transferencia",
    }),
  }),

  // Relaciones obligatorias
  id_membresia: z.string().uuid({ message: "ID de membresía inválido" }),
  id_staff: z
    .string()
    .uuid({ message: "ID de staff inválido" }),
});

// Exportamos la función para validar un registro completo (POST)
export function validatePago(input) {
  //safeParse: devuelve { success: true/false, data, error } sin lanzar excepciones.
  return pagoSchema.safeParse(input);
}
