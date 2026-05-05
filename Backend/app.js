import express, { json } from "express";
import { corsMiddleware } from "./Middlewares/cors.js";
import morgan from "morgan";


//SECCION WEB -> ADMIN
import { createAuthRouter } from "./Routes/auth.js";
import { createEntrenadorRouter } from "./Routes/entrenadores.js";
import { createClienteRouter } from "./Routes/clientes.js";
import { createMembresiaRouter } from "./Routes/membresias.js";
import { createPagoRouter } from "./Routes/pagos.js";
import { createEjercicioRouter } from "./Routes/ejercicios.js";
import { createRutinaRouter } from "./Routes/rutinas.js";
import { createAsistenciaRouter } from "./Routes/asistencia.js";
import { createMedidaRouter } from "./Routes/medidas.js";
import { createProgresoRouter } from "./Routes/progreso.js";
import { createMaquinaRouter } from "./Routes/maquinas.js";
import { createReporteRouter } from "./Routes/reportes.js";
import { createDashboardRouter } from "./Routes/dashboard.js";
import { createPlanRouter } from "./Routes/planes.js";
import { createColaboradorRouter } from "./Routes/colaboradores.js";
import { createPerfilRouter } from "./Routes/perfil.js";
import { createConfiguracionRouter } from "./Routes/configuracion.js";
import { createNotificacionesRouter } from "./Routes/notificaciones.js";
import { createNotificationRouter } from "./Routes/notifications.js";
import { createSesionRouter } from "./Routes/sesiones.js";
import { createPlanEntrenamientoRouter } from "./Routes/plan_entrenamiento.js";

//SECCION MOVIL -> CLIENTE
import { createAppHomeRouter } from "./Routes/app_home.js";




// Actualizamos la función para recibir UserModel
export const createApp = ({
  UserModel,
  EntrenadorModel,
  ClienteModel,
  MembresiaModel,
  PagoModel,
  EjercicioModel,
  RutinaModel,
  AsistenciaModel,
  MedidaModel,
  ProgresoModel,
  MaquinaModel,
  ReporteModel,
  PlanModel,
  DashboardModel,
  ColaboradorModel,
  PerfilModel,
  ConfiguracionModel,
  SesionModel,
  PlanEntrenamientoModel,
  AppHomeModel
}) => {

  const app = express();
  app.disable("x-powered-by");
  app.use(json());
  app.use(corsMiddleware());
  app.use(morgan("dev"));

  // Ruta base de prueba
  app.get("/", (req, res) => res.send("GymTrack API v1.0 funcionando"));

  // Montar los routers
  app.use("/auth", createAuthRouter({ UserModel }));
  app.use("/entrenadores", createEntrenadorRouter({ EntrenadorModel }));
  app.use("/clientes", createClienteRouter({ ClienteModel }));
  app.use("/membresias", createMembresiaRouter({ MembresiaModel }));
  app.use("/pagos", createPagoRouter({ PagoModel }));
  app.use("/ejercicios", createEjercicioRouter({ EjercicioModel }));
  app.use("/rutinas", createRutinaRouter({ RutinaModel }));
  app.use("/acceso", createAsistenciaRouter({ AsistenciaModel }));
  app.use("/medidas", createMedidaRouter({ MedidaModel }));
  app.use("/progresos", createProgresoRouter({ ProgresoModel }));
  app.use("/inventario", createMaquinaRouter({ MaquinaModel }));
  app.use("/reportes", createReporteRouter({ ReporteModel }));
  app.use("/dashboard", createDashboardRouter({ DashboardModel }));
  app.use("/planes", createPlanRouter({ PlanModel }));
  app.use("/staff", createColaboradorRouter({ ColaboradorModel }));
  app.use("/perfil", createPerfilRouter(PerfilModel));
  app.use("/configuracion", createConfiguracionRouter(ConfiguracionModel));
  app.use("/notificaciones", createNotificacionesRouter());
  app.use("/notifications", createNotificationRouter());
  app.use("/sesiones", createSesionRouter({ SesionModel }));

  //SECCION MOVIL -> CLIENTE
  app.use("/app_home", createAppHomeRouter({ AppHomeModel }));

  //SECCION MOVIL -> ENTRENADOR
  app.use("/planes-entrenamiento",createPlanEntrenamientoRouter({ PlanEntrenamientoModel }));

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`GymTrack corriendo en http://localhost:${PORT}`);
  });
};
