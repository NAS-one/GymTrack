import { success, error } from "../Utils/responses.js";

export class AsistenciaController {
  constructor({ AsistenciaModel }) {
    this.AsistenciaModel = AsistenciaModel;
  }

  registrarAcceso = async (req, res) => {
    const { identificador } = req.body;
    if (!identificador) return error(req, res, "Identificador requerido", 400);

    try {
      const resultado = await this.AsistenciaModel.registrarNuevoAcceso(identificador);

      if (resultado.estado_acceso === "aprobado") {
        return success(req, res, resultado, 200);
      }

      return res.status(200).json({
        error: true,
        status: 403,
        body: resultado,
      });
    } catch (e) {
      if (e.message === "USUARIO_NO_ENCONTRADO") {
        return res.status(200).json({
          error: true,
          body: {
            nombre: "Desconocido",
            mensaje: "RUT no registrado en el sistema",
            estado_acceso: "denegado",
          },
        });
      }
      console.error(e);
      return error(req, res, "Error interno", 500);
    }
  };

  getAll = async (req, res) => {
    try {
      const { year, month, day, type } = req.query; // Leemos 'type' también
      const logs = await this.AsistenciaModel.getAll({ year, month, day, type });
      success(req, res, logs, 200);
    } catch (e) {
      console.error(e);
      error(req, res, "Error al obtener historial", 500);
    }
  };
}