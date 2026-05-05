import { sql } from "../bd.js";

export class AdministradorModel {
  //1. Crear un nuevo administrador con su usuario asociado.
  static create = async (input) => {
    // Desestructuramos el input para separar datos de Usuario y de Admin.
    const {
      username,
      password,
      email, // Datos Usuario
      nombre,
      cargo, // Datos Administrador
    } = input;

    try {
      // --------------------INICIO TRANSACCIÓN --------------------
      const result = await sql.begin(async (sql) => {
        // 1. Obtener ID del rol 'administrador'
        const [role] =
          await sql`SELECT id FROM roles WHERE nombre = 'administrador'`;
        if (!role)
          throw new Error("El rol de administrador no existe en la BD");

        // 2. Crear el Usuario Base
        // Usamos el newUser.id como llave foránea (id_usuario).
        const [newUser] = await sql`
          INSERT INTO usuarios (username, password, email, id_rol)
          VALUES (${username}, ${password}, ${email}, ${role.id})
          RETURNING id
        `;

        // 3. Crear el Perfil de Administrador
        const [newAdmin] = await sql`
          INSERT INTO administradores (nombre, cargo, id_usuario)
          VALUES (${nombre}, ${cargo || null}, ${newUser.id})
          RETURNING *
        `;
        //4. Retornamos un objeto combinado (datos de usuario + datos de perfil).
        return { ...newUser, ...newAdmin };
      });
      // ----------------------FIN TRANSACCIÓN ----------------------

      // FIN TRANSACCIÓN. Si llegamos aquí, se hace COMMIT (se guardan los cambios)
      return result;
    } catch (error) {
      // El código '23505' significa "Unique Violation" (Duplicado).
      if (error.code === "23505") {
        if (error.message.includes("usuarios_username_key"))
          throw new Error("El username ya existe");
        if (error.message.includes("usuarios_email_key"))
          throw new Error("El email ya existe");
      }
      throw error;
    }
  };

  //2. Obtener todos los administradores con sus datos de usuario.
  static getAll = async () => {
    return await sql`
      SELECT a.*, u.email, u.username, u.estado
      FROM administradores a
      JOIN usuarios u ON a.id_usuario = u.id
    `;
  };

  //3. Actualizar datos del administrador (solo perfil, no credenciales).
  static update = async ({ id, input }) => {
    // 1. Lista blanca de columnas permitidas
    const allowedColumns = ["nombre", "cargo"];
    const cleanInput = {};

    // 2. Limpieza de datos
    for (const key of allowedColumns) {
      if (input[key] !== undefined) cleanInput[key] = input[key];
    }

    if (Object.keys(cleanInput).length === 0) return null;

    try {
      const [updatedAdmin] = await sql`
        UPDATE administradores 
        SET ${sql(cleanInput)}
        WHERE id = ${id}
        RETURNING *
      `;
      return updatedAdmin;
    } catch (error) {
      // Si hubiera campos únicos (como RUT) aquí manejaríamos el error
      if (error.code === "22P02") throw new Error("Formato de UUID inválido");
      throw error;
    }
  };

  //4. Eliminar (desactivar) un administrador y su usuario asociado.
  static delete = async ({ id }) => {
    try {
      // Desactivamos el usuario vinculado a este administrador
      const [disabledUser] = await sql`
        UPDATE usuarios
        SET estado = 'inactive'
        FROM administradores
        WHERE usuarios.id = administradores.id_usuario
        AND administradores.id = ${id}
        RETURNING usuarios.id
      `;
      return !!disabledUser;
    } catch (error) {
      if (error.code === "22P02") return false;
      throw error;
    }
  };
}
