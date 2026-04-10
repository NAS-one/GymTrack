import { z } from 'zod';

export const updateProfileSchema = z.object({
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  cargo: z.string().min(2, "El cargo es requerido"),
  telefono: z.string().nullable().optional() 
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es requerida"),
  newPassword: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres")
});

export function validateProfile(data) {
  return updateProfileSchema.safeParse(data);
}

export function validatePasswordUpdate(data) {
  return updatePasswordSchema.safeParse(data);
}