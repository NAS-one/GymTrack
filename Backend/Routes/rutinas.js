import { Router } from "express"; // Importar Router desde express
import { RutinaController } from "../Controllers/rutinas.js"; // Importar el controlador de rutinas
import { verifyToken } from "../Middlewares/auth.js";

// Crear la función que genera el router con el modelo inyectado

export const createRutinaRouter = ({ RutinaModel }) => {
  //1. instanciamos la clase Router
  const router = Router();
  //2. Creamos una instancia del controlador con el modelo inyectado
  const controller = new RutinaController({ RutinaModel });

  //3. Definimos las rutas y las vinculamos a los métodos del controlador
  router.post("/", controller.create);
  router.get("/", controller.getAll);
  router.get("/active/:id_cliente", controller.getActiveByClient); // Endpoint clave para la App
  router.put("/:id", controller.update);
  // Ruta para obtener las plantillas del entrenador logueado
  router.get(
    "/plantillas/mis-plantillas",
    verifyToken,
    controller.getPlantillas,
  );
  //Ruta para eliminar rutinas
  router.delete("/:id", controller.delete);
  //Ruta para asignar plantillas
  router.post(
    "/:id_plantilla/asignar",
    verifyToken,
    controller.asignarPlantilla,
  );
  return router;
};
