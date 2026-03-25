import { Router } from "express"; // Importar Router de express
import { EjercicioController } from "../Controllers/ejercicios.js"; // Importar el controlador de ejercicios

export const createEjercicioRouter = ({ EjercicioModel }) => {
  // 1.Crear una nueva instancia de Router
  const router = Router();
  // 2.Crear una instancia del controlador inyectando el modelo
  const controller = new EjercicioController({ EjercicioModel });

  // 3.Definimos las URLs base
  router.get("/", controller.getAll);
  router.post("/", controller.create);
  router.patch("/:id", controller.update);
  router.delete("/:id", controller.delete);

  return router;
};
