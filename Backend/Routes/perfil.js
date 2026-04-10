import { Router } from "express";
import { PerfilController } from "../Controllers/perfil.js";
import { PerfilModel } from "../Models/perfil.js"; 
import { verifyToken } from "../Middlewares/auth.js"; 

export const createPerfilRouter = () => {
  const router = Router();
  const controller = new PerfilController({ PerfilModel });

  // 🌟 Todas las rutas usan verifyToken para obtener el req.user.id
  router.get("/", verifyToken, controller.getMyProfile);
  router.put("/datos", verifyToken, controller.updateMyProfile);
  router.put("/password", verifyToken, controller.updateMyPassword);
  router.get("/auditoria", verifyToken, controller.getAuditoria);
  router.put("/preferencias", verifyToken, controller.updatePreferencias);

  return router;
};