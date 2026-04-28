// Controllers/medidas.js
import { validateMedida, validatePartialMedida } from "../Schemas/medidas.js";
// 1. IMPORTAR HELPERS
import { success, error } from "../Utils/responses.js";

export class MedidaController {
  constructor({ MedidaModel }) {
    this.MedidaModel = MedidaModel;
  }

  // 1. REGISTRAR MEDIDAS
  create = async (req, res) => {
    const result = validateMedida(req.body);

    if (!result.success) {
      // Estandarizado
      return error(req, res, JSON.parse(result.error.message), 400);
    }

    try {
      const registro = await this.MedidaModel.create(result.data);
      // Estandarizado
      success(req, res, registro, 201);
    } catch (e) {
      // Manejo de error si el ID del cliente no existe
      if (e.message.includes("cliente")) {
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
      const historial = await this.MedidaModel.getByCliente({ id_cliente });
      success(req, res, historial, 200);
    } catch (e) {
      console.error(e);
      error(req, res, "Error al obtener historial", 500);
    }
  };

  // 3. ACTUALIZAR MEDIDA
  update = async (req, res) => {
    const { id } = req.params;
    const result = validatePartialMedida(req.body);

    if (!result.success) {
      return error(req, res, JSON.parse(result.error.message), 400);
    }

    try {
      const updated = await this.MedidaModel.update({ id, input: result.data });

      if (!updated) {
        // Estandarizado: 404 Not Found
        return error(req, res, "Registro no encontrado", 404);
      }

      // Estandarizado: 200 OK
      success(req, res, updated, 200);
    } catch (e) {
      console.error(e);
      error(req, res, "Error interno", 500);
    }
  };

  // 4. ELIMINAR MEDIDA
  delete = async (req, res) => {
    const { id } = req.params;
    try {
      const result = await this.MedidaModel.delete({ id });

      if (!result) {
        return error(req, res, "Registro no encontrado", 404);
      }

      success(req, res, { message: "Medida eliminada correctamente" }, 200);
    } catch (e) {
      console.error(e);
      error(req, res, "Error interno", 500);
    }
  };
}
