import z from "zod";

const ejercicioSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(60, "El nombre no puede superar los 60 caracteres")
    .refine((val) => /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(val), {
      message: "El nombre solo puede contener letras y espacios",
    })
    .refine((val) => val.replace(/\s/g, '').length >= 2, {
      message: "El nombre debe contener al menos 2 letras",
    }),

  grupo_muscular: z
    .string()
    .trim()
    .min(2, "Debes especificar el grupo muscular")
    .refine(
      (val) =>
        [
          "Pecho", "Espalda", "Piernas", "Hombros",
          "Bíceps", "Tríceps", "Abdominales", "Cardio", "Full Body",
        ].includes(val),
      { message: "Grupo muscular no válido" }
    ),

  url_video: z
    .string({ required_error: "La URL del GIF o Video es obligatoria" })
    .trim()
    .min(1, "La URL del GIF o Video es obligatoria")
    .refine(
      (val) => {
        try {
          const url = new URL(val);
          if (!["http:", "https:"].includes(url.protocol)) return false;
          
          const dominiosVideo = ["youtube.com", "www.youtube.com", "youtu.be", "vimeo.com", "www.vimeo.com"];
          const esVideo = dominiosVideo.some((d) => url.hostname === d || url.hostname.endsWith("." + d));
          const esImagenOGif = /\.(gif|jpe?g|png|webp)$/i.test(url.pathname);
          const esTenorOImgur = ['tenor.com', 'imgur.com', 'giphy.com'].some(d => url.hostname.includes(d));
          
          return esVideo || esImagenOGif || esTenorOImgur;
        } catch {
          return false;
        }
      },
      { message: "Debe ser una URL válida de GIF/Imagen o de YouTube/Vimeo" }
    ),

  descripcion: z
    .string()
    .trim()
    .max(500, "La descripción no puede superar los 500 caracteres")
    .optional(),
});

export function validateEjercicio(input) {
  return ejercicioSchema.safeParse(input);
}

export function validatePartialEjercicio(input) {
  return ejercicioSchema.partial().safeParse(input);
}
