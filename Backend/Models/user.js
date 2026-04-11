import { sql } from "../bd.js";

export class UserModel {
  //1. Método para crear un nuevo usuario
  static async create({ username, password, email, role }) {
    try {
      // 1. Buscamos el ID del rol (porque la tabla usuarios pide id_rol, no el nombre)
      // Usamos una transacción simple o consulta directa.
      const [roleRecord] = await sql`
        SELECT id FROM roles WHERE nombre = ${role}
      `;

      if (!roleRecord) {
        throw new Error("El rol especificado no existe en la base de datos");
      }

      // 2. Insertamos el usuario
      // IMPORTANTE: En el futuro, aquí la contraseña ya debería venir hasheada desde el controlador
      const [newUser] = await sql`
        INSERT INTO usuarios (username, password, email, id_rol)
        VALUES (${username}, ${password}, ${email}, ${roleRecord.id})
        RETURNING id, username, email, id_rol, created_at
      `;

      return newUser;
    } catch (error) {
      // Manejo de errores comunes
      if (error.code === "23505") {
        if (error.message.includes("username"))
          throw new Error("El nombre de usuario ya está ocupado");
        if (error.message.includes("email"))
          throw new Error("El email ya está registrado");
      }

      console.error("[UserModel] Error al crear usuario:", error);
      throw new Error("Error al registrar el usuario");
    }
  }

static login = async ({ username }) => {
        const [user] = await sql`
            SELECT 
                u.id, 
                u.username, 
                u.password, 
                u.email, 
                u.estado, 
                u.created_at, 
                u.ultima_actualizacion_password,
                r.nombre as role,
                c.politicas_seguridad 
            FROM usuarios u
            JOIN roles r ON u.id_rol = r.id
            CROSS JOIN configuracion_empresa c 
            WHERE u.username = ${username} OR u.email = ${username}
        `;
        return user;
    };

  //3. Método para buscar un usuario por su ID
static findById = async ({ id }) => {
        const [user] = await sql`
            SELECT 
                u.*, 
                r.nombre as role 
            FROM usuarios u
            JOIN roles r ON u.id_rol = r.id
            WHERE u.id = ${id}
        `;
        return user;
    };

  //4. Método para activar cuenta
  static activateAccount = async ({ id, hashedPassword }) => {
    const [updatedUser] = await sql`
      UPDATE usuarios 
      SET password = ${hashedPassword}, estado = 'active',
      ultima_actualizacion_password = CURRENT_TIMESTAMP
      WHERE id = ${id} AND estado = 'pendiente'
      RETURNING id, username, email, estado
    `;
    return updatedUser;
  };

  //5. Método para registrar auditoría de sesión
  static logSession = async ({ id_usuario, ip_address, dispositivo, estado }) => {
        try {
            await sql`
                INSERT INTO auditoria_sesiones (id_usuario, ip_address, dispositivo, estado)
                VALUES (${id_usuario}, ${ip_address}, ${dispositivo}, ${estado})
            `;
        } catch (error) {
            // Lo envolvemos en un try/catch silencioso para que, 
            // si falla el log, no le bote el login al usuario.
            console.error("Error al registrar auditoría:", error);
        }
    };

    // Actualizar contraseña y resetear la fecha de expiración
    static updatePasswordAndResetDate = async ({ id, hashedPassword }) => {
        const [updatedUser] = await sql`
            UPDATE usuarios
            SET 
                password = ${hashedPassword},
                ultima_actualizacion_password = CURRENT_TIMESTAMP
            WHERE id = ${id}
            RETURNING id
        `;
        return updatedUser;
    };


    // ==========================================
    // MÉTODOS PARA VERIFICACIÓN EN 2 PASOS (2FA)
    // ==========================================

    // 1. Verificar si el dispositivo es de confianza
    static isDeviceTrusted = async (id_usuario, dispositivo) => {
        const [trusted] = await sql`
            SELECT id FROM auditoria_sesiones 
            WHERE id_usuario = ${id_usuario} 
            AND dispositivo = ${dispositivo} 
            AND dispositivo_confiable = TRUE
            LIMIT 1
        `;
        return !!trusted; // Retorna true si ya existe en la BD como confiable
    };

    // 2. Guardar el código 2FA con 5 minutos de vida
    static set2FACode = async (id_usuario, codigo) => {
        await sql`
            UPDATE usuarios 
            SET codigo_2fa = ${codigo}, 
                expiracion_2fa = CURRENT_TIMESTAMP + INTERVAL '5 minutes'
            WHERE id = ${id_usuario}
        `;
    };

    // 3. Validar si el código ingresado es correcto y no ha caducado
    static verify2FACode = async (id_usuario, codigo) => {
        const [user] = await sql`
            SELECT id FROM usuarios 
            WHERE id = ${id_usuario} 
            AND codigo_2fa = ${codigo} 
            AND expiracion_2fa > CURRENT_TIMESTAMP
        `;
        return !!user;
    };

    // 4. Marcar el dispositivo como confiable y limpiar el código
    static markDeviceAsTrusted = async (id_usuario, ip_address, dispositivo) => {
        // A. Limpiamos el código para que no se pueda reusar
        await sql`
            UPDATE usuarios 
            SET codigo_2fa = NULL, expiracion_2fa = NULL 
            WHERE id = ${id_usuario}
        `;
        
        // B. Registramos la sesión exitosa y marcamos el dispositivo como seguro
        await sql`
            INSERT INTO auditoria_sesiones (id_usuario, ip_address, dispositivo, estado, dispositivo_confiable)
            VALUES (${id_usuario}, ${ip_address}, ${dispositivo}, 'success', TRUE)
        `;
    };
}
