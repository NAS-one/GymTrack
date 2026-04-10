import { success, error } from "../Utils/responses.js";

export class ConfiguracionController {
  constructor({ ConfiguracionModel }) {
    this.ConfiguracionModel = ConfiguracionModel;
  }

  // A. OBTENER CONFIGURACIÓN (GET)
  getConfiguracion = async (req, res) => {
    try {
      const config = await this.ConfiguracionModel.get();
      
      if (!config) {
        return error(req, res, "La configuración base no ha sido inicializada en la BD", 404);
      }

      // Devolvemos la configuración completa, incluyendo el JSON de datos_bancarios
      success(req, res, config, 200);
    } catch (e) {
      console.error("Error al obtener configuración:", e);
      error(req, res, "Error interno al obtener configuración", 500);
    }
  };

  // B. ACTUALIZAR CONFIGURACIÓN (PUT)
  updateConfiguracion = async (req, res) => {
    try {
      // 1. Capa de Seguridad: Validamos que solo un Administrador pueda tocar esto
      // req.user viene del middleware verifyToken
      if (req.user.role !== 'administrador') {
        return error(req, res, "Acceso denegado: No tienes privilegios gerenciales", 403);
      }

      // 2. Ejecutar la actualización pasando el body completo (que incluye datos_bancarios)
      const updatedConfig = await this.ConfiguracionModel.update(req.body);

      if (!updatedConfig) {
        return error(req, res, "No se pudo actualizar la configuración", 500);
      }

      success(req, res, updatedConfig, 200);
    } catch (e) {
      console.error("Error al actualizar configuración:", e);
      error(req, res, "Error al guardar los parámetros de la empresa", 500);
    }
  };

// C. EXPORTAR BASE DE DATOS (PURE NODE.JS - JSON BACKUP)
  exportBackup = async (req, res) => {
    try {
      if (req.user.role !== 'administrador') {
        return res.status(403).json({ error: true, body: "Acceso denegado." });
      }

      // Importamos la conexión SQL directamente (Ajusta la ruta si es necesario)
      const { sql } = await import('../bd.js');

      // 1. Obtener los nombres de TODAS las tablas de tu base de datos
      const tablas = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      `;

      const backupData = {};

      // 2. Extraer los datos de cada tabla de forma dinámica
      for (const row of tablas) {
        const nombreTabla = row.table_name;
        // sql.unsafe nos permite pasar el nombre de la tabla dinámicamente
        const datosTabla = await sql.unsafe(`SELECT * FROM ${nombreTabla}`);
        backupData[nombreTabla] = datosTabla;
      }

      // 3. Añadir metadatos al backup
      const backupFinal = {
        metadatos: {
          generado_por: req.user.username,
          fecha_generacion: new Date().toISOString(),
          sistema: "GymTrack SaaS",
          version: "1.0.0"
        },
        datos: backupData
      };

      // 4. Enviar directamente como archivo JSON al navegador sin tocar el disco duro
      const date = new Date().toISOString().split('T')[0];
      const fileName = `gymtrack_backup_${date}.json`;

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
      
      // Enviamos el JSON formateado (con 2 espacios de indentación para que sea legible)
      return res.status(200).send(JSON.stringify(backupFinal, null, 2));

    } catch (e) {
      console.error("Error crítico generando el backup JSON:", e);
      return res.status(500).json({ error: true, body: "Error interno al generar el archivo de respaldo." });
    }
  };
}