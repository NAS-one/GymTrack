import { success, error } from "../Utils/responses.js";
import bcrypt from "bcrypt"; // Importamos bcrypt para hashear contraseñas

import {
  validateAdministrador,
  validatePartialAdministrador,
} from "../Schemas/administradores.js"; // Importamos la función de validación

export class AdministradorController {
  //Inyección de Dependencias: Recibimos el Modelo desde fuera (no lo importamos directamente).
  constructor({ AdministradorModel }) {
    this.AdministradorModel = AdministradorModel;
  }
  // 1. Crear un nuevo administrador
  create = async (req, res) => {
    const result = validateAdministrador(req.body);

    if (!result.success) {
      // Estandarizado: Error de validación (400)
      return error(req, res, JSON.parse(result.error.message), 400);
    }

    try {
      const hashedPassword = await bcrypt.hash(result.data.password, 10);

      const newAdmin = await this.AdministradorModel.create({
        ...result.data,
        password: hashedPassword,
      });

      // Estandarizado: Éxito (201 Created)
      success(req, res, newAdmin, 201);
    } catch (e) {
      if (e.message.includes("ya existe")) {
        // Estandarizado: Error de conflicto (409)
        return error(req, res, e.message, 409);
      }
      console.error(e);
      // Estandarizado: Error de servidor (500)
      error(req, res, "Error interno del servidor", 500);
    }
  };

  // 2. Obtener todos los administradores
  getAll = async (req, res) => {
    try {
      const admins = await this.AdministradorModel.getAll();
      // Estandarizado: Éxito (200 OK)
      // Nota: Si no hay admins, devuelve un array vacío [] en el body, lo cual es correcto.
      success(req, res, admins, 200);
    } catch (e) {
      console.error(e);
      error(req, res, "Error al obtener administradores", 500);
    }
  };

  // 3. Actualizar un administrador
  update = async (req, res) => {
    const { id } = req.params;
    const result = validatePartialAdministrador(req.body);

    if (!result.success) {
      return error(req, res, JSON.parse(result.error.message), 400);
    }

    try {
      const updatedAdmin = await this.AdministradorModel.update({
        id,
        input: result.data,
      });

      if (!updatedAdmin) {
        // Estandarizado: No encontrado (404)
        return error(req, res, "Administrador no encontrado", 404);
      }

      // Estandarizado: Éxito con datos actualizados
      success(req, res, updatedAdmin, 200);
    } catch (e) {
      if (e.message.includes("UUID")) {
        return error(req, res, e.message, 400);
      }
      console.error(e);
      error(req, res, "Error interno del servidor", 500);
    }
  };

  // 4. Eliminar (desactivar) un administrador
  delete = async (req, res) => {
    const { id } = req.params;
    try {
      const isDeleted = await this.AdministradorModel.delete({ id });

      if (!isDeleted) {
        return error(req, res, "Administrador no encontrado", 404);
      }

      // Estandarizado: Éxito con mensaje simple
      success(
        req,
        res,
        { message: "Administrador desactivado correctamente" },
        200
      );
    } catch (e) {
      console.error(e);
      error(req, res, "Error interno del servidor", 500);
    }
  };
}
