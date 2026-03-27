import { Router } from "express";
import { ReporteController } from "../Controllers/reportes.js";
import { ReporteModel } from "../Models/reporte.js"; // Verifica que el nombre del archivo coincida
import { verifyToken } from "../Middlewares/auth.js"; // Importante para la seguridad

export const createReporteRouter = () => {
  const reporteRouter = Router();
  
  // Instanciamos el controlador inyectándole el modelo
  const reporteController = new ReporteController({ ReporteModel });

  // 1. Ruta para CREAR un reporte (POST)
  // Usamos verifyToken para asegurarnos de que solo admins entren y obtener el req.user.id
  reporteRouter.post("/", verifyToken, reporteController.create);

  // 2. Ruta para OBTENER todos los reportes (GET)
  reporteRouter.get("/", verifyToken, reporteController.getAll);

  // 3. Ruta para ELIMINAR un reporte (DELETE)
  reporteRouter.delete("/:id", verifyToken, reporteController.delete);

  return reporteRouter;
};