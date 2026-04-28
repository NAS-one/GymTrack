import { validateProfile, validatePasswordUpdate } from "../Schemas/perfil.js";
import { success, error } from "../Utils/responses.js";
import bcrypt from "bcrypt";

export class PerfilController {
  constructor({ PerfilModel }) {
    this.PerfilModel = PerfilModel;
  }

  // 1. Obtener Mi Perfil
  getMyProfile = async (req, res) => {
    try {
      // req.user.id viene del middleware verifyToken
      const id_usuario = req.user.id;

      const profile = await this.PerfilModel.getProfileByUserId(id_usuario);

      if (!profile) {
        return error(req, res, "Perfil no encontrado", 404);
      }

      // Nunca devolver el hash de la contraseña al frontend
      const { password, ...safeProfileData } = profile;

      success(req, res, safeProfileData, 200);
    } catch (e) {
      console.error(e);
      error(req, res, "Error al obtener perfil", 500);
    }
  };

  // 2. Actualizar Mis Datos Personales
  updateMyProfile = async (req, res) => {
    const result = validateProfile(req.body);
    if (!result.success)
      return error(req, res, JSON.parse(result.error.message), 400);

    try {
      const id_usuario = req.user.id;

      const telefonoIngresado = req.body.telefono || null;

      const updatedProfile = await this.PerfilModel.updateProfile(id_usuario, {
        nombre: result.data.nombre,
        cargo: result.data.cargo,
        telefono: telefonoIngresado, // Lo pasamos al modelo
      });

      success(req, res, updatedProfile, 200);
    } catch (e) {
      console.error(e);
      error(req, res, "Error al actualizar perfil", 500);
    }
  };
  // 3. Actualizar Mi Contraseña
  updateMyPassword = async (req, res) => {
    const result = validatePasswordUpdate(req.body);

    if (!result.success) {
      return error(req, res, JSON.parse(result.error.message), 400);
    }

    try {
      const id_usuario = req.user.id;
      const { currentPassword, newPassword } = result.data;

      // 1. Buscar al usuario para verificar la contraseña actual
      const userRecord = await this.PerfilModel.getProfileByUserId(id_usuario);

      if (!userRecord) {
        return error(req, res, "Usuario no encontrado", 404);
      }

      // 2. Verificar que la contraseña actual sea correcta
      const isValid = await bcrypt.compare(
        currentPassword,
        userRecord.password,
      );

      if (!isValid) {
        return error(req, res, "La contraseña actual es incorrecta", 401);
      }

      // 3. Hashear la nueva contraseña y guardarla
      const newHashedPassword = await bcrypt.hash(newPassword, 10);
      await this.PerfilModel.updatePassword(id_usuario, newHashedPassword);

      success(
        req,
        res,
        { message: "Contraseña actualizada exitosamente" },
        200,
      );
    } catch (e) {
      console.error(e);
      error(req, res, "Error interno al actualizar contraseña", 500);
    }
  };

  //  4. Obtener Auditoría
  getAuditoria = async (req, res) => {
    try {
      const id_usuario = req.user.id;
      const logs = await this.PerfilModel.getAuditoria(id_usuario);

      // Si todo sale bien, devolvemos el array de logs
      success(req, res, logs, 200);
    } catch (e) {
      console.error(e);
      error(req, res, "Error al cargar la auditoría", 500);
    }
  };

  //  5. Actualizar Preferencias
  updatePreferencias = async (req, res) => {
    try {
      const id_usuario = req.user.id;
      const { preferencias } = req.body;

      if (!preferencias || typeof preferencias !== "object") {
        return error(req, res, "Formato de preferencias inválido", 400);
      }

      const updatedAdmin = await this.PerfilModel.updatePreferencias(
        id_usuario,
        preferencias,
      );

      success(req, res, updatedAdmin.preferencias_alertas, 200);
    } catch (e) {
      console.error(e);
      error(req, res, "Error al guardar las preferencias", 500);
    }
  };
}
