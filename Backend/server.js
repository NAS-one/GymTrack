import { createApp } from "./app.js";
import { UserModel } from "./Models/user.js"; //Importamos el modelo de usuario
import { EntrenadorModel } from "./Models/entrenador.js"; //Importamos el modelo de entrenador
import { ClienteModel } from "./Models/cliente.js"; //Importamos el modelo de cliente
import { AdministradorModel } from "./Models/administrador.js"; //Importamos el modelo de administrador
import { MembresiaModel } from "./Models/membresia.js"; //Importamos el modelo de membresía
import { PagoModel } from "./Models/pago.js"; //Importamos el modelo de pago
import { EjercicioModel } from "./Models/ejercicio.js"; // <--- Importamos el modelo de ejercicio
import { RutinaModel } from "./Models/rutina.js"; // <--- Importamos el modelo de rutina
import { AsistenciaModel } from "./Models/asistencia.js"; // Importamos el modelo de asistencia
import { MedidaModel } from "./Models/medida.js"; // Importamos el modelo de medida
import { ProgresoModel } from "./Models/progreso.js"; // Importamos el modelo de progreso
import { MaquinaModel } from "./Models/maquina.js"; // Importamos el modelo de máquina
import { ReporteModel } from "./Models/reporte.js";
import { PlanModel } from "./Models/plan.js";
import { DashboardModel } from "./Models/dashboard.js";
import { ColaboradorModel } from "./Models/colaborador.js"; // <--- IMPORTAR

// Inyectamos el modelo de usuarios
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
});
