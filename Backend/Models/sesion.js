import { sql } from "../bd.js";

export class SesionModel {
  //Obtener las sesiones de un entrenador en una fecha especifica
  static async getAgendaDia({ id_entrenador, fecha }) {
    //nuestra fecha debe llegar con el formato del frontend 'YYYY-MM-DD'
    return await sql`
            SELECT s.id, s.fecha, s.duracion_minutos, s.estado, s.monto_entrenador, 
                   c.nombre AS nombre_cliente,
                   TO_CHAR(s.fecha, 'HH24:MI') as hora_formateada
            FROM sesiones_entrenador s
            JOIN clientes c ON s.id_cliente = c.id
            JOIN entrenadores e ON s.id_entrenador = e.id
            WHERE (e.id =${id_entrenador} OR e.id_usuario = ${id_entrenador})
            AND DATE(s.fecha) = ${fecha}
            ORDER BY s.fecha ASC`;
  }

  //Crear una nueva sesion
  static async create({
    id_usuario,
    id_cliente,
    fecha,
    duracion_minutos,
    valor_cobrado,
    monto_gimnasio,
    monto_entrenador,
  }) {
    //Ocupamos el ID real del entrenador en base a su usuario logeado
    const [entrenador] = await sql`
      SELECT id
      FROM entrenadores
      WHERE id_usuario = ${id_usuario}`;

    if (!entrenador)
      throw new Error("No tienes un perfil de entrenador asignado.");

    const [nuevaSesion] = await sql`
            INSERT INTO sesiones_entrenador 
      (id_entrenador, id_cliente, fecha, duracion_minutos, valor_cobrado, monto_gimnasio, monto_entrenador, estado)
      VALUES 
      (${entrenador.id}, ${id_cliente}, ${fecha}, ${duracion_minutos}, ${valor_cobrado}, ${monto_gimnasio}, ${monto_entrenador}, 'agendada')
      RETURNING *`;
    return nuevaSesion;
  }

  static async updateEstado({ id, estado }) {
    const [sesionActualizada] = await sql`
      UPDATE sesiones_entrenador
      SET estado = ${estado}
      WHERE id = ${id}
      RETURNING *`;
    return sesionActualizada;
  }
}
