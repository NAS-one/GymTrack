import { validatePlan, validatePartialPlan } from "../Schemas/planes.js";
import { success, error } from "../Utils/responses.js";

export class PlanController {
  constructor({ PlanModel }) {
    this.PlanModel = PlanModel;
  }

  getAll = async (req, res) => {
    try {
      const planes = await this.PlanModel.getAll();
      success(req, res, planes, 200);
    } catch (e) {
      console.error(e);
      error(req, res, "Error al obtener planes", 500);
    }
  };

  create = async (req, res) => {
    const result = validatePlan(req.body);
    if (!result.success) {
      const firstError = result.error.errors[0]?.message || "Datos inválidos";
      return res.status(400).json({ error: firstError });
    }

    try {
      const newPlan = await this.PlanModel.create(result.data);
      success(req, res, newPlan, 201);
    } catch (e) {
      console.error(e);
      error(req, res, "Error al crear plan", 500);
    }
  };

  update = async (req, res) => {
    const { id } = req.params;
    const result = validatePartialPlan(req.body);
    if (!result.success) {
      const firstError = result.error.errors[0]?.message || "Datos inválidos";
      return res.status(400).json({ error: firstError });
    }

    try {
      const updatedPlan = await this.PlanModel.update({
        id,
        input: result.data,
      });
      if (!updatedPlan) return error(req, res, "Plan no encontrado", 404);

      success(req, res, updatedPlan, 200);
    } catch (e) {
      console.error(e);
      error(req, res, "Error al actualizar plan", 500);
    }
  };

  delete = async (req, res) => {
    const { id } = req.params;
    try {
      const deleted = await this.PlanModel.delete({ id });
      if (!deleted) return error(req, res, "Plan no encontrado", 404);

      success(req, res, { message: "Plan eliminado correctamente" }, 200);
    } catch (e) {
      console.error(e);
      error(req, res, "Error al eliminar plan", 500);
    }
  };

  getStats = async (req, res) => {
    try {
      const stats = await this.PlanModel.getStats({ id: req.params.id });
      res.json({ body: stats });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error al cargar estadísticas del plan" });
    }
  };
}
