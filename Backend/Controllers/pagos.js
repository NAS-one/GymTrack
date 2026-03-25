import { success, error } from "../Utils/responses.js";
// Asegúrate de que este archivo exista, si no, comenta la línea del import y la validación en create
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

  // 2. CREAR PAGO SIMPLE (Necesario si tienes la ruta router.post('/', controller.create))
  create = async (req, res) => {
    try {
      const input = req.body;
      
      // Validación básica si no usas Zod aún
      if (!input.monto || !input.id_membresia) {
        return error(req, res, "Faltan datos del pago", 400);
      }

      const newPago = await this.PagoModel.create(input);
      success(req, res, newPago, 201);
    } catch (e) {
      console.error("Error create Pago:", e);
      error(req, res, "Error al registrar pago", 500);
    }
  };

  // 3. RENOVAR MEMBRESÍA (Con lógica compleja)
  renovarPlan = async (req, res) => {
    try {
      // req.body trae: { id_cliente, id_plan, meses_duracion, monto, metodo_pago }
      
      // Validación de seguridad
      if (!req.body.id_cliente || !req.body.id_plan) {
          return error(req, res, "Faltan datos para renovar (Cliente o Plan)", 400);
      }
      
      const resultado = await this.PagoModel.procesarRenovacion(req.body);
      
      success(req, res, resultado, 201);
    } catch (e) {
      console.error("🔴 Error Renovar:", e.message);
      // Devolvemos el error específico si es de base de datos
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
          console.warn("⚠️ No se encontró membresía activa para cancelar:", id_cliente);
          // Opcional: Podrías devolver 404 si prefieres ser estricto
          // return error(req, res, "No hay membresía activa para cancelar", 404);
      }

      success(req, res, { message: "Membresía cancelada correctamente" }, 200);
    } catch (e) {
      console.error("🔴 Error Cancelar:", e); 
      error(req, res, "Error interno al cancelar membresía", 500);
    }
  };
}