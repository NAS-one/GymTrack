import { success, error } from "../Utils/responses.js";

export class MaquinaController {
  constructor({ MaquinaModel }) {
    this.MaquinaModel = MaquinaModel;
  }

  getAll = async (req, res) => {
    try {
      const maquinas = await this.MaquinaModel.getAll();
      success(req, res, maquinas, 200);
    } catch (e) {
      error(req, res, "Error al cargar inventario", 500);
    }
  };

  create = async (req, res) => {
    try {
      // 1. EXTRAEMOS EL ID DEL USUARIO DESDE EL TOKEN
      const userId = req.user.id;

      if (!userId) return error(req, res, "Usuario no identificado", 401);

      // 2. Pasamos el userId al modelo junto con los datos del formulario
      const nueva = await this.MaquinaModel.create({
        ...req.body,
        id_usuario: userId,
      });

      success(req, res, nueva, 201);
    } catch (e) {
      console.error(e); // Para ver el error real en consola
      if (e.code === "23505")
        return error(req, res, "El código de serie ya existe", 409);
      error(req, res, "Error al registrar máquina", 500);
    }
  };

  update = async (req, res) => {
    const { id } = req.params;
    try {
      const updated = await this.MaquinaModel.update({ id, input: req.body });
      if (!updated) return error(req, res, "Máquina no encontrada", 404);
      success(req, res, updated, 200);
    } catch (e) {
      error(req, res, "Error al actualizar", 500);
    }
  };

  delete = async (req, res) => {
    try {
      const deleted = await this.MaquinaModel.delete({ id: req.params.id });
      if (!deleted) return error(req, res, "Máquina no encontrada", 404);
      success(req, res, { message: "Máquina eliminada" }, 200);
    } catch (e) {
      error(req, res, "Error al eliminar", 500);
    }
  };
}
