import { success, error } from "../Utils/responses.js";
import { sql } from "../bd.js";

export class PlanEntrenamientoController {
  constructor({ PlanEntrenamientoModel }) {
    this.Model = PlanEntrenamientoModel;
  }

  // Helper: obtener el id del entrenador a partir del id del usuario
  _getEntrenadorId = async (id_usuario) => {
    const [entrenador] =
      await sql`SELECT id FROM entrenadores WHERE id_usuario = ${id_usuario}`;
    return entrenador?.id || null;
  };

  create = async (req, res) => {
    try {
      const { nombre, objetivo } = req.body;
      const regexSoloTexto = /^(?=.*[a-zA-ZáéíóúÁÉÍÓÚñÑ]).+$/;
      
      if (!nombre || nombre.trim().length < 3) {
        return error(
          req,
          res,
          "El nombre del plan debe tener al menos 3 caracteres",
          400,
        );
      }
      
      if (!regexSoloTexto.test(nombre.trim())) {
        return error(
          req,
          res,
          "El nombre del plan debe contener al menos una letra",
          400,
        );
      }

      const id_entrenador = await this._getEntrenadorId(req.user.id);
      if (!id_entrenador) {
        return error(req, res, "No se encontró perfil de entrenador", 403);
      }

      const plan = await this.Model.create({
        nombre: nombre.trim(),
        objetivo: objetivo || null,
        id_creador: req.user.id,
      });

      success(req, res, plan, 201);
    } catch (e) {
      console.error(e);
      error(req, res, e.message || "Error al crear el plan", 500);
    }
  };

  getMisPlanes = async (req, res) => {
    try {
      const id_entrenador = await this._getEntrenadorId(req.user.id);
      if (!id_entrenador) {
        return error(req, res, "No se encontró perfil de entrenador", 403);
      }

      const planes = await this.Model.getByCreador({ id_creador: req.user.id });
      success(req, res, planes, 200);
    } catch (e) {
      console.error(e);
      error(req, res, e.message || "Error al obtener los planes", 500);
    }
  };

  getById = async (req, res) => {
    try {
      const plan = await this.Model.getById({ id: req.params.id });
      if (!plan) return error(req, res, "Plan no encontrado", 400);
      success(req, res, plan, 200);
    } catch (e) {
      console.error(e);
      error(req, res, "Error interno", 500);
    }
  };

  delete = async (req, res) => {
    try {
      await this.Model.delete({ id: req.params.id });
      success(req, res, { message: "Plan eliminado" }, 200);
    } catch (e) {
      error(req, res, e.message, 404);
    }
  };

  asignarACliente = async (req, res) => {
    try {
      const { id_cliente } = req.body;
      if (!id_cliente)
        return error(req, res, "Debes seleccionar un cliente", 400);

      const result = await this.Model.asignarACliente({
        id_plan: req.params.id,
        id_cliente,
      });

      success(req, res, result, 200);
    } catch (e) {
      console.error(e);
      error(req, res, e.message, 400);
    }
  };
}
