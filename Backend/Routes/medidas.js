import { Router } from "express";
import { MedidaController } from "../Controllers/medidas.js";

export const createMedidaRouter = ({ MedidaModel }) => {
  const router = Router();
  const controller = new MedidaController({ MedidaModel });

  router.post("/", controller.create);
  router.get("/cliente/:id_cliente", controller.getByCliente); // Historial de un cliente
  router.patch("/:id", controller.update); // Corregir un registro específico
  router.delete("/:id", controller.delete); // Borrar un registro específico

  return router;
};
