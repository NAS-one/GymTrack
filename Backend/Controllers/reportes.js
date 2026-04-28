import { validateReporte } from "../Schemas/reportes.js";
import { success, error } from "../Utils/responses.js";

export class ReporteController {
  constructor({ ReporteModel }) {
    this.ReporteModel = ReporteModel;
  }

  create = async (req, res) => {
    console.log("📥 Petición de reporte recibida:", req.body);

    const result = validateReporte(req.body);

    if (!result.success) {
      console.error("Error del Validador (Schema):", result.error);
      return error(
        req,
        res,
        "Datos inválidos. Revisa los campos enviados.",
        400,
      );
    }

    const {
      titulo,
      tipo,
      fechaInicio,
      fechaFin,
      filtroExtra,
      datosPreCargados,
    } = result.data;

    try {
      console.log(`⏳ Generando reporte de tipo: ${tipo}`);

      const [admin] = await this.ReporteModel.getAdminByUserId(req.user.id);
      if (!admin) {
        return error(
          req,
          res,
          "Tu cuenta no está registrada como Administrador.",
          403,
        );
      }

      const id_administrador = admin.id;
      let contenido = [];

      // Si vienen datos del frontend NO busques en la BD.
      if (
        datosPreCargados &&
        Array.isArray(datosPreCargados) &&
        datosPreCargados.length > 0
      ) {
        console.log("⚡ Guardando datos pre-cargados (Exportación Directa)");
        contenido = datosPreCargados;
      } else {
        console.log(
          "🔍 Buscando datos en la Base de Datos (Modal de Inteligencia)...",
        );

        // Si el frontend no mandó fechas, usamos fechas "falsas" muy amplias para que no reviente la base de datos
        const inicio = fechaInicio
          ? `${fechaInicio} 00:00:00`
          : "1900-01-01 00:00:00";
        const fin = fechaFin ? `${fechaFin} 23:59:59` : "2100-12-31 23:59:59";

        if (tipo === "finanzas") {
          contenido = await this.ReporteModel.getFinanzasData(
            inicio,
            fin,
            filtroExtra,
          );
        } else if (tipo === "asistencia") {
          contenido = await this.ReporteModel.getAsistenciaData(
            inicio,
            fin,
            filtroExtra,
          );
        } else if (tipo === "inventario") {
          contenido = await this.ReporteModel.getInventarioData(
            inicio,
            fin,
            filtroExtra,
          );
        } else if (tipo === "clientes" || tipo === "comunidad") {
          contenido = await this.ReporteModel.getClientesData(
            inicio,
            fin,
            filtroExtra,
          );
        } else if (tipo === "planes") {
          contenido = await this.ReporteModel.getPlanesData(
            inicio,
            fin,
            filtroExtra,
          );
        } else if (tipo === "entrenadores") {
          contenido = await this.ReporteModel.getEntrenadoresData(
            inicio,
            fin,
            filtroExtra,
          );
        }
      }

      if (!contenido || contenido.length === 0) {
        return error(
          req,
          res,
          "No se encontraron registros para los filtros seleccionados.",
          404,
        );
      }

      const reporte = await this.ReporteModel.create({
        titulo,
        tipo: tipo === "comunidad" ? "clientes" : tipo,
        contenido,
        id_administrador,
      });

      console.log("Reporte archivado en la Bóveda con éxito.");
      success(req, res, reporte, 201);
    } catch (e) {
      console.error("Error crítico en Base de Datos:", e.message || e);
      error(
        req,
        res,
        "Error interno al generar reporte en la Base de Datos",
        500,
      );
    }
  };

  getAll = async (req, res) => {
    try {
      const reportes = await this.ReporteModel.getAll();
      success(req, res, reportes, 200);
    } catch (e) {
      console.error(e);
      error(req, res, "Error interno al obtener reportes", 500);
    }
  };

  delete = async (req, res) => {
    try {
      const { id } = req.params;
      await this.ReporteModel.delete(id);
      success(req, res, "Reporte eliminado", 200);
    } catch (e) {
      error(req, res, "Error al eliminar reporte", 500);
    }
  };
}
