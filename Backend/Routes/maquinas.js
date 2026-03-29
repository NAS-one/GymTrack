import { Router } from "express";
import { MaquinaController } from "../Controllers/maquinas.js";
import { verifyToken } from "../Middlewares/auth.js";

export const createMaquinaRouter = ({ MaquinaModel }) => {
  const router = Router();
  const controller = new MaquinaController({ MaquinaModel });

  router.get("/", controller.getAll);
  router.post("/", verifyToken, controller.create);
  router.patch("/:id", controller.update);
  router.delete("/:id", controller.delete);

  return router;
};
