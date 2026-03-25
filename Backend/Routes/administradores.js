//Routes/administradores.js

//El mapa de rutas. Conecta una URL con una función del controlador.

import { Router } from "express"; //enrutador de express
import { AdministradorController } from "../Controllers/administradores.js"; //controlador de administradores

//---------Exportamos una función factoría que recibe el Modelo.------------
export const createAdministradorRouter = ({ AdministradorModel }) => {
  // 1. Creamos una instancia del router.
  const router = Router();
  // 2. Instanciamos el Controlador inyectándole el Modelo recibido.
  const controller = new AdministradorController({ AdministradorModel });

  // 3. Definimos las rutas y las funciones del controlador asociadas.
  router.post("/", controller.create);
  router.get("/", controller.getAll);
  router.patch("/:id", controller.update);
  router.delete("/:id", controller.delete);

  // 4. Devolvemos el router configurado a la app.
  return router;
};
