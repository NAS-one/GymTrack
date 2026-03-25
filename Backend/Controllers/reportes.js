// Controllers/reportes.js
import { validateReporte } from "../Schemas/reportes.js";
// 1. IMPORTAR HELPERS
import { success, error } from "../Utils/responses.js";

export class ReporteController {
  constructor({ ReporteModel }) {
    this.ReporteModel = ReporteModel;
  }

  // 1. GENERAR REPORTE
  create = async (req, res) => {
    const result = validateReporte(req.body);

    if (!result.success) {
      // Estandarizado: 400 Bad Request
      return error(req, res, JSON.parse(result.error.message), 400);
    }

    try {
      const reporte = await this.ReporteModel.create(result.data);
      // Estandarizado: 201 Created
      success(req, res, reporte, 201);
    } catch (e) {
      console.error(e);
      error(req, res, "Error interno al generar reporte", 500);
    }
  };

  // 2. OBTENER TODOS LOS REPORTES
  getAll = async (req, res) => {
    try {
      const reportes = await this.ReporteModel.getAll();
      // Estandarizado: 200 OK
      success(req, res, reportes, 200);
    } catch (e) {
      console.error(e);
      error(req, res, "Error interno al obtener reportes", 500);
    }
  };
}
