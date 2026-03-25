import z from "zod";

const reporteSchema = z.object({
  titulo: z.string().min(3),
  tipo: z.enum(["financiero", "operativo", "asistencia", "inventario"]),
  id_administrador: z.string().uuid(),

  // ❌ ANTES (Daba error en Zod v4):
  // contenido: z.record(z.any())

  // ✅ AHORA (Solución segura):
  // Usamos z.any() para permitir cualquier objeto o array JSON sin validación estricta interna
  contenido: z.any(),
});

export function validateReporte(input) {
  return reporteSchema.safeParse(input);
}
