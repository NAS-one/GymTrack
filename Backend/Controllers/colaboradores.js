import { success, error } from "../Utils/responses.js";
import { validateColaborador, validatePartialColaborador } from "../Schemas/colaboradores.js";
import bcrypt from "bcrypt";

export class ColaboradorController {
  constructor({ ColaboradorModel }) {
    this.ColaboradorModel = ColaboradorModel;
  }

  // --- GET ALL ---
  getAll = async (req, res) => {
    try {
      const data = await this.ColaboradorModel.getAll();
      success(req, res, { body: data }, 200);
    } catch (e) {
      console.error(e);
      error(req, res, "Error al obtener staff", 500);
    }
  };

  // --- CREATE ---
  create = async (req, res) => {
    const result = validateColaborador(req.body);
    if (!result.success) return res.status(400).json(JSON.parse(result.error.message));

    try {
      const input = result.data;
      if (input.password) input.password = await bcrypt.hash(input.password, 10);

      const newStaff = await this.ColaboradorModel.create(input);
      success(req, res, newStaff, 201);

    } catch (e) {
      this.handleDbError(e, res, "crear");
    }
  };

  // --- UPDATE (PATCH) ---
  update = async (req, res) => {
    const { id } = req.params;
    const result = validatePartialColaborador(req.body);
    
    if (!result.success) return res.status(400).json(JSON.parse(result.error.message));

    try {
        const input = result.data;
        if (input.password) input.password = await bcrypt.hash(input.password, 10);

        const updated = await this.ColaboradorModel.update({ id, input });
        
        if (!updated) return error(req, res, "Colaborador no encontrado", 404);
        
        success(req, res, updated, 200);

    } catch (e) {
        this.handleDbError(e, res, "actualizar");
    }
  };

  // --- DELETE ---
   delete = async (req, res) => {
    try {
      await this.ColaboradorModel.delete(req.params.id);
      success(req, res, { message: "Eliminado" }, 200);
    } catch (e) {
      this.handleDbError(e, res, "eliminar");
    }
  };

  // ---ESTADISTICAS---
getStats = async (req, res) => {
    try {
      const stats = await this.ColaboradorModel.getStats({ id: req.params.id });
      
      if (!stats) return error(req, res, "Colaborador no encontrado", 404);
      
      success(req, res, { body: stats }, 200);

    } catch (e) {
      // LOG DETALLADO EN TERMINAL
      console.error("🔴 Error GET /stats:", e); 
      console.error("SQL Message:", e.message);
      
      // Enviamos el error técnico al frontend para que el modal rojo lo muestre
      res.status(500).json({ error: "Error al calcular estadísticas: " + e.message });
    }
  };

  // --- MANEJO DE ERRORES INTELIGENTE ---
  handleDbError(e, res, action) {
    // 1. Log en consola del servidor (para ti)
    console.error(`🔴 Error CRÍTICO al ${action} staff:`);
    console.error("-> Code:", e.code);
    console.error("-> Detail:", e.detail);
    console.error("-> Constraint:", e.constraint_name);
    console.error("-> Message:", e.message);

    // 2. Errores de Duplicidad (Postgres 23505)
    if (e.code === "23505") {
        const info = (e.detail || "" + e.constraint_name || "").toLowerCase();
        
        if (info.includes("rut")) return res.status(409).json({ error: "Este RUT ya está registrado." });
        if (info.includes("email")) return res.status(409).json({ error: "Este Email ya está registrado." });
        if (info.includes("id_usuario")) return res.status(409).json({ error: "Este usuario ya tiene un perfil asociado." });
        
        return res.status(409).json({ error: "Error de duplicidad (dato ya existe)." });
    }

    // 3. Error Técnico Específico (Esto arregla tu 500 genérico)
    // Devolvemos el mensaje real de la BD para que lo veas en el Modal Rojo
    return res.status(500).json({ 
        error: `Error interno: ${e.message}`, // <--- Aquí verás el error real en el frontend
        code: e.code 
    });
  }
}