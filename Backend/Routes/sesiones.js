import { Router } from "express";
import { SesionController } from "../Controllers/sesiones.js";
import { verifyToken } from "../Middlewares/auth.js";

export const createSesionRouter = ({ SesionModel }) => {
  const router = Router();
  const sesionController = new SesionController({ SesionModel });

  router.get("/agenda/:id_entrenador", sesionController.getAgendaDia);

  router.post("/", verifyToken, sesionController.createSesion);

  router.patch("/:id/estado", verifyToken, sesionController.updateEstado);

  return router;
};
