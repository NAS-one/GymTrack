// Backend/Routes/pagos.js
import { Router } from "express";
import { PagoController } from "../Controllers/pagos.js";

export const createPagoRouter = ({ PagoModel }) => {
  const router = Router();
  const controller = new PagoController({ PagoModel });

  // Verifica que 'controller.renovarPlan' NO sea undefined aquí
  router.get("/", controller.getAll);
  router.post("/", controller.create); 
  router.post("/renovar", controller.renovarPlan); // <--- Aquí fallaba si el nombre estaba mal
  router.post("/cancelar", controller.cancelarPlan);

  return router;
};