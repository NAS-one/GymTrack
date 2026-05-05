import { success, error } from "../Utils/responses.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { validateUser, userSchema } from "../Schemas/users.js";
import { validateSelfRegister } from "../Schemas/selfRegister.js";
import { send2FAEmail, sendSelfRegistrationEmail, sendRegistrationCodeEmail, sendPasswordResetCodeEmail } from "../Utils/email.js";
import { sql } from "../bd.js";
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

      success(
        req,
        res,
        { message: "Usuario registrado exitosamente", user: newUser },
        201,
      );
    } catch (e) {
      if (
        e.message === "El nombre de usuario ya está ocupado" ||
        e.message === "El email ya está registrado"
      ) {
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
    const loginIdentifier = (username || identificador || "").trim();

    // Validación de campos vacíos
    if (!loginIdentifier) {
      return error(req, res, "El usuario es obligatorio", 400);
    }
    if (!password || password.trim().length === 0) {
      return error(req, res, "La contraseña es obligatoria", 400);
    }

    // --- Extracción de Dispositivo e IP ---
    const ipAddress =
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress ||
      "IP Desconocida";
    const ua = req.headers["user-agent"] || "Desconocido";
    let os = "OS Desconocido";
    let browser = "Navegador";
    if (ua.includes("Win")) os = "Windows";
    else if (ua.includes("Mac")) os = "MacOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
    if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
    else if (ua.includes("Safari") && !ua.includes("Chrome"))
      browser = "Safari";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Edg")) browser = "Edge";
    const dispositivo = `${os} - ${browser}`;

    try {
      const user = await this.UserModel.login({ username: loginIdentifier });
      if (!user) return error(req, res, "Usuario no encontrado", 401);

      if (user.estado === "inactive") {
        await this.UserModel.logSession({
          id_usuario: user.id,
          ip_address: ipAddress,
          dispositivo,
          estado: "failed_inactive",
        });
        return error(
          req,
          res,
          "Cuenta desactivada. Contacte al administrador.",
          403,
        );
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        await this.UserModel.logSession({
          id_usuario: user.id,
          ip_address: ipAddress,
          dispositivo,
          estado: "failed_password",
        });
        return error(req, res, "Contraseña incorrecta", 401);
      }

      //PARSEO DE POLÍTICAS DESDE LA BASE DE DATOS
      let politicas = user.politicas_seguridad;
      if (typeof politicas === "string") {
        try {
          politicas = JSON.parse(politicas);
        } catch (e) {
          politicas = {};
        }
      }

      //A. POLÍTICA DE 90 DÍAS
      const forzarCambio = politicas?.forzar_cambio_password === true;
      const limiteDias = politicas?.dias_caducidad || 90;
      const fechaUltimaActualizacion = user.ultima_actualizacion_password
        ? new Date(user.ultima_actualizacion_password)
        : new Date(user.created_at);
      const diasTranscurridos =
        (new Date() - fechaUltimaActualizacion) / (1000 * 60 * 60 * 24);

      if (
        forzarCambio &&
        user.role !== "cliente" &&
        diasTranscurridos > limiteDias
      ) {
        await this.UserModel.logSession({
          id_usuario: user.id,
          ip_address: ipAddress,
          dispositivo,
          estado: "password_expired",
        });
        return res.status(403).json({
          error: true,
          status: 403,
          body: {
            message: `Por políticas de seguridad, tu contraseña ha expirado (más de ${limiteDias} días). Debes crear una nueva.`,
            requirePasswordChange: true,
            userId: user.id,
          },
        });
      }

      //B. POLÍTICA 2FA (Verificación de nuevo dispositivo)
      const require2FA = politicas?.autenticacion_2fa === true;

      if (require2FA && user.role !== "cliente") {
        const isTrusted = await this.UserModel.isDeviceTrusted(
          user.id,
          dispositivo,
        );

        if (!isTrusted) {
          // Generar código aleatorio de 6 dígitos
          const code = Math.floor(100000 + Math.random() * 900000).toString();

          // Guardar código en BD
          await this.UserModel.set2FACode(user.id, code);

          // Enviar Correo en segundo plano (promesa sin await para que el frontend no espere)
          send2FAEmail(user.email, code, dispositivo, ipAddress).catch((err) =>
            console.error("Fallo enviando correo 2FA", err),
          );

          await this.UserModel.logSession({
            id_usuario: user.id,
            ip_address: ipAddress,
            dispositivo,
            estado: "pending_2fa",
          });

          // Devolver 403 con bandera para abrir modal de 6 dígitos
          return res.status(403).json({
            error: true,
            status: 403,
            body: {
              message: "Dispositivo nuevo detectado. Revisa tu correo.",
              require2FA: true,
              userId: user.id,
              email: user.email,
            },
          });
        }
      }

      // Si pasa todas las pruebas, Acceso Exitoso
      await this.UserModel.logSession({
        id_usuario: user.id,
        ip_address: ipAddress,
        dispositivo,
        estado: "success",
      });
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          nombre: user.nombre,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "2h" },
      );
      const { password: _, ...publicUser } = user;
      success(
        req,
        res,
        { message: "Login exitoso", user: publicUser, token },
        200,
      );
    } catch (e) {
      console.error(e);
      error(req, res, "Error interno en el login", 500);
    }
  };

  // 3. ACTIVAR CUENTA
  activateAccount = async (req, res) => {
    const { token, password } = req.body;

    const passValidation = z
      .object({ password: userSchema.shape.password })
      .safeParse({ password });
    if (!passValidation.success) {
      return error(req, res, JSON.parse(passValidation.error.message), 400);
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
      const userId = decoded.id;

      const user = await this.UserModel.findById({ id: userId });
      if (!user) return error(req, res, "Usuario no encontrado", 404);
      if (user.estado === "active")
        return error(req, res, "La cuenta ya ha sido activada", 400);
      if (user.estado !== "pendiente")
        return error(
          req,
          res,
          "Estado de cuenta inválido para activación",
          400,
        );

      const hashedPassword = await bcrypt.hash(password, 10);

      const updatedUser = await this.UserModel.activateAccount({
        id: userId,
        hashedPassword,
      });
      if (!updatedUser)
        return error(req, res, "No se pudo activar la cuenta", 500);

      success(
        req,
        res,
        { message: "Cuenta activada exitosamente", user: updatedUser },
        200,
      );
    } catch (e) {
      if (e.name === "TokenExpiredError")
        return error(req, res, "El enlace de activación ha expirado.", 401);
      if (e.name === "JsonWebTokenError")
        return error(req, res, "El enlace de activación es inválido.", 401);
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
      if (!isValid)
        return error(req, res, "La contraseña actual es incorrecta", 401);

      // 3. Hashear nueva contraseña
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // 4. Actualizar contraseña y REINICIAR el contador de fecha
      await this.UserModel.updatePasswordAndResetDate({
        id: user.id,
        hashedPassword: hashedNewPassword,
      });

      // 5. Generar el Token (Igual que en un Login exitoso)
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          nombre: user.nombre,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "2h" },
      );

      const { password: _, ...publicUser } = user;

      // 6. Retornar éxito con Token
      success(
        req,
        res,
        {
          message: "Contraseña actualizada exitosamente",
          user: publicUser,
          token,
        },
        200,
      );
    } catch (e) {
      console.error(e);
      error(req, res, "Error interno al forzar el cambio de contraseña", 500);
    }
  };

  // 5. VERIFICAR CÓDIGO 2FA
  verify2FA = async (req, res) => {
    const { userId, code } = req.body;

    // Detección de dispositivo EXACTAMENTE igual a la del login
    const ipAddress =
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress ||
      "IP Desconocida";
    const ua = req.headers["user-agent"] || "Desconocido";
    let os = "OS Desconocido";
    let browser = "Navegador";

    if (ua.includes("Win")) os = "Windows";
    else if (ua.includes("Mac")) os = "MacOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

    if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
    else if (ua.includes("Safari") && !ua.includes("Chrome"))
      browser = "Safari";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Edg")) browser = "Edge";

    const dispositivo = `${os} - ${browser}`;

    try {
      // 1. Validar código
      const isValid = await this.UserModel.verify2FACode(userId, code);

      if (!isValid) {
        await this.UserModel.logSession({
          id_usuario: userId,
          ip_address: ipAddress,
          dispositivo,
          estado: "failed_2fa",
        });
        return error(req, res, "El código es incorrecto o ha expirado.", 401);
      }

      // 2. Marcar como confiable con la MISMA cadena de texto
      await this.UserModel.markDeviceAsTrusted(userId, ipAddress, dispositivo);

      // 3.CORRECCIÓN 2: Traer datos con Rol
      const user = await this.UserModel.findById({ id: userId });
      if (!user) return error(req, res, "Error al generar sesión", 500);

      // 4. Firmar el Token
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          nombre: user.nombre,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "2h" },
      );

      const { password: _, ...publicUser } = user;

      // 5. Dar Acceso
      success(
        req,
        res,
        { message: "Verificación exitosa", user: publicUser, token },
        200,
      );
    } catch (e) {
      console.error(e);
      error(req, res, "Error interno al verificar 2FA", 500);
    }
  };

  // 6. AUTO-REGISTRO PÚBLICO DE CLIENTES
  selfRegister = async (req, res) => {
    // 1. Validar datos con schema Zod
    const result = validateSelfRegister(req.body);
    if (!result.success) {
      const errors = JSON.parse(result.error.message);
      const messages = errors.map((e) => e.message);
      return error(req, res, messages, 400);
    }

    const {
      nombre,
      rut,
      email,
      password,
      fecha_nacimiento,
      direccion,
      codigo_postal,
      objetivo,
      genero,
      id_plan,
    } = result.data;

    try {
      // 2. Verificar unicidad de RUT y limpiar pendientes si existen
      const [existingRut] = await sql`
        SELECT c.id as id_cliente, u.estado, u.id as id_usuario 
        FROM clientes c 
        JOIN usuarios u ON c.id_usuario = u.id 
        WHERE c.rut = ${rut}
      `;
      if (existingRut) {
        const isPending = existingRut.estado === 'pendiente' || existingRut.estado === 'pending';
        if (isPending) {
          // Si está pendiente (no validado), lo eliminamos para permitir crear uno nuevo
          await sql`DELETE FROM membresias WHERE id_cliente = ${existingRut.id_cliente}`;
          await sql`DELETE FROM clientes WHERE id = ${existingRut.id_cliente}`;
          await sql`DELETE FROM usuarios WHERE id = ${existingRut.id_usuario}`;
        } else {
          return error(req, res, "Este RUT ya se encuentra registrado en el sistema", 409);
        }
      }

      // 3. Verificar unicidad de email y limpiar pendientes si existen
      const [existingEmail] = await sql`
        SELECT id, estado FROM usuarios WHERE email = ${email}
      `;
      if (existingEmail) {
        const isPending = existingEmail.estado === 'pendiente' || existingEmail.estado === 'pending';
        if (isPending) {
          // Si el correo está en un registro pendiente distinto, lo limpiamos también
          const [client] = await sql`SELECT id FROM clientes WHERE id_usuario = ${existingEmail.id}`;
          if (client) {
             await sql`DELETE FROM membresias WHERE id_cliente = ${client.id}`;
             await sql`DELETE FROM clientes WHERE id = ${client.id}`;
          }
          await sql`DELETE FROM usuarios WHERE id = ${existingEmail.id}`;
        } else {
          return error(req, res, "Este correo electrónico ya está registrado. Si ya tienes cuenta, inicia sesión.", 409);
        }
      }

      // 4. Transacción: Crear usuario + cliente + membresía (si aplica)
      const newClient = await sql.begin(async (tx) => {
        // A. Obtener rol de cliente
        const [role] = await tx`SELECT id FROM roles WHERE nombre = 'cliente'`;
        if (!role) throw new Error("Rol 'cliente' no configurado en la BD");

        // B. Hash de contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // C. Crear username a partir del email
        const baseUsername = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
        // Verificar si el username ya existe y agregar sufijo si es necesario
        let finalUsername = baseUsername;
        const [existingUsername] = await tx`SELECT id FROM usuarios WHERE username = ${baseUsername}`;
        if (existingUsername) {
          finalUsername = `${baseUsername}${Date.now().toString().slice(-4)}`;
        }

        // D. Crear usuario con estado 'pendiente'
        const [newUser] = await tx`
          INSERT INTO usuarios (username, email, password, estado, id_rol)
          VALUES (${finalUsername}, ${email}, ${hashedPassword}, 'pendiente', ${role.id})
          RETURNING id, username, email
        `;

        // E. Crear cliente
        const [client] = await tx`
          INSERT INTO clientes (rut, nombre, fecha_nacimiento, genero, direccion, objetivo, id_usuario)
          VALUES (${rut}, ${nombre}, ${fecha_nacimiento}, ${genero || null}, ${direccion}, ${objetivo || null}, ${newUser.id})
          RETURNING *
        `;

        // F. Si eligió plan, crear membresía (estado pendiente hasta activar cuenta)
        let planInfo = null;
        if (id_plan) {
          const [plan] = await tx`SELECT * FROM planes WHERE id = ${id_plan} AND estado = 'active'`;
          if (plan) {
            const fechaInicio = new Date();
            const fechaFin = new Date();
            fechaFin.setMonth(fechaFin.getMonth() + plan.duracion_meses);

            await tx`
              INSERT INTO membresias (id_plan, fecha_inicio, fecha_fin, estado, id_cliente)
              VALUES (${plan.id}, ${fechaInicio}, ${fechaFin}, 'pending', ${client.id})
            `;
            planInfo = plan;
          }
        }

        return { user: newUser, client, planInfo };
      });

      // 5. Generar código OTP (6 dígitos)
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await this.UserModel.set2FACode(newClient.user.id, code);

      // 6. Enviar correo en segundo plano con el código
      sendRegistrationCodeEmail(
        email,
        nombre.split(" ")[0], // Solo el primer nombre
        code,
        newClient.planInfo
      ).catch((err) => console.error("Error enviando correo de registro:", err));

      // 8. Respuesta exitosa
      success(
        req,
        res,
        {
          message: "Registro exitoso. Revisa tu correo electrónico para activar tu cuenta.",
          email: newClient.user.email,
          userId: newClient.user.id,
        },
        201
      );
    } catch (e) {
      console.error("[SelfRegister] Error:", e);
      if (e.code === "23505") {
        if (e.message?.includes("rut"))
          return error(req, res, "Este RUT ya está registrado", 409);
        if (e.message?.includes("email"))
          return error(req, res, "Este correo ya está registrado", 409);
        if (e.message?.includes("username"))
          return error(req, res, "Error de usuario duplicado, intenta nuevamente", 409);
      }
      error(req, res, "Error interno en el registro", 500);
    }
  };

  // 7. OBTENER PLANES PÚBLICOS (Sin autenticación)
  getPublicPlans = async (req, res) => {
    try {
      const plans = await sql`
        SELECT id, nombre, precio, duracion_meses, descripcion
        FROM planes
        WHERE estado = 'active'
        ORDER BY precio ASC
      `;
      success(req, res, plans, 200);
    } catch (e) {
      console.error(e);
      error(req, res, "Error al obtener los planes", 500);
    }
  };

  // 8. VERIFICAR CÓDIGO DE REGISTRO
  verifyRegistrationCode = async (req, res) => {
    const { userId, code } = req.body;
    try {
      const isValid = await this.UserModel.verify2FACode(userId, code);
      if (!isValid) return error(req, res, "El código es incorrecto o ha expirado.", 401);

      // Activar cuenta
      await sql`
        UPDATE usuarios 
        SET estado = 'active', codigo_2fa = NULL, expiracion_2fa = NULL 
        WHERE id = ${userId}
      `;

      success(req, res, { message: "Cuenta verificada y activada exitosamente." }, 200);
    } catch (e) {
      console.error(e);
      error(req, res, "Error interno al verificar el código", 500);
    }
  };

  // 9. REENVIAR CÓDIGO DE REGISTRO / ACTUALIZAR EMAIL
  resendRegistrationCode = async (req, res) => {
    const { userId, newEmail } = req.body;
    try {
      const [user] = await sql`SELECT * FROM usuarios WHERE id = ${userId}`;
      if (!user) return error(req, res, "Usuario no encontrado", 404);

      let targetEmail = user.email;
      if (newEmail && newEmail !== user.email) {
        const [existing] = await sql`SELECT id FROM usuarios WHERE email = ${newEmail}`;
        if (existing) return error(req, res, "El correo ya está registrado por otro usuario", 409);
        
        await sql`UPDATE usuarios SET email = ${newEmail} WHERE id = ${userId}`;
        targetEmail = newEmail;
      }

      const [client] = await sql`SELECT nombre FROM clientes WHERE id_usuario = ${userId}`;
      const nombre = client ? client.nombre.split(" ")[0] : user.username;

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await this.UserModel.set2FACode(userId, code);

      sendRegistrationCodeEmail(targetEmail, nombre, code, null).catch(err => console.error("Error re-enviando código", err));

      success(req, res, { message: "Código reenviado exitosamente", email: targetEmail }, 200);
    } catch (e) {
      console.error(e);
      error(req, res, "Error interno al reenviar el código", 500);
    }
  };

  // 10. SOLICITAR CÓDIGO DE RECUPERACIÓN DE CONTRASEÑA
  forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) return error(req, res, "El correo es obligatorio", 400);

    try {
      // Buscar usuario por email
      const [user] = await sql`
        SELECT id, email, estado FROM usuarios WHERE email = ${email.trim().toLowerCase()}
      `;

      if (!user) {
        // Por seguridad, NO revelamos si el correo existe o no
        return success(req, res, { message: "Si el correo existe, recibirás un código de recuperación." }, 200);
      }

      if (user.estado === 'inactive') {
        return error(req, res, "Esta cuenta está desactivada. Contacta al administrador.", 403);
      }

      // Generar código OTP de 6 dígitos
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await this.UserModel.set2FACode(user.id, code);

      // Enviar correo
      sendPasswordResetCodeEmail(user.email, code).catch(err =>
        console.error("Error enviando correo de recuperación:", err)
      );

      success(req, res, { message: "Si el correo existe, recibirás un código de recuperación.", userId: user.id }, 200);
    } catch (e) {
      console.error("[ForgotPassword] Error:", e);
      error(req, res, "Error interno al procesar la solicitud", 500);
    }
  };

  // 11. VERIFICAR CÓDIGO DE RECUPERACIÓN (solo valida, no cambia contraseña)
  verifyResetCode = async (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) return error(req, res, "Email y código son obligatorios", 400);

    try {
      const [user] = await sql`
        SELECT id FROM usuarios WHERE email = ${email.trim().toLowerCase()}
      `;
      if (!user) return error(req, res, "Usuario no encontrado", 404);

      const isValid = await this.UserModel.verify2FACode(user.id, code);
      if (!isValid) return error(req, res, "El código es incorrecto o ha expirado.", 401);

      success(req, res, { message: "Código verificado correctamente.", verified: true }, 200);
    } catch (e) {
      console.error("[VerifyResetCode] Error:", e);
      error(req, res, "Error interno al verificar el código", 500);
    }
  };

  // 12. RESTABLECER CONTRASEÑA CON CÓDIGO VERIFICADO
  resetPassword = async (req, res) => {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) return error(req, res, "Todos los campos son obligatorios", 400);

    // Validar requisitos de contraseña
    if (newPassword.length < 8) return error(req, res, "La contraseña debe tener al menos 8 caracteres", 400);
    if (!/[A-Z]/.test(newPassword)) return error(req, res, "La contraseña debe contener al menos una mayúscula", 400);
    if (!/\d/.test(newPassword)) return error(req, res, "La contraseña debe contener al menos un número", 400);
    if (!/[@$!%*?.&\-]/.test(newPassword)) return error(req, res, "La contraseña debe contener al menos un símbolo", 400);

    try {
      const [user] = await sql`
        SELECT id FROM usuarios WHERE email = ${email.trim().toLowerCase()}
      `;
      if (!user) return error(req, res, "Usuario no encontrado", 404);

      // Verificar código una última vez
      const isValid = await this.UserModel.verify2FACode(user.id, code);
      if (!isValid) return error(req, res, "El código es incorrecto o ha expirado. Solicita uno nuevo.", 401);

      // Hashear y actualizar contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.UserModel.updatePasswordAndResetDate({ id: user.id, hashedPassword });

      // Limpiar código 2FA
      await sql`
        UPDATE usuarios SET codigo_2fa = NULL, expiracion_2fa = NULL WHERE id = ${user.id}
      `;

      success(req, res, { message: "Contraseña restablecida exitosamente. Ya puedes iniciar sesión." }, 200);
    } catch (e) {
      console.error("[ResetPassword] Error:", e);
      error(req, res, "Error interno al restablecer la contraseña", 500);
    }
  };
}
