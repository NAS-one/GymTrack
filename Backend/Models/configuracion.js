import { sql } from "../bd.js";

export class ConfiguracionModel {
  // 1. Obtener la configuración actual (ID = 1 siempre)
  static get = async () => {
    const [config] = await sql`
      SELECT * FROM configuracion_empresa WHERE id = 1
    `;
    return config;
  };

  // 2. Actualizar la configuración completa
  static update = async (input) => {
    // Si no vienen datos bancarios en el request, le pasamos un objeto vacío para no romper el JSONB
    const datosBancariosSeguros = input.datos_bancarios || {};
    const politicasSeguridadSeguras = input.politicas_seguridad || {};

    const [updatedConfig] = await sql`
      UPDATE configuracion_empresa 
      SET 
        razon_social = ${input.razon_social},
        nombre_fantasia = ${input.nombre_fantasia},
        rut_empresa = ${input.rut_empresa},
        giro_comercial = ${input.giro_comercial || null},
        direccion_comercial = ${input.direccion_comercial || null},
        telefono_contacto = ${input.telefono_contacto || null},
        email_contacto = ${input.email_contacto || null},
        moneda_base = ${input.moneda_base || 'CLP'},
        zona_horaria = ${input.zona_horaria || 'America/Santiago'},
        datos_bancarios = ${sql.json(datosBancariosSeguros)},
        politicas_seguridad = ${sql.json(politicasSeguridadSeguras)}, 
        updated_at = CURRENT_TIMESTAMP
      WHERE id = 1
      RETURNING *
    `;
    
    return updatedConfig;
  };
}