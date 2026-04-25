import { Router } from "express";
import { PlanEntrenamientoController } from "../Controllers/plan_entrenamiento.js";
import { verifyToken } from "../Middlewares/auth.js";

export const createPlanEntrenamientoRouter = ({ PlanEntrenamientoModel }) => {
  const router = Router();
  const controller = new PlanEntrenamientoController({
    PlanEntrenamientoModel,
  });

  router.get("/", verifyToken, controller.getMisPlanes);
  router.post("/", verifyToken, controller.create);
  router.get("/:id", verifyToken, controller.getById);
  router.delete("/:id", verifyToken, controller.delete);
  router.post("/:id/asignar", verifyToken, controller.asignarACliente);

  return router;
};
