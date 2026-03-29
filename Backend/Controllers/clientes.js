import { success, error } from "../Utils/responses.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendActivationEmail } from "../Utils/email.js";
// Asegúrate de tener este schema, si no, comenta la validación
import { validateCliente, validatePartialCliente } from "../Schemas/clientes.js";

export class ClienteController {
    constructor({ ClienteModel }) {
        this.ClienteModel = ClienteModel;
    }

    getAll = async (req, res) => {
        try {
            const clients = await this.ClienteModel.getAll();
            success(req, res, { body: clients }, 200);
        } catch (e) {
            console.error(e);
            error(req, res, "Error al obtener clientes", 500);
        }
    };

    create = async (req, res) => {
        // Validación Zod (Opcional si no tienes el archivo schema aún)
        const result = validateCliente(req.body);
        if (!result.success) return res.status(400).json(JSON.parse(result.error.message));

        try {
            const input = req.body;
            // Asignar contraseña temporal si no viene
            const tempPassword = input.password || Math.random().toString(36).slice(-8);
            input.password = await bcrypt.hash(tempPassword, 10);

            // Limpiar id_entrenador si viene vacío
            if (input.id_entrenador === "") input.id_entrenador = null;

            const newClient = await this.ClienteModel.create(input);

            // Generar token JWT para la activación
            const token = jwt.sign(
                { id: newClient.id_usuario }, // En el payload se envía el id del usuario ligado al cliente
                process.env.JWT_SECRET || 'secret', // Usa la variable de entorno
                { expiresIn: "24h" }
            );

            // Enviar correo de activación
            const activationLink = `http://localhost:5173/activate?token=${token}`;
            await sendActivationEmail(input.email, input.nombre, activationLink);

            success(req, res, newClient, 201);
        } catch (e) {
            this.handleDbError(e, res);
        }
    };

    update = async (req, res) => {
        try {
            const { id } = req.params;
            const input = req.body;
            if (input.id_entrenador === "") input.id_entrenador = null;

            const updated = await this.ClienteModel.update({ id, input });
            if (!updated) return error(req, res, "Cliente no encontrado", 404);

            success(req, res, updated, 200);
        } catch (e) {
            this.handleDbError(e, res);
        }
    };

    delete = async (req, res) => {
        try {
            await this.ClienteModel.delete({ id: req.params.id });
            success(req, res, { message: "Eliminado" }, 200);
        } catch (e) {
            error(req, res, "Error al eliminar", 500);
        }
    };

    getStats = async (req, res) => {
        try {
            const stats = await this.ClienteModel.getStats({ id: req.params.id });
            success(req, res, { body: stats }, 200);
        } catch (e) {
            console.error(e);
            error(req, res, "Error al cargar ficha", 500);
        }
    };

    // Helper de Errores DB
    handleDbError(e, res) {
        console.error("DB Error:", e);
        if (e.code === "23505") {
            if (e.detail?.includes("rut")) return res.status(409).json({ error: "El RUT ya está registrado." });
            if (e.detail?.includes("email")) return res.status(409).json({ error: "El Email ya está registrado." });
            return res.status(409).json({ error: "Dato duplicado." });
        }
        res.status(500).json({ error: "Error interno del servidor." });
    }
}