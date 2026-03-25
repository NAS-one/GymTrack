import z from "zod";

const asistenciaSchema = z.object({
  // El frontend (el escáner) nos envía el string largo del QR
  token_qr: z.string().min(1, "El token QR es obligatorio"),
});

export function validateAsistencia(input) {
  return asistenciaSchema.safeParse(input);
}
