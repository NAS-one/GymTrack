import z from "zod";

const maquinaSchema = z.object({
  nombre: z.string().min(2, "El nombre es obligatorio"),
  marca: z.string().optional(),
  codigo_serie: z.string().optional(),
  fecha_adquisicion: z.string().date().optional(),

  estado: z.enum(["operativa", "mantencion", "fuera_servicio"]).optional(),

  id_administrador: z.string().uuid().optional(), // Quién la registró
});

export function validateMaquina(input) {
  return maquinaSchema.safeParse(input);
}

export function validatePartialMaquina(input) {
  return maquinaSchema.partial().safeParse(input);
}
