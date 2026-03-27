import { validateReporte } from "../Schemas/reportes.js";
import { success, error } from "../Utils/responses.js";

export class ReporteController {
  constructor({ ReporteModel }) {
    this.ReporteModel = ReporteModel;
  }

  create = async (req, res) => {
    console.log("📥 Petición de reporte recibida:", req.body); // <-- Para ver qué llega

    const result = validateReporte(req.body);

    if (!result.success) {
      console.error("❌ Error del Validador (Schema):", result.error);
      // 🔥 CORRECCIÓN CRÍTICA: Quitamos el JSON.parse que rompía el servidor
      return error(req, res, "Datos inválidos. Revisa que 'clientes' esté permitido en el Schema.", 400);
    }

    const { titulo, tipo, fechaInicio, fechaFin, filtroExtra } = result.data;
    
    try {
      console.log(`⏳ Generando reporte de tipo: ${tipo}`);

      const [admin] = await this.ReporteModel.getAdminByUserId(req.user.id);
      if (!admin) {
        return error(req, res, "Tu cuenta no está registrada como Administrador.", 403);
      }
      
      const id_administrador = admin.id;
      const inicioExacto = `${fechaInicio} 00:00:00`;
      const finExacto = `${fechaFin} 23:59:59`;

      let contenido = [];

      if (tipo === "finanzas") {
        contenido = await this.ReporteModel.getFinanzasData(inicioExacto, finExacto, filtroExtra);
      } else if (tipo === "asistencia") {
        contenido = await this.ReporteModel.getAsistenciaData(inicioExacto, finExacto, filtroExtra);
      } else if (tipo === "inventario") {
        contenido = await this.ReporteModel.getInventarioData(filtroExtra);
      } else if (tipo === "clientes") {
        contenido = await this.ReporteModel.getClientesData(filtroExtra);
      }

      if (contenido.length === 0) {
        return error(req, res, "No se encontraron datos para generar el reporte.", 404);
      }

      // Crear el reporte
      const reporte = await this.ReporteModel.create({
        titulo,
        tipo,
        contenido,
        id_administrador
      });

      console.log("✅ Reporte guardado con éxito en la BD.");
      success(req, res, reporte, 201);
      
    } catch (e) {
      // Si la BD falla, lo imprimirá aquí en rojo brillante
      console.error("🔥 Error crítico en Base de Datos:", e.message || e);
      error(req, res, "Error interno al generar reporte en la Base de Datos", 500);
    }
  };
  
  getAll = async (req, res) => {
    try {
      const reportes = await this.ReporteModel.getAll();
      success(req, res, reportes, 200);
    } catch (e) {
      console.error(e);
      error(req, res, "Error interno al obtener reportes", 500);
    }
  };

  delete = async (req, res) => {
    try {
      const { id } = req.params;
      await this.ReporteModel.delete(id);
      success(req, res, "Reporte eliminado", 200);
    } catch (e) {
      error(req, res, "Error al eliminar reporte", 500);
    }
  };
}