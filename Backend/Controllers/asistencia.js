import { success, error } from "../Utils/responses.js";
import { dispararAlertaStaff } from "../Utils/alertas.js";

// Cache en memoria para evitar spam de escaneos (Rate Limiting)
const recentScans = new Map();

export class AsistenciaController {
    constructor({ AsistenciaModel }) {
        this.AsistenciaModel = AsistenciaModel;
    }

    registrarAcceso = async (req, res) => {
        const { identificador } = req.body;
        if (!identificador) return error(req, res, "Identificador requerido", 400);

        try {
            const resultado = await this.AsistenciaModel.registrarNuevoAcceso(identificador);

            if (resultado.estado_acceso === "aprobado") {
                // 🌟 CORREGIDO: Usamos "ingreso_exitoso" para que el toast sea Verde
                dispararAlertaStaff("Acceso Permitido", `${resultado.nombre} ha ingresado correctamente.`, "ingreso_exitoso");
                return success(req, res, resultado, 200);
            }

            // 🌟 CORREGIDO: Usamos "ingreso_denegado" para que el toast sea Rojo
            dispararAlertaStaff("ACCESO DENEGADO", `${resultado.nombre}: ${resultado.mensaje || 'Consulte en recepción'}`, "ingreso_denegado");

            return res.status(200).json({
                error: true,
                status: 403,
                body: resultado,
            });
        } catch (e) {
            if (e.message === "USUARIO_NO_ENCONTRADO") {
                // 🌟 CORREGIDO: Usamos "alerta_sistema" para Naranja/Advertencia
                dispararAlertaStaff("USUARIO DESCONOCIDO", `Intento de acceso con identificador no registrado: ${identificador}`, "alerta_sistema");

                return res.status(200).json({
                    error: true,
                    body: {
                        nombre: "Desconocido",
                        mensaje: "RUT no registrado en el sistema",
                        estado_acceso: "denegado",
                    },
                });
            }
            return error(req, res, "Error interno", 500);
        }
    };

    scanCheckIn = async (req, res) => {
        const { id_usuario, gym_id } = req.body;

        if (!id_usuario || !gym_id) {
            return error(req, res, "Datos de QR insuficientes", 400);
        }

        // 1. Control Anti-Spam (Debounce de 5 minutos)
        const now = Date.now();
        const lastScanTime = recentScans.get(id_usuario);
        const FIVE_MINUTES = 5 * 60 * 1000;

        if (lastScanTime && (now - lastScanTime) < FIVE_MINUTES) {
            return success(req, res, {
                estado_acceso: 'denegado',
                mensaje: 'Ya has registrado tu acceso recientemente. Espera 5 minutos.'
            }, 200);
        }

        try {
            // 2. Registrar el acceso en la DB
            const resultado = await this.AsistenciaModel.registrarNuevoAcceso(id_usuario.toString());

            // Actualizamos el cache de escáner
            recentScans.set(id_usuario, now);

            // 3. Empujar Notificación en Tiempo Real al Administrador (SSE)
            if (resultado.estado_acceso === "aprobado") {
                // 🌟 CORREGIDO
                dispararAlertaStaff("Nuevo Ingreso", `${resultado.nombre} acaba de hacer check-in. ¡Pase libre!`, "ingreso_exitoso");
            } else {
                // 🌟 CORREGIDO
                dispararAlertaStaff("Acceso Denegado", `${resultado.nombre} intentó ingresar. ${resultado.mensaje}`, "ingreso_denegado");
            }

            // 4. Responder al celular del cliente
            return success(req, res, resultado, 200);

        } catch (e) {
            if (e.message === "USUARIO_NO_ENCONTRADO") {
                return success(req, res, {
                    estado_acceso: 'denegado',
                    mensaje: 'Usuario no registrado en el sistema.'
                }, 200);
            }
            console.error("[ScanCheckIn Error]", e);
            return error(req, res, "Error interno al procesar escaneo", 500);
        }
    };

    getAll = async (req, res) => {
        try {
            const { year, month, day, type } = req.query; 
            const logs = await this.AsistenciaModel.getAll({ year, month, day, type });
            success(req, res, logs, 200);
        } catch (e) {
            console.error(e);
            error(req, res, "Error al obtener historial", 500);
        }
    };
}