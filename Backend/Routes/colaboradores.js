import { Router } from "express";
import { ColaboradorController } from "../Controllers/colaboradores.js";

export const createColaboradorRouter = ({ ColaboradorModel }) => {
  const router = Router();
  const controller = new ColaboradorController({ ColaboradorModel });

  router.get("/", controller.getAll);
  router.post("/", controller.create);
  router.patch("/:id", controller.update);
  router.delete("/:id", controller.delete);
  router.get("/:id/stats", controller.getStats); 

  return router;
};
