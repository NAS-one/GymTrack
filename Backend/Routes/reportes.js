import { Router } from "express";
import { ReporteController } from "../Controllers/reportes.js";

export const createReporteRouter = ({ ReporteModel }) => {
  const router = Router();
  const controller = new ReporteController({ ReporteModel });

  router.post("/", controller.create);
  router.get("/", controller.getAll);
  // Los reportes no se suelen editar ni borrar por auditoría

  return router;
};
