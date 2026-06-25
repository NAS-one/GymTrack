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
      // 1. VALIDACIÓN ZOD
      const { validateMaquina } = await import("../Schemas/maquinas.js");
      const result = validateMaquina(req.body);
      if (!result.success) {
        const messages = result.error.errors.map((e) => e.message);
        return res.status(400).json({ error: messages[0] || "Datos inválidos" });
      }

      // 2. EXTRAEMOS EL ID DEL USUARIO DESDE EL TOKEN
      const userId = req.user.id;
      if (!userId) return error(req, res, "Usuario no identificado", 401);

      // 3. Pasamos el userId al modelo junto con los datos del formulario
      const nueva = await this.MaquinaModel.create({
        ...result.data,
        id_usuario: userId,
      });

      success(req, res, nueva, 201);
    } catch (e) {
      console.error(e);
      if (e.code === "23505")
        return res.status(409).json({ error: "El código de serie ya existe en el inventario." });
      if (e.code === "23502")
        return res.status(400).json({ error: "Faltan campos obligatorios." });
      res.status(500).json({ error: "Error al registrar la máquina. Intenta nuevamente." });
    }
  };

  update = async (req, res) => {
    const { id } = req.params;
    try {
      // Validación parcial Zod
      const { validatePartialMaquina } = await import("../Schemas/maquinas.js");
      const result = validatePartialMaquina(req.body);
      if (!result.success) {
        const messages = result.error.errors.map((e) => e.message);
        return res.status(400).json({ error: messages[0] || "Datos inválidos" });
      }

      const updated = await this.MaquinaModel.update({ id, input: result.data });
      if (!updated) return error(req, res, "Máquina no encontrada", 404);
      success(req, res, updated, 200);
    } catch (e) {
      console.error(e);
      if (e.code === "23505")
        return res.status(409).json({ error: "El código de serie ya existe." });
      res.status(500).json({ error: "Error al actualizar la máquina." });
    }
  };

  delete = async (req, res) => {
    try {
      const deleted = await this.MaquinaModel.delete({ id: req.params.id });
      if (!deleted) return error(req, res, "Máquina no encontrada", 404);
      success(req, res, { message: "Máquina eliminada" }, 200);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error al eliminar la máquina." });
    }
  };
}
