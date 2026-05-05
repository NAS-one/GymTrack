import { createApp } from "./app.js";

// Modelos Web
import { UserModel } from "./Models/user.js";
import { EntrenadorModel } from "./Models/entrenador.js";
import { ClienteModel } from "./Models/cliente.js";
import { AdministradorModel } from "./Models/administrador.js";
import { MembresiaModel } from "./Models/membresia.js";
import { PagoModel } from "./Models/pago.js";
import { EjercicioModel } from "./Models/ejercicio.js";
import { RutinaModel } from "./Models/rutina.js";
import { AsistenciaModel } from "./Models/asistencia.js";
import { MedidaModel } from "./Models/medida.js";
import { ProgresoModel } from "./Models/progreso.js";
import { MaquinaModel } from "./Models/maquina.js";
import { ReporteModel } from "./Models/reporte.js";
import { PlanModel } from "./Models/plan.js";
import { DashboardModel } from "./Models/dashboard.js";
import { ColaboradorModel } from "./Models/colaborador.js";
import { PerfilModel } from "./Models/perfil.js";
import { ConfiguracionModel } from "./Models/configuracion.js";
import { SesionModel } from "./Models/sesion.js";

// Modelos Móvil
import { AppHomeModel } from "./Models/app_home.js";
import { PlanEntrenamientoModel } from "./Models/plan_entrenamiento.js";

createApp({
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
  AppHomeModel,
  PlanEntrenamientoModel,
});
