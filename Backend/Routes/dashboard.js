import { Router } from "express";
import { DashboardController } from "../Controllers/dashboard.js";

export const createDashboardRouter = ({ DashboardModel }) => {
  const router = Router();
  const controller = new DashboardController({ DashboardModel });

  // ANTES: router.get('/', controller.getSummary);
  // AHORA: Agregamos '/summary' para que coincida con el frontend
  router.get("/summary", controller.getSummary);

  return router;
};
