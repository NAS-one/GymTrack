// Controllers/rutinas.js
import { validateRutina } from "../Schemas/rutinas.js";
// 1. IMPORTAR HELPERS
import { success, error } from "../Utils/responses.js";

export class RutinaController {
  constructor({ RutinaModel }) {
    this.RutinaModel = RutinaModel;
  }

  // 1. CREAR RUTINA COMPLETA
  create = async (req, res) => {
    // 1.1 Validar del esquema de rutina junto con sus detalles
    const result = validateRutina(req.body);

    // 1.2 Si hay errores, responder con 400
    if (!result.success) {
      return error(req, res, JSON.parse(result.error.message), 400);
    }

    try {
      // 1.3 Crear la rutina usando el modelo
      const newRutina = await this.RutinaModel.create(result.data);

      // 1.4 Entregar respuesta 201 Created
      success(req, res, newRutina, 201);
    } catch (e) {
      // 1.5 Manejo de errores específicos (referencias rotas)
      if (e.message.includes("no existe")) {
        // Estandarizado: 404 Not Found
        return error(req, res, e.message, 404);
      }
      console.error(e);
      error(req, res, "Error interno del servidor", 500);
    }
  };

  // 2. OBTENER RUTINA ACTIVA DE UN CLIENTE
  getActiveByClient = async (req, res) => {
    // 2.1 Extraer id_cliente de los parámetros
    const { id_cliente } = req.params;

    try {
      // 2.2 Usar el modelo para obtener la rutina activa
      const rutina = await this.RutinaModel.getActiveByClient({ id_cliente });

      // 2.3 Si no hay rutina activa
      if (!rutina) {
        return error(req, res, "El cliente no tiene rutinas activas", 404);
      }

      // 2.4 Responder con la rutina encontrada (200 OK)
      success(req, res, rutina, 200);
    } catch (e) {
      // 2.5 Manejo de errores
      console.error(e);
      error(req, res, "Error interno", 500);
    }
  };

  // 3. OBTENER TODAS LAS RUTINAS (ADMINISTRACIÓN)
  getAll = async (req, res) => {
    try {
      // 3.1 Usar el modelo para obtener todas las rutinas
      const rutinas = await this.RutinaModel.getAll();

      // 3.2 Responder con el listado (200 OK)
      success(req, res, rutinas, 200);
    } catch (e) {
      // 3.3 Manejo de errores
      console.error(e);
      error(req, res, "Error interno", 500);
    }
  };

  update = async (req, res) => {
    try {
      const { id } = req.params;
      await this.RutinaModel.update({ id, input: req.body });
      res.json({ message: "Rutina actualizada correctamente" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.mensaje });
    }
  };

  //Obtenemos todas las plantillas creadas por el entrenador logueado
  getPlantillas = async (req, res) => {
    try {
      //Usamos el id_usuario del token
      const id_usuario = req.user.id;
      const plantillas = await this.RutinaModel.getPlantillas({
        id_entrenador: id_usuario,
      });

      res.json({ body: plantillas });
    } catch (error) {
      console.error("Error al obtener las plantillas:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  };
  // Eliminar una rutina
  delete = async (req, res) => {
    try {
      const { id } = req.params;
      await this.RutinaModel.delete({ id });
      res.json({ message: "Rutina eliminada correctamente" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // Clonar plantilla a un alumno
  asignarPlantilla = async (req, res) => {
    try {
      const { id_plantilla } = req.params;
      const { id_cliente } = req.body;

      if (!id_cliente) {
        return res.status(400).json({ error: "Debes seleccionar un cliente" });
      }

      await this.RutinaModel.asignarPlantilla({ id_plantilla, id_cliente });
      res.json({ message: "Plantilla asignada exitosamente al alumno" });
    } catch (error) {
      console.error("Error al asignar:", error);
      res.status(500).json({ error: error.message });
    }
  };
}
