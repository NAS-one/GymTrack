import { Router } from "express";
import { MembresiaController } from "../Controllers/membresias.js";

export const createMembresiaRouter = ({ MembresiaModel }) => {
  const router = Router();
  const controller = new MembresiaController({ MembresiaModel });

  router.post("/", controller.create);
  router.get("/", controller.getAll);
  router.get("/cliente/:id_cliente", controller.getByCliente); // Historial por cliente
  router.delete("/:id", controller.cancel); // Usamos DELETE semánticamente para cancelar

  return router;
};
