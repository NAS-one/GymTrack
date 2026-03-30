import { Router } from "express";
import { AuthController } from "../Controllers/auth.js";

export const createAuthRouter = ({ UserModel }) => {
  const authRouter = Router();

  // Inyectamos el modelo al controlador
  const authController = new AuthController({ UserModel });

  // Definimos las rutas
  authRouter.post("/register", authController.register);
  authRouter.post("/login", authController.login);
  authRouter.post("/activate", authController.activateAccount);


  return authRouter;
};
