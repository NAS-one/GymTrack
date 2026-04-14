import { success, error } from "../Utils/responses.js";
import jwt from "jsonwebtoken"; 
import bcrypt from "bcrypt"; 
import { validateUser, userSchema } from "../Schemas/users.js";
import { send2FAEmail } from "../Utils/email.js";
import z from "zod";

export class AuthController {
    constructor({ UserModel }) {
        this.UserModel = UserModel;
    }

    // 1. REGISTRO DE USUARIO
    register = async (req, res) => {
        const result = validateUser(req.body);

        if (!result.success) {
            return error(req, res, JSON.parse(result.error.message), 400);
        }

        const { username, email, password, role } = result.data;

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await this.UserModel.create({
                username,
                email,
                password: hashedPassword,
                role,
            });

            success(req, res, { message: "Usuario registrado exitosamente", user: newUser }, 201);
        } catch (e) {
            if (e.message === "El nombre de usuario ya está ocupado" || e.message === "El email ya está registrado") {
                return error(req, res, e.message, 409);
            }
            if (e.message === "El rol especificado no existe en la base de datos") {
                return error(req, res, e.message, 400);
            }
            console.error(e);
            error(req, res, "Error interno del servidor", 500);
        }
        
    };

    // 2. INICIO DE SESIÓN (LOGIN) CON TODAS LAS POLÍTICAS (90 DÍAS Y 2FA)
    login = async (req, res) => {
        const { username, identificador, password } = req.body;
        const loginIdentifier = username || identificador;

        // --- Extracción de Dispositivo e IP ---
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'IP Desconocida';
        const ua = req.headers['user-agent'] || 'Desconocido';
        let os = "OS Desconocido"; let browser = "Navegador";
        if (ua.includes("Win")) os = "Windows"; else if (ua.includes("Mac")) os = "MacOS"; else if (ua.includes("Linux")) os = "Linux"; else if (ua.includes("Android")) os = "Android"; else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
        if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome"; else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari"; else if (ua.includes("Firefox")) browser = "Firefox"; else if (ua.includes("Edg")) browser = "Edge";
        const dispositivo = `${os} - ${browser}`;

        try {
            const user = await this.UserModel.login({ username: loginIdentifier });
            if (!user) return error(req, res, "Usuario no encontrado", 401);

            if (user.estado === "inactive") {
                await this.UserModel.logSession({ id_usuario: user.id, ip_address: ipAddress, dispositivo, estado: 'failed_inactive' });
                return error(req, res, "Cuenta desactivada. Contacte al administrador.", 403);
            }

            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) {
                await this.UserModel.logSession({ id_usuario: user.id, ip_address: ipAddress, dispositivo, estado: 'failed_password' });
                return error(req, res, "Contraseña incorrecta", 401);
            }

            // 🌟 PARSEO DE POLÍTICAS DESDE LA BASE DE DATOS
            let politicas = user.politicas_seguridad;
            if (typeof politicas === 'string') {
                try { politicas = JSON.parse(politicas); } catch(e) { politicas = {}; }
            }

            // 🌟 A. POLÍTICA DE 90 DÍAS
            const forzarCambio = politicas?.forzar_cambio_password === true;
            const limiteDias = politicas?.dias_caducidad || 90;
            const fechaUltimaActualizacion = user.ultima_actualizacion_password ? new Date(user.ultima_actualizacion_password) : new Date(user.created_at);
            const diasTranscurridos = (new Date() - fechaUltimaActualizacion) / (1000 * 60 * 60 * 24);

            if (forzarCambio && user.role !== 'cliente' && diasTranscurridos > limiteDias) {
                await this.UserModel.logSession({ id_usuario: user.id, ip_address: ipAddress, dispositivo, estado: 'password_expired' });
                return res.status(403).json({
                    error: true, status: 403,
                    body: {
                        message: `Por políticas de seguridad, tu contraseña ha expirado (más de ${limiteDias} días). Debes crear una nueva.`,
                        requirePasswordChange: true, userId: user.id
                    }
                });
            }

            // 🌟 B. POLÍTICA 2FA (Verificación de nuevo dispositivo)
            const require2FA = politicas?.autenticacion_2fa === true;
            
            if (require2FA && user.role !== 'cliente') {
                const isTrusted = await this.UserModel.isDeviceTrusted(user.id, dispositivo);
                
                if (!isTrusted) {
                    // Generar código aleatorio de 6 dígitos
                    const code = Math.floor(100000 + Math.random() * 900000).toString();
                    
                    // Guardar código en BD
                    await this.UserModel.set2FACode(user.id, code);
                    
                    // Enviar Correo en segundo plano (promesa sin await para que el frontend no espere)
                    send2FAEmail(user.email, code, dispositivo, ipAddress).catch(err => console.error("Fallo enviando correo 2FA", err));

                    await this.UserModel.logSession({ id_usuario: user.id, ip_address: ipAddress, dispositivo, estado: 'pending_2fa' });

                    // Devolver 403 con bandera para abrir modal de 6 dígitos
                    return res.status(403).json({
                        error: true, status: 403,
                        body: {
                            message: "Dispositivo nuevo detectado. Revisa tu correo.",
                            require2FA: true, userId: user.id, email: user.email
                        }
                    });
                }
            }

            // Si pasa todas las pruebas, Acceso Exitoso
            await this.UserModel.logSession({ id_usuario: user.id, ip_address: ipAddress, dispositivo, estado: 'success' });
            const token = jwt.sign({ id: user.id, username: user.username, nombre: user.nombre, role: user.role }, process.env.JWT_SECRET, { expiresIn: "2h" });
            const { password: _, ...publicUser } = user;
            success(req, res, { message: "Login exitoso", user: publicUser, token }, 200);

        } catch (e) {
            console.error(e);
            error(req, res, "Error interno en el login", 500);
        }
    };

    // 3. ACTIVAR CUENTA
    activateAccount = async (req, res) => {
        const { token, password } = req.body;

        const passValidation = z.object({ password: userSchema.shape.password }).safeParse({ password });
        if (!passValidation.success) {
            return error(req, res, JSON.parse(passValidation.error.message), 400);
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            const userId = decoded.id;

            const user = await this.UserModel.findById({ id: userId });
            if (!user) return error(req, res, "Usuario no encontrado", 404);
            if (user.estado === 'active') return error(req, res, "La cuenta ya ha sido activada", 400);
            if (user.estado !== 'pendiente') return error(req, res, "Estado de cuenta inválido para activación", 400);

            const hashedPassword = await bcrypt.hash(password, 10);

            const updatedUser = await this.UserModel.activateAccount({ id: userId, hashedPassword });
            if (!updatedUser) return error(req, res, "No se pudo activar la cuenta", 500);

            success(req, res, { message: "Cuenta activada exitosamente", user: updatedUser }, 200);
        } catch (e) {
            if (e.name === 'TokenExpiredError') return error(req, res, "El enlace de activación ha expirado.", 401);
            if (e.name === 'JsonWebTokenError') return error(req, res, "El enlace de activación es inválido.", 401);
            console.error(e);
            error(req, res, "Error interno al activar la cuenta", 500);
        }
    };

    // 4. FORZAR CAMBIO DE CONTRASEÑA (Por política de 90 días) 
    forcePasswordChange = async (req, res) => {
        const { username, currentPassword, newPassword } = req.body;

        try {
            // 1. Buscar usuario
            const user = await this.UserModel.login({ username });
            if (!user) return error(req, res, "Usuario no encontrado", 404);

            // 2. Verificar contraseña actual (medida de seguridad por si alguien intercepta la petición)
            const isValid = await bcrypt.compare(currentPassword, user.password);
            if (!isValid) return error(req, res, "La contraseña actual es incorrecta", 401);

            // 3. Hashear nueva contraseña
            const hashedNewPassword = await bcrypt.hash(newPassword, 10);

            // 4. Actualizar contraseña y REINICIAR el contador de fecha
            await this.UserModel.updatePasswordAndResetDate({ 
                id: user.id, 
                hashedPassword: hashedNewPassword 
            });

            // 5. Generar el Token (Igual que en un Login exitoso)
            const token = jwt.sign(
                { id: user.id, username: user.username, nombre: user.nombre, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: "2h" }
            );

            const { password: _, ...publicUser } = user;

            // 6. Retornar éxito con Token
            success(req, res, { 
                message: "Contraseña actualizada exitosamente", 
                user: publicUser, 
                token 
            }, 200);

        } catch (e) {
            console.error(e);
            error(req, res, "Error interno al forzar el cambio de contraseña", 500);
        }
    };

    // 5. VERIFICAR CÓDIGO 2FA
    verify2FA = async (req, res) => {
        const { userId, code } = req.body;

        // Detección de dispositivo EXACTAMENTE igual a la del login
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'IP Desconocida';
        const ua = req.headers['user-agent'] || 'Desconocido';
        let os = "OS Desconocido"; let browser = "Navegador";
        
        if (ua.includes("Win")) os = "Windows"; 
        else if (ua.includes("Mac")) os = "MacOS"; 
        else if (ua.includes("Linux")) os = "Linux"; 
        else if (ua.includes("Android")) os = "Android"; 
        else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

        if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome"; 
        else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari"; 
        else if (ua.includes("Firefox")) browser = "Firefox"; 
        else if (ua.includes("Edg")) browser = "Edge";

        const dispositivo = `${os} - ${browser}`;

        try {
            // 1. Validar código
            const isValid = await this.UserModel.verify2FACode(userId, code);

            if (!isValid) {
                await this.UserModel.logSession({ id_usuario: userId, ip_address: ipAddress, dispositivo, estado: 'failed_2fa' });
                return error(req, res, "El código es incorrecto o ha expirado.", 401);
            }

            // 2. Marcar como confiable con la MISMA cadena de texto
            await this.UserModel.markDeviceAsTrusted(userId, ipAddress, dispositivo);

            // 3. 🌟 CORRECCIÓN 2: Traer datos con Rol
            const user = await this.UserModel.findById({ id: userId }); 
            if (!user) return error(req, res, "Error al generar sesión", 500);

            // 4. Firmar el Token
            const token = jwt.sign(
                { id: user.id, username: user.username, nombre: user.nombre, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: "2h" }
            );

            const { password: _, ...publicUser } = user;

            // 5. Dar Acceso
            success(req, res, { message: "Verificación exitosa", user: publicUser, token }, 200);

        } catch (e) {
            console.error(e);
            error(req, res, "Error interno al verificar 2FA", 500);
        }
    };
}