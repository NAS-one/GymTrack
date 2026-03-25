import { Router } from "express";
import { ProgresoController } from "../Controllers/progreso.js";

export const createProgresoRouter = ({ ProgresoModel }) => {
  const router = Router();
  const controller = new ProgresoController({ ProgresoModel });

  router.post("/", controller.create);
  router.get("/cliente/:id_cliente", controller.getByCliente);

  return router;
};
