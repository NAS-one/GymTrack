// Models/user.js
import postgres from "postgres";

// Configuración de conexión
const sql = postgres({
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

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
  //2. Método para buscar un usuario por su nombre de usuario
  static login = async ({ username }) => {
    // Buscamos usuario y hacemos JOIN con roles para saber quién es
    const [user] = await sql`
      SELECT 
        u.id, u.username, u.password, u.email, u.estado,
        r.nombre as role,
        COALESCE(c.nombre, col.nombre, e.nombre, a.nombre, 'Usuario') as nombre
      FROM usuarios u
      JOIN roles r ON u.id_rol = r.id
      LEFT JOIN clientes c ON u.id = c.id_usuario
      LEFT JOIN colaboradores col ON u.id = col.id_usuario
      LEFT JOIN entrenadores e ON u.id = e.id_usuario
      LEFT JOIN administradores a ON u.id = a.id_usuario
      WHERE u.username = ${username} OR u.email = ${username}
    `;
    // Si no existe, devuelve undefined
    return user;
  };

  //3. Método para buscar un usuario por su ID
  static findById = async ({ id }) => {
    const [user] = await sql`
      SELECT * FROM usuarios WHERE id = ${id}
    `;
    return user;
  };

  //4. Método para activar cuenta
  static activateAccount = async ({ id, hashedPassword }) => {
    const [updatedUser] = await sql`
      UPDATE usuarios 
      SET password = ${hashedPassword}, estado = 'active'
      WHERE id = ${id} AND estado = 'pendiente'
      RETURNING id, username, email, estado
    `;
    return updatedUser;
  };
}
