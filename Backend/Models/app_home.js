import { sql } from "../bd.js";

export class AppHomeModel {
    static async getClientMetrics({ id_cliente }) {
        // Ejecutamos las 4 consultas simultáneamente para máximo rendimiento
        const [asistencia, volumen, evolucion, plan] = await Promise.all([

            // 1. ASISTENCIA: Contar días distintos de este mes
            sql`
        SELECT COUNT(DISTINCT DATE(a.fecha_entrada)) as sesiones_mes
        FROM asistencia a
        JOIN usuarios u ON a.id_usuario = u.id
        JOIN clientes c ON c.id_usuario = u.id
        WHERE c.id = ${id_cliente} 
        AND EXTRACT(MONTH FROM a.fecha_entrada) = EXTRACT(MONTH FROM CURRENT_DATE)
      `,

            // 2. VOLUMEN: Tonelaje de los últimos 7 días (Series * Reps * Peso)
            sql`
        SELECT COALESCE(SUM(series_reales * reps_reales * CAST(NULLIF(carga_real, '') AS NUMERIC)), 0) as tonelaje_semanal
        FROM registro_progreso
        WHERE id_cliente = ${id_cliente}
        AND fecha >= CURRENT_DATE - INTERVAL '7 days'
      `,

            // 3. EVOLUCIÓN: Último pesaje registrado
            sql`
        SELECT peso, porcentaje_grasa 
        FROM medidas_fisicas 
        WHERE id_cliente = ${id_cliente} 
        ORDER BY fecha_registro DESC 
        LIMIT 1
      `,

            // 4. PLAN ACTIVO
            sql`
        SELECT nombre, duracion_semanas
        FROM planes_entrenamiento
        WHERE id_cliente = ${id_cliente} AND activo = true
        LIMIT 1
      `
        ]);

        // Formateamos y retornamos un JSON limpio a la app móvil
        return {
            asistencia: {
                sesionesMes: asistencia[0]?.sesiones_mes || 0,
                racha: 0 // Aquí puedes añadir lógica de racha futura
            },
            volumen: {
                // Convertimos a Toneladas (dividiendo por 1000) y limitamos a 1 decimal
                tonelajeSemanal: volumen[0]?.tonelaje_semanal ? (volumen[0].tonelaje_semanal / 1000).toFixed(1) : 0,
                variacion: 0
            },
            evolucion: {
                pesoActual: evolucion[0]?.peso || '--',
                grasa: evolucion[0]?.porcentaje_grasa || '--'
            },
            plan: {
                nombre: plan[0]?.nombre || 'Sin plan asignado',
                duracion: plan[0]?.duracion_semanas || 0
            }
        };
    }
}