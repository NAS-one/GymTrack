// Controllers/progreso.js
import { validateProgreso } from "../Schemas/progreso.js";
// 1. IMPORTAR HELPERS
import { success, error } from "../Utils/responses.js";

export class ProgresoController {
  constructor({ ProgresoModel }) {
    this.ProgresoModel = ProgresoModel;
  }

  // 1. REGISTRAR PROGRESO
  create = async (req, res) => {
    const result = validateProgreso(req.body);

    if (!result.success) {
      // Estandarizado: 400 Bad Request
      return error(req, res, JSON.parse(result.error.message), 400);
    }

    try {
      const registro = await this.ProgresoModel.create(result.data);
      success(req, res, registro, 201);
    } catch (e) {
      // Manejo de error si cliente, ejercicio o rutina no existen
      if (e.message.includes("no existen")) {
        return error(req, res, e.message, 404);
      }
      console.error(e);
      error(req, res, "Error interno", 500);
    }
  };

  // 2. OBTENER HISTORIAL POR CLIENTE
  getByCliente = async (req, res) => {
    const { id_cliente } = req.params;
    try {
      const historial = await this.ProgresoModel.getByCliente({ id_cliente });
      success(req, res, historial, 200);
    } catch (e) {
      console.error(e);
      error(req, res, "Error al obtener historial", 500);
    }
  };
}
