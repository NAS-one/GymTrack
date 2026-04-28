import { success, error } from "../Utils/responses.js";
import { dispararAlertaStaff } from "../Utils/alertas.js"; // 🌟 Importamos el nuevo coordinador unificado
// import { validatePago } from "../Schemas/pagos.js";

export class PagoController {
  constructor({ PagoModel }) {
    this.PagoModel = PagoModel;
  }

  // 1. OBTENER TODOS
  getAll = async (req, res) => {
    try {
      const pagos = await this.PagoModel.getAll();
      success(req, res, { body: pagos }, 200);
    } catch (e) {
      console.error("Error getAll Pagos:", e);
      error(req, res, "Error al obtener pagos", 500);
    }
  };

  // 2. CREAR PAGO SIMPLE
  create = async (req, res) => {
    try {
      const input = req.body;

      if (!input.monto || !input.id_membresia) {
        return error(req, res, "Faltan datos del pago", 400);
      }

      const newPago = await this.PagoModel.create(input);

      // Ahora usa el servicio de persistencia + SSE
      dispararAlertaStaff(
        "Pago Registrado",
        `Se ha registrado un pago manual por $${input.monto}.`,
        "pago_recibido",
      );

      success(req, res, newPago, 201);
    } catch (e) {
      console.error("Error create Pago:", e);
      error(req, res, "Error al registrar pago", 500);
    }
  };

  // 3. RENOVAR MEMBRESÍA
  renovarPlan = async (req, res) => {
    try {
      if (!req.body.id_cliente || !req.body.id_plan) {
        return error(
          req,
          res,
          "Faltan datos para renovar (Cliente o Plan)",
          400,
        );
      }

      const resultado = await this.PagoModel.procesarRenovacion(req.body);

      // Ahora usa el servicio de persistencia + SSE
      dispararAlertaStaff(
        "Renovación Exitosa",
        `Un cliente ha renovado su plan (Monto: $${req.body.monto || "N/A"}).`,
        "pago_recibido",
      );

      success(req, res, resultado, 201);
    } catch (e) {
      console.error("🔴 Error Renovar:", e.message);
      error(req, res, "Error al procesar el pago: " + e.message, 500);
    }
  };

  // 4. CANCELAR MEMBRESÍA
  cancelarPlan = async (req, res) => {
    try {
      const { id_cliente } = req.body;

      if (!id_cliente) {
        return error(req, res, "ID de cliente faltante", 400);
      }

      const cancelado = await this.PagoModel.cancelarMembresia(id_cliente);

      if (!cancelado) {
        console.warn(
          "No se encontró membresía activa para cancelar:",
          id_cliente,
        );
      } else {
        // Usa el tag "alerta_sistema" para el color naranja
        dispararAlertaStaff(
          "Membresía Cancelada",
          `Se ha dado de baja la membresía del cliente ID: ${id_cliente}.`,
          "alerta_sistema",
        );
      }

      success(req, res, { message: "Membresía cancelada correctamente" }, 200);
    } catch (e) {
      console.error("🔴 Error Cancelar:", e);
      error(req, res, "Error interno al cancelar membresía", 500);
    }
  };
}
