import { Router } from "express";
import { PlanController } from "../Controllers/planController.js";

export const createPlanRouter = ({ PlanModel }) => {
  const router = Router();
  const controller = new PlanController({ PlanModel });

  router.get("/", controller.getAll);
  router.get("/archived", controller.getArchived);
  router.post("/", controller.create);
  router.patch("/:id", controller.update);
  router.delete("/:id", controller.delete);
  router.get("/:id/stats", controller.getStats);

  return router;
};

