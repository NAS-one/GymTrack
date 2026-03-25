import {
  validateEjercicio,
  validatePartialEjercicio,
} from "../Schemas/ejercicios.js";
import { success, error } from "../Utils/responses.js";

export class EjercicioController {
  constructor({ EjercicioModel }) {
    this.EjercicioModel = EjercicioModel;
  }

  getAll = async (req, res) => {
    try {
      const data = await this.EjercicioModel.getAll();
      success(req, res, data, 200);
    } catch (e) {
      error(req, res, "Error al cargar ejercicios", 500);
    }
  };

  create = async (req, res) => {
    const result = validateEjercicio(req.body);
    if (!result.success)
      return res.status(400).json(JSON.parse(result.error.message));

    try {
      const nuevo = await this.EjercicioModel.create(result.data);
      success(req, res, nuevo, 201);
    } catch (e) {
      error(req, res, e.message || "Error al crear ejercicio", 500);
    }
  };

  update = async (req, res) => {
    const result = validatePartialEjercicio(req.body);
    if (!result.success)
      return res.status(400).json(JSON.parse(result.error.message));

    try {
      const updated = await this.EjercicioModel.update({
        id: req.params.id,
        input: result.data,
      });
      if (!updated) return error(req, res, "Ejercicio no encontrado", 404);
      success(req, res, updated, 200);
    } catch (e) {
      error(req, res, "Error al actualizar", 500);
    }
  };

  delete = async (req, res) => {
    try {
      const deleted = await this.EjercicioModel.delete({ id: req.params.id });
      if (!deleted) return error(req, res, "Ejercicio no encontrado", 404);
      success(req, res, { message: "Eliminado correctamente" }, 200);
    } catch (e) {
      error(req, res, "Error al eliminar", 500);
    }
  };
}
