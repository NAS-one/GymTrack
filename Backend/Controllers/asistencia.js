import { success, error } from "../Utils/responses.js";
import { sendNotification } from "../Utils/sse.js";

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
                return success(req, res, resultado, 200);
            }

            return res.status(200).json({
                error: true,
                status: 403,
                body: resultado,
            });
        } catch (e) {
            if (e.message === "USUARIO_NO_ENCONTRADO") {
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
            // El modelo ya sabe buscar por id_usuario si le pasamos el string/numero
            const resultado = await this.AsistenciaModel.registrarNuevoAcceso(id_usuario.toString());

            // Actualizamos el cache de escáner
            recentScans.set(id_usuario, now);

            // 3. Empujar Notificación en Tiempo Real al Administrador (SSE)
            if (resultado.estado_acceso === "aprobado") {
                sendNotification({
                    type: 'success',
                    title: 'Nuevo Ingreso',
                    message: `${resultado.nombre} acaba de hacer check-in. ¡Pase libre!`,
                    data: resultado
                });
            } else {
                // Opcional: Notificar denegados también
                sendNotification({
                    type: 'error',
                    title: 'Acceso Denegado',
                    message: `${resultado.nombre} intentó ingresar. ${resultado.mensaje}`,
                    data: resultado
                });
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
            const { year, month, day, type } = req.query; // Leemos 'type' también
            const logs = await this.AsistenciaModel.getAll({ year, month, day, type });
            success(req, res, logs, 200);
        } catch (e) {
            console.error(e);
            error(req, res, "Error al obtener historial", 500);
        }
    };
}
