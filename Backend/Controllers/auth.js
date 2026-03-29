import { success, error } from "../Utils/responses.js";
import jwt from "jsonwebtoken"; // Importar jsonwebtoken para manejar tokens JWT
import bcrypt from "bcrypt"; // Importar bcrypt para hashear contraseñas
import { validateUser, userSchema } from "../Schemas/users.js";
import z from "zod";

export class AuthController {
    constructor({ UserModel }) {
        this.UserModel = UserModel;
    }

    // 1. REGISTRO DE USUARIO
    register = async (req, res) => {
        // 1. Validar datos de entrada con Zod
        const result = validateUser(req.body);

        if (!result.success) {
            // Estandarizado: 400 Bad Request
            return error(req, res, JSON.parse(result.error.message), 400);
        }

        const { username, email, password, role } = result.data;

        try {
            // 2. Encriptar la contraseña
            const hashedPassword = await bcrypt.hash(password, 10);

            // 3. Crear usuario en Base de Datos
            const newUser = await this.UserModel.create({
                username,
                email,
                password: hashedPassword,
                role,
            });

            // 4. Responder al cliente (201 Created)
            // Empaquetamos mensaje y usuario dentro del body
            success(
                req,
                res,
                {
                    message: "Usuario registrado exitosamente",
                    user: newUser,
                },
                201
            );
        } catch (e) {
            // Manejo de errores específicos del Modelo
            if (
                e.message === "El nombre de usuario ya está ocupado" ||
                e.message === "El email ya está registrado"
            ) {
                // Estandarizado: 409 Conflict
                return error(req, res, e.message, 409);
            }

            if (e.message === "El rol especificado no existe en la base de datos") {
                // Estandarizado: 400 Bad Request
                return error(req, res, e.message, 400);
            }

            // Error genérico
            console.error(e);
            error(req, res, "Error interno del servidor", 500);
        }
    };

    // 2. INICIO DE SESIÓN (LOGIN)
    login = async (req, res) => {
        const { username, password } = req.body;

        try {
            // 1. Buscar al usuario en la BD
            const user = await this.UserModel.login({ username });

            if (!user) {
                // Estandarizado: 401 Unauthorized
                return error(req, res, "Usuario no encontrado", 401);
            }

            // 2. Verificar si está activo (Soft Delete check)
            if (user.estado === "inactive") {
                // Estandarizado: 403 Forbidden
                return error(
                    req,
                    res,
                    "Cuenta desactivada. Contacte al administrador.",
                    403
                );
            }

            // 3. Comparar contraseñas
            const isValid = await bcrypt.compare(password, user.password);

            if (!isValid) {
                // Estandarizado: 401 Unauthorized
                return error(req, res, "Contraseña incorrecta", 401);
            }

            // 4. Generar el Token (JWT)
            const token = jwt.sign(
                { id: user.id, username: user.username, nombre: user.nombre, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: "2h" }
            );

            // 5. Responder
            // Quitamos la contraseña del objeto user antes de enviarlo
            const { password: _, ...publicUser } = user;

            // Estandarizado: 200 OK
            // El frontend recibirá: { error: false, status: 200, body: { message, user, token } }
            success(
                req,
                res,
                {
                    message: "Login exitoso",
                    user: publicUser,
                    token,
                },
                200
            );
        } catch (e) {
            console.error(e);
            error(req, res, "Error interno en el login", 500);
        }
    };

    // 3. ACTIVAR CUENTA
    activateAccount = async (req, res) => {
        const { token, password } = req.body;

        // Validación de la contraseña con los mismos requisitos
        const passValidation = z.object({ password: userSchema.shape.password }).safeParse({ password });
        if (!passValidation.success) {
            return error(req, res, JSON.parse(passValidation.error.message), 400);
        }

        try {
            // Verificar Token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            const userId = decoded.id;

            // Buscar usuario
            const user = await this.UserModel.findById({ id: userId });
            if (!user) {
                return error(req, res, "Usuario no encontrado", 404);
            }
            if (user.estado === 'active') {
                return error(req, res, "La cuenta ya ha sido activada", 400);
            }
            if (user.estado !== 'pendiente') {
                return error(req, res, "Estado de cuenta inválido para activación", 400);
            }

            // Encriptar nueva contraseña
            const hashedPassword = await bcrypt.hash(password, 10);

            // Activar cuenta
            const updatedUser = await this.UserModel.activateAccount({ id: userId, hashedPassword });
            if (!updatedUser) {
                return error(req, res, "No se pudo activar la cuenta", 500);
            }

            success(req, res, { message: "Cuenta activada exitosamente", user: updatedUser }, 200);
        } catch (e) {
            if (e.name === 'TokenExpiredError') {
                return error(req, res, "El enlace de activación ha expirado.", 401);
            } else if (e.name === 'JsonWebTokenError') {
                return error(req, res, "El enlace de activación es inválido.", 401);
            }
            console.error(e);
            error(req, res, "Error interno al activar la cuenta", 500);
        }
    };
}
