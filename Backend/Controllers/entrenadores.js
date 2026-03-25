import bcrypt from "bcrypt";
import {
  validateEntrenador,
  validatePartialEntrenador,
} from "../Schemas/entrenadores.js";
import { success, error } from "../Utils/responses.js";

export class EntrenadorController {
  constructor({ EntrenadorModel }) {
    this.EntrenadorModel = EntrenadorModel;
  }

  // 1. OBTENER TODOS
  getAll = async (req, res) => {
    try {
      const trainers = await this.EntrenadorModel.getAll();
      // Envolvemos en 'body' para mantener estándar con Clientes
      res.json({ body: trainers });
    } catch (e) {
      console.error(e);
      error(req, res, "Error al obtener entrenadores", 500);
    }
  };

// 2. CREAR
  create = async (req, res) => {
    // Validar con Zod
    const result = validateEntrenador(req.body);
    if (!result.success) {
      return res.status(400).json(JSON.parse(result.error.message));
    }

    try {
      const hashedPassword = await bcrypt.hash(result.data.password, 10);

      const newTrainer = await this.EntrenadorModel.create({
        ...result.data,
        password: hashedPassword,
      });

      res.status(201).json({ message: "Entrenador creado", body: newTrainer });
    } catch (e) {
      // 🔍 DIAGNÓSTICO EN TERMINAL (Esto te ayudará a ver el nombre real)
      console.error("--- ERROR AL CREAR ENTRENADOR ---");
      console.error("Código SQL:", e.code); 
      console.error("Constraint:", e.constraint_name);
      console.error("Detalle:", e.detail);
      console.error("---------------------------------");

      // MANEJO DE DUPLICADOS (Código 23505 en Postgres)
      if (e.code === "23505") {
        // Concatenamos todo el texto del error y lo pasamos a minúsculas para buscar mejor
        const errorInfo = (
            (e.constraint_name || "") + 
            (e.detail || "") + 
            (e.message || "")
        ).toLowerCase();

        // 1. Detección de RUT duplicado
        if (errorInfo.includes("rut")) {
          return res.status(409).json({ error: "Este RUT ya está registrado en el sistema." });
        }

        // 2. Detección de Email duplicado
        if (errorInfo.includes("email")) {
          return res.status(409).json({ error: "Este correo electrónico ya está registrado." });
        }
        
        // 3. Detección de Username duplicado (colisión en tabla usuarios)
        if (errorInfo.includes("username") || errorInfo.includes("usuarios_username_key")) {
             return res.status(409).json({ error: "El correo genera un usuario que ya existe." });
        }
      }

      // Si no fue duplicado, o fue otro error raro, devolvemos el error real para debug
      res.status(500).json({ error: "Error interno: " + e.message });
    }
  };

  // 3. ACTUALIZAR
  update = async (req, res) => {
    const { id } = req.params;
    const result = validatePartialEntrenador(req.body);

    if (!result.success) {
      return res.status(400).json(JSON.parse(result.error.message));
    }

    try {
      const updatedTrainer = await this.EntrenadorModel.update({
        id,
        input: result.data,
      });

      if (!updatedTrainer)
        return error(req, res, "Entrenador no encontrado", 404);

      res.json({ message: "Entrenador actualizado", body: updatedTrainer });
    } catch (e) {
      console.error(e);
      if (e.message.includes("RUT"))
        return res.status(409).json({ error: e.message });
      res.status(500).json({ error: "Error interno" });
    }
  };

  // 4. ELIMINAR
  delete = async (req, res) => {
    const { id } = req.params;
    try {
      const isDeleted = await this.EntrenadorModel.delete({ id });
      if (!isDeleted) return error(req, res, "Entrenador no encontrado", 404);

      res.json({ message: "Entrenador desactivado correctamente" });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  };

  // 5. OBTENER STATS
  getStats = async (req, res) => {
    try {
      const stats = await this.EntrenadorModel.getStats({ id: req.params.id });
      res.json({ body: stats });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error al cargar ficha técnica" });
    }
  };

  // 6. REASIGNAR CARTERA
  reassign = async (req, res) => {
    const { oldTrainerId, newTrainerId } = req.body;
    try {
      const count = await this.EntrenadorModel.reassignClients({
        oldTrainerId,
        newTrainerId,
      });
      success(
        req,
        res,
        { message: `Se migraron ${count} clientes correctamente` },
        200
      );
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Error en la migración de cartera" });
    }
  };
}
