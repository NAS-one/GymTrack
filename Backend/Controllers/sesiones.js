export class SesionController {
  constructor({ SesionModel }) {
    this.sesionModel = SesionModel;
  }

  getAgendaDia = async (req, res) => {
    try {
      const { id_entrenador } = req.params;
      const { fecha } = req.query;

      if (!id_entrenador || !fecha) {
        return res
          .status(400)
          .json({ Error: "Faltan parámetros (id_entrenador o fecha" });
      }

      const agenda = await this.sesionModel.getAgendaDia({
        id_entrenador,
        fecha,
      });

      return res.json({ body: agenda });
    } catch (error) {
      console.error("Error obteniendo agenda", error);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  };

  createSesion = async (req, res) => {
    try {
      //Sacamos de nuestro token el ID del usuario
      const id_usuario = req.user.id;
      const {
        id_cliente,
        fecha,
        duracion_minutos,
        valor_cobrado,
        monto_gimnasio,
        monto_entrenador,
      } = req.body;

      if (!id_cliente || !fecha) {
        return res
          .status(400)
          .json({ error: "Faltan datos (cliente o fecha)." });
      }

      const nuevaSesion = await this.sesionModel.create({
        id_usuario,
        id_cliente,
        fecha,
        duracion_minutos: duracion_minutos || 60,
        valor_cobrado: valor_cobrado || 0,
        monto_gimnasio: monto_gimnasio || 0,
        monto_entrenador: monto_entrenador || 0,
      });

      res.status(201).json({ body: nuevaSesion });
    } catch (error) {
      console.error("Error agendado clase:", error);
      res.status(500).json({ error: "Error en el servidor al agendar." });
    }
  };

  updateEstado = async (req, res) => {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      if (!estado) {
        return res.status(400).json({ error: "El estado es requerido." });
      }

      const sesionActualizada = await this.sesionModel.updateEstado({
        id,
        estado,
      });
      if (!sesionActualizada) {
        return res.status(404).json({ error: "Sesion no encontrada" });
      }

      res.json({
        message: "Estado de la sesión actualizado.",
        body: sesionActualizada,
      });
    } catch (error) {
      console.error("Error al actualizar el estado:", error);
      res
        .status(500)
        .json({ error: "Error en el servidor al actualizar el estado" });
    }
  };
}
