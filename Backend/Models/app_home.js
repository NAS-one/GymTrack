import { sql } from "../bd.js";

export class AppHomeModel {
    static async getClientMetrics({ id_cliente }) {
        try {
            // Ejecutamos las 4 consultas simultáneamente para máximo rendimiento
            // Usamos .catch en cada una para que si una falla (ej. tabla no existe), las demás sigan funcionando
            const [asistencia, volumen, evolucion, plan] = await Promise.all([

                // 1. ASISTENCIA: Contar días distintos de este mes
                sql`
                    SELECT COUNT(DISTINCT DATE(a.fecha_entrada)) as sesiones_mes
                    FROM asistencia a
                    JOIN usuarios u ON a.id_usuario = u.id
                    JOIN clientes c ON c.id_usuario = u.id
                    WHERE c.id = ${id_cliente} 
                    AND EXTRACT(MONTH FROM a.fecha_entrada) = EXTRACT(MONTH FROM CURRENT_DATE)
                `.catch(err => {
                    console.error("Error en query asistencia:", err.message);
                    return [{ sesiones_mes: 0 }];
                }),

                // 2. VOLUMEN: Tonelaje de los últimos 7 días (Series * Reps * Peso)
                // Usamos regexp_replace para limpiar textos como "50kg" y convertirlos a números
                sql`
                    SELECT COALESCE(SUM(series_reales * reps_reales * CAST(NULLIF(regexp_replace(carga_real, '[^0-9.]', '', 'g'), '') AS NUMERIC)), 0) as tonelaje_semanal
                    FROM registro_progreso
                    WHERE id_cliente = ${id_cliente}
                    AND fecha >= CURRENT_DATE - INTERVAL '7 days'
                `.catch(err => {
                    console.error("Error en query volumen:", err.message);
                    return [{ tonelaje_semanal: 0 }];
                }),

                // 3. EVOLUCIÓN: Último pesaje registrado
                sql`
                    SELECT peso, porcentaje_grasa 
                    FROM medidas_fisicas 
                    WHERE id_cliente = ${id_cliente} 
                    ORDER BY fecha_registro DESC 
                    LIMIT 1
                `.catch(err => {
                    console.error("Error en query evolucion:", err.message);
                    return [{ peso: '--', porcentaje_grasa: '--' }];
                }),

                // 4. PLAN ACTIVO (Desde la nueva tabla planes_entrenamiento)
                sql`
                    SELECT nombre, duracion_semanas
                    FROM planes_entrenamiento
                    WHERE id_cliente = ${id_cliente} AND activo = true
                    LIMIT 1
                `.catch(err => {
                    console.error("Error en query plan:", err.message);
                    return [{ nombre: 'Sin plan activo', duracion_semanas: 0 }];
                })
            ]);

            // Formateamos y retornamos un JSON limpio a la app móvil
            return {
                asistencia: {
                    sesionesMes: asistencia[0]?.sesiones_mes || 0,
                    racha: 0 // Lógica para implementar según tabla asistencia
                },
                volumen: {
                    // Convertimos a Toneladas (dividiendo por 1000) y limitamos a 1 decimal
                    tonelajeSemanal: volumen[0]?.tonelaje_semanal ? (volumen[0].tonelaje_semanal / 1000).toFixed(1) : "0.0",
                    variacion: 0
                },
                evolucion: {
                    pesoActual: evolucion[0]?.peso || '--',
                    grasa: evolucion[0]?.porcentaje_grasa || '--'
                },
                plan: {
                    nombre: plan[0]?.nombre || 'Sin plan activo',
                    duracion: plan[0]?.duracion_semanas || 0
                }
            };

        } catch (error) {
            // Este catch atrapa errores graves fuera de las consultas
            console.error("Error crítico en AppHomeModel:", error);
            throw error;
        }
    }
}