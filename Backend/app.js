import express, { json } from "express";
import { corsMiddleware } from "./Middlewares/cors.js";
import morgan from "morgan";

import { createAuthRouter } from "./Routes/auth.js";
import { createEntrenadorRouter } from "./Routes/entrenadores.js";
import { createClienteRouter } from "./Routes/clientes.js";
import { createAdministradorRouter } from "./Routes/administradores.js";
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

// Actualizamos la función para recibir UserModel
export const createApp = ({
  UserModel,
  EntrenadorModel,
  ClienteModel,
  AdministradorModel,
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
}) => {
  const app = express();
  app.disable("x-powered-by");
  app.use(json());
  app.use(corsMiddleware());
  app.use(morgan("dev"));

  // Ruta base de prueba
  app.get("/", (req, res) => res.send("GymTrack API v1.0 funcionando 🚀"));

  // Montar los routers con los modelos inyectados
  app.use("/auth", createAuthRouter({ UserModel })); // Inyectamos UserModel
  app.use("/entrenadores", createEntrenadorRouter({ EntrenadorModel })); // Montamos el router de Entrenadores
  app.use("/clientes", createClienteRouter({ ClienteModel })); // Montamos el router de Clientes
  app.use(
    "/administradores",
    createAdministradorRouter({ AdministradorModel }),
  ); // Montamos el router de Administradores
  app.use("/membresias", createMembresiaRouter({ MembresiaModel })); // Montamos el router de Membresías
  app.use("/pagos", createPagoRouter({ PagoModel })); // Montamos el router de Pagos
  app.use("/ejercicios", createEjercicioRouter({ EjercicioModel })); // <--- Montamos el router de Ejercicios
  app.use("/rutinas", createRutinaRouter({ RutinaModel })); // <--- Montamos el router de Rutinas
  app.use("/acceso", createAsistenciaRouter({ AsistenciaModel }));
  app.use("/medidas", createMedidaRouter({ MedidaModel })); // Montamos el router de Medidas
  app.use("/progresos", createProgresoRouter({ ProgresoModel })); // Montamos el router de Progresos
  app.use("/inventario", createMaquinaRouter({ MaquinaModel })); // Montamos el router de Máquinas
  app.use("/reportes", createReporteRouter({ ReporteModel })); // Montamos el router de Reportes
  app.use("/dashboard", createDashboardRouter({ DashboardModel }));
  app.use("/planes", createPlanRouter({ PlanModel }));
  app.use("/staff", createColaboradorRouter({ ColaboradorModel })); // Usaremos /staff como ruta
  app.use("/perfil", createPerfilRouter(PerfilModel));
  app.use("/configuracion", createConfiguracionRouter(ConfiguracionModel));
  app.use("/notificaciones", createNotificacionesRouter());
  app.use("/notifications", createNotificationRouter()); // <--- MONTADO EL SSE ROUTER
  app.use("/sesiones", createSesionRouter({ SesionModel }));
  app.use(
    "/planes-entrenamiento",
    createPlanEntrenamientoRouter({ PlanEntrenamientoModel }),
  );

  const PORT = process.env.PORT || 3000; // Puerto estándar 3000
  app.listen(PORT, () => {
    console.log(`💪 GymTrack corriendo en http://localhost:${PORT}`);
  });
};
