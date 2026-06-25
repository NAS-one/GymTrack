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
  authRouter.post("/force-password-change", authController.forcePasswordChange);
  authRouter.post("/verify-2fa", authController.verify2FA);

  // RUTAS PÚBLICAS (Auto-registro)
  authRouter.post("/self-register", authController.selfRegister);
  authRouter.get("/plans", authController.getPublicPlans);
  authRouter.post("/verify-registration-code", authController.verifyRegistrationCode);
  authRouter.post("/resend-registration-code", authController.resendRegistrationCode);


  return authRouter;
};
