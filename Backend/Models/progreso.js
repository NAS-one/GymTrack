import { sql } from "../bd.js";


export class ProgresoModel {
  // 1. Registrar una serie o ejercicio completado
  static create = async (input) => {
    const {
      id_cliente,
      id_ejercicio,
      id_rutina,
      series_reales,
      reps_reales,
      carga_real,
      rpe,
      comentarios,
    } = input;

    try {
      const [registro] = await sql`
        INSERT INTO registro_progreso (
          id_cliente, id_ejercicio, id_rutina,
          series_reales, reps_reales, carga_real, rpe, comentarios
        )
        VALUES (
          ${id_cliente}, ${id_ejercicio}, ${id_rutina || null},
          ${series_reales}, ${reps_reales}, ${carga_real}, ${rpe || null}, ${
        comentarios || null
      }
        )
        RETURNING *
      `;
      return registro;
    } catch (error) {
      if (error.code === "23503")
        throw new Error("Cliente, Ejercicio o Rutina no existen");
      throw error;
    }
  };

  // 2. Historial de un Cliente (Enriquecido con nombres)
  static getByCliente = async ({ id_cliente }) => {
    return await sql`
      SELECT 
        p.*, 
        e.nombre as nombre_ejercicio, 
        e.grupo_muscular,
        e.url_video
      FROM registro_progreso p
      JOIN ejercicios e ON p.id_ejercicio = e.id
      WHERE p.id_cliente = ${id_cliente}
      ORDER BY p.fecha DESC
    `;
  };

  // 3. Historial de un ejercicio específico para un cliente (Para ver la gráfica de "Press Banca")
  static getStatsByEjercicio = async ({ id_cliente, id_ejercicio }) => {
    return await sql`
      SELECT fecha, carga_real, reps_reales, rpe
      FROM registro_progreso
      WHERE id_cliente = ${id_cliente} AND id_ejercicio = ${id_ejercicio}
      ORDER BY fecha ASC
    `;
  };
}
