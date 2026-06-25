// Schemas/selfRegister.js
// Validaciones robustas para el auto-registro de clientes
import z from "zod";

// ====================================================================
// UTILIDADES DE VALIDACIÓN CHILENA
// ====================================================================

/**
 * Valida el dígito verificador de un RUT chileno.
 * Algoritmo Módulo 11 oficial del SII.
 */
function validateRutDV(rutClean) {
  // rutClean viene sin puntos ni guión, ej: "123456789"
  const body = rutClean.slice(0, -1);
  const dv = rutClean.slice(-1).toUpperCase();

  let sum = 0;
  let multiplier = 2;

  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  let expectedDV;
  if (remainder === 11) expectedDV = "0";
  else if (remainder === 10) expectedDV = "K";
  else expectedDV = remainder.toString();

  return dv === expectedDV;
}

/**
 * Detecta patrones de RUT repetitivo/inválido.
 * Rechaza: 11.111.111-1, 22.222.222-2, 33.333.333-3, etc.
 */
function isRepeatedPattern(rutBody) {
  const digits = rutBody.replace(/\D/g, "");
  // Verificar si todos los dígitos son iguales
  if (/^(\d)\1+$/.test(digits)) return true;
  // Verificar secuencias ascendentes/descendentes obvias
  if (digits === "12345678" || digits === "87654321") return true;
  return false;
}

// ====================================================================
// SCHEMA DE AUTO-REGISTRO
// ====================================================================

export const selfRegisterSchema = z.object({
  // --- NOMBRE ---
  nombre: z
    .string({ required_error: "El nombre es obligatorio" })
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(60, "El nombre no puede superar los 60 caracteres")
    .refine(
      (val) => /^[A-Za-záéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(val),
      "El nombre solo puede contener letras y espacios"
    )
    .refine(
      (val) => {
        const words = val.trim().split(/\s+/);
        return words.length >= 2;
      },
      "Debes ingresar nombre y apellido (mínimo 2 palabras)"
    )
    .refine(
      (val) => {
        const words = val.trim().split(/\s+/);
        return words.length <= 4;
      },
      "El nombre no puede tener más de 4 palabras"
    )
    .refine(
      (val) => {
        const words = val.trim().split(/\s+/);
        return words.every((w) => w.length >= 2);
      },
      "Cada parte del nombre debe tener al menos 2 letras"
    ),

  // --- RUT ---
  rut: z
    .string({ required_error: "El RUT es obligatorio" })
    .trim()
    .refine(
      (val) => /^\d{1,2}\.\d{3}\.\d{3}-[\dkK]$/.test(val),
      "El RUT debe tener formato XX.XXX.XXX-X"
    )
    .refine(
      (val) => {
        const clean = val.replace(/[.\-]/g, "");
        const body = clean.slice(0, -1);
        const num = parseInt(body);
        // RUT mínimo real en Chile: ~1.000.000
        return num >= 1000000 && num <= 99999999;
      },
      "El número de RUT no es válido (fuera de rango real)"
    )
    .refine(
      (val) => {
        const clean = val.replace(/[.\-]/g, "");
        return !isRepeatedPattern(clean.slice(0, -1));
      },
      "El RUT ingresado no es válido (patrón repetitivo detectado)"
    )
    .refine(
      (val) => {
        const clean = val.replace(/[.\-]/g, "");
        return validateRutDV(clean);
      },
      "El dígito verificador del RUT no es correcto"
    ),

  // --- EMAIL ---
  email: z
    .string({ required_error: "El correo electrónico es obligatorio" })
    .trim()
    .min(5, "El correo no puede estar vacío")
    .email("Formato de correo inválido")
    .refine(
      (val) => {
        // No permitir solo @dominio.com sin nombre de usuario
        const parts = val.split("@");
        return parts[0] && parts[0].length >= 2;
      },
      "El correo debe tener un nombre de usuario válido antes del @"
    )
    .refine(
      (val) => {
        // Verificar que el dominio tenga al menos un punto (TLD real)
        const domain = val.split("@")[1];
        return domain && domain.includes(".") && domain.split(".").pop().length >= 2;
      },
      "El dominio del correo no es válido"
    ),

  // --- CONTRASEÑA ---
  password: z
    .string({ required_error: "La contraseña es obligatoria" })
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?.&\-])[A-Za-z\d@$!%*?.&\-]+$/,
      "La contraseña debe contener letras, al menos un número y un símbolo (@$!%*?.&-)"
    ),

  // --- FECHA DE NACIMIENTO ---
  fecha_nacimiento: z
    .string({ required_error: "La fecha de nacimiento es obligatoria" })
    .refine(
      (val) => {
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      "La fecha de nacimiento no es válida"
    )
    .refine(
      (val) => {
        const date = new Date(val);
        const today = new Date();
        const age = today.getFullYear() - date.getFullYear();
        const monthDiff = today.getMonth() - date.getMonth();
        const actualAge =
          monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())
            ? age - 1
            : age;
        return actualAge >= 12;
      },
      "Debes tener al menos 12 años para registrarte"
    )
    .refine(
      (val) => {
        const date = new Date(val);
        const today = new Date();
        const age = today.getFullYear() - date.getFullYear();
        return age <= 120;
      },
      "La fecha de nacimiento no es realista (máximo 120 años)"
    )
    .refine(
      (val) => {
        const date = new Date(val);
        const today = new Date();
        return date <= today;
      },
      "La fecha de nacimiento no puede ser en el futuro"
    ),

  // --- DIRECCIÓN ---
  direccion: z
    .string({ required_error: "La dirección es obligatoria" })
    .trim()
    .min(5, "La dirección debe tener al menos 5 caracteres")
    .max(200, "La dirección no puede superar los 200 caracteres")
    .refine(
      (val) => /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(val),
      "La dirección debe contener al menos una letra"
    ),

  // --- CÓDIGO POSTAL ---
  codigo_postal: z
    .string({ required_error: "El código postal es obligatorio" })
    .trim()
    .min(3, "El código postal no es válido"),

  // --- OBJETIVO (Opcional) ---
  objetivo: z
    .string()
    .max(200, "El objetivo no puede superar los 200 caracteres")
    .optional()
    .nullable(),

  // --- PLAN SELECCIONADO (Opcional) ---
  id_plan: z.string().uuid("ID de plan inválido").optional().nullable(),

  // --- GÉNERO (Opcional) ---
  genero: z
    .enum(["Masculino", "Femenino", "Otro", "Prefiero no decir"], {
      errorMap: () => ({ message: "Género no válido" }),
    })
    .optional()
    .nullable(),
});

export function validateSelfRegister(input) {
  return selfRegisterSchema.safeParse(input);
}
