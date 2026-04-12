import { Router } from "express";
import { ConfiguracionController } from "../Controllers/configuracion.js";
import { ConfiguracionModel } from "../Models/configuracion.js";
import { verifyToken } from "../Middlewares/auth.js"; 

export const createConfiguracionRouter = () => {
  const router = Router();
  const controller = new ConfiguracionController({ ConfiguracionModel });

  // Ambas rutas protegidas
  router.get("/", verifyToken, controller.getConfiguracion);
  router.put("/", verifyToken, controller.updateConfiguracion);
  router.get("/backup", verifyToken, controller.exportBackup);

  return router;
};