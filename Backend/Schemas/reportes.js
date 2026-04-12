import { z } from 'zod';

const reporteSchema = z.object({
  titulo: z.string().min(1, "El título es requerido"),
  tipo: z.enum(['finanzas', 'asistencia', 'inventario', 'clientes', 'planes', 'entrenadores', 'comunidad']), 
  fechaInicio: z.string().optional(), 
  fechaFin: z.string().optional(),    
  filtroExtra: z.string().optional(),
  datosPreCargados: z.array(z.any()).optional() 
});

export function validateReporte(data) {
  return reporteSchema.safeParse(data);
}