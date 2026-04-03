import { Router } from "express";
import { EntrenadorController } from "../Controllers/entrenadores.js";
import { verifyToken } from "../Middlewares/auth.js";

export const createEntrenadorRouter = ({ EntrenadorModel }) => {
  const router = Router();
  const controller = new EntrenadorController({ EntrenadorModel });
  router.get("/dashboard/summary", verifyToken, controller.getDashboardSummary);
  router.get("/mis-alumnos", verifyToken, controller.getMisAlumnos);
  router.get("/mi-perfil", verifyToken, controller.getMiPerfil);
  // Definimos las rutas para los entrenadores
  router.post("/", controller.create);
  router.get("/", controller.getAll);
  router.patch("/:id", controller.update);
  router.delete("/:id", controller.delete);
  router.get("/:id/stats", controller.getStats);
  router.post("/reasignar", controller.reassign);
  router.get("/mis-finanzas", verifyToken, controller.getFinanzas);

  return router;
};
