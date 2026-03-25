import { Router } from "express";
import { ClienteController } from "../Controllers/clientes.js";

export const createClienteRouter = ({ ClienteModel }) => {
  const router = Router();
  const controller = new ClienteController({ ClienteModel });

  // Rutas CRUD
  router.get("/", controller.getAll);
  router.post("/", controller.create);
  
  // ⚠️ IMPORTANTE: Si controller.getById no existe en tu controlador, comenta esta línea
  // router.get("/:id", controller.getById); 

  router.patch("/:id", controller.update);
  router.delete("/:id", controller.delete);

  // Rutas Especiales
  router.get("/:id/stats", controller.getStats); // <--- Esta es vital para el modal detalle

  return router;
};