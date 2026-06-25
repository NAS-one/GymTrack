import z from "zod";

const maquinaSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede superar los 50 caracteres")
    .refine((val) => val.trim().length >= 2, { message: "El nombre no puede contener solo espacios" })
    .refine((val) => /[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/.test(val), { message: "El nombre debe contener al menos una letra" })
    .refine((val) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(val), { message: "El nombre solo puede contener letras y espacios" }),

  marca: z
    .string()
    .trim()
    .max(30, "La marca no puede superar los 30 caracteres")
    .refine((val) => !val || /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s\-]+$/.test(val), { message: "La marca solo puede contener letras, números, espacios y guiones" })
    .optional(),

  codigo_serie: z
    .string()
    .trim()
    .max(30, "El código de serie no puede superar los 30 caracteres")
    .refine((val) => !val || /^[a-zA-Z0-9\-_.]+$/.test(val), { message: "Solo letras, números, guiones y puntos" })
    .optional(),

  fecha_adquisicion: z
    .string()
    .date()
    .refine((val) => {
      if (!val) return true;
      const fecha = new Date(val);
      const hoy = new Date();
      hoy.setHours(23, 59, 59, 999);
      return fecha <= hoy;
    }, { message: "La fecha de adquisición no puede ser futura" })
    .optional(),

  estado: z.enum(["operativa", "en_mantencion", "fuera_servicio"]).optional(),

  id_staff: z.string().uuid().optional(),
});

export function validateMaquina(input) {
  return maquinaSchema.safeParse(input);
}

export function validatePartialMaquina(input) {
  return maquinaSchema.partial().safeParse(input);
}
