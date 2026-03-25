import { Router } from "express";
import { AsistenciaController } from "../Controllers/asistencia.js";

export const createAsistenciaRouter = ({ AsistenciaModel }) => {
  const router = Router();
  const controller = new AsistenciaController({ AsistenciaModel });

  // DEFINICIÓN EXPLÍCITA DE RUTAS
  // POST /acceso/  -> Ejecuta registrarAcceso
  router.post("/", controller.registrarAcceso);

  // GET /acceso/   -> Ejecuta getAll
  router.get("/", controller.getAll);

  return router;
};
