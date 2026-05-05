// Controllers/membresias.js
import { validateMembresia } from "../Schemas/membresias.js";
// 1. IMPORTAR HELPERS
import { success, error } from "../Utils/responses.js";

// Exportamos la clase controlador de Membresías
export class MembresiaController {
  constructor({ MembresiaModel }) {
    this.MembresiaModel = MembresiaModel;
  }

  // 1. Crear nueva membresía
  create = async (req, res) => {
    // Validamos el cuerpo de la petición
    const result = validateMembresia(req.body);

    if (!result.success) {
      return error(req, res, JSON.parse(result.error.message), 400);
    }

    try {
      // Llamamos al modelo para crear la membresía
      const newMembership = await this.MembresiaModel.create(result.data);

      success(req, res, newMembership, 201);
    } catch (e) {
      // Manejo de errores específicos
      if (e.message.includes("cliente")) {
        return error(req, res, e.message, 404);
      }
      console.error(e);
      error(req, res, "Error interno del servidor", 500);
    }
  };

  // 2. Obtener todas las membresías
  getAll = async (req, res) => {
    try {
      const membresias = await this.MembresiaModel.getAll();
      success(req, res, membresias, 200);
    } catch (e) {
      console.error(e);
      error(req, res, "Error al obtener membresías", 500);
    }
  };

  // 3. Obtener membresía por ID de cliente
  getByCliente = async (req, res) => {
    const { id_cliente } = req.params;
    try {
      const membresias = await this.MembresiaModel.getByCliente({ id_cliente });
      success(req, res, membresias, 200);
    } catch (e) {
      console.error(e);
      error(req, res, "Error interno", 500);
    }
  };

  // 4. Cancelar membresía
  cancel = async (req, res) => {
    const { id } = req.params;

    try {
      const cancelled = await this.MembresiaModel.cancel({ id });

      if (!cancelled) {
        return error(req, res, "Membresía no encontrada", 404);
      }

      // Envolvemos mensaje y data para el frontend
      success(
        req,
        res,
        {
          message: "Membresía cancelada correctamente",
          data: cancelled,
        },
        200,
      );
    } catch (e) {
      console.error(e);
      error(req, res, "Error interno", 500);
    }
  };
}
