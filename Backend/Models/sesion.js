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
    // Validar que la fecha no esté en el pasado
    const fechaProgramada = new Date(fecha);
    const ahora = new Date();
    // Resetear horas de "ahora" si fecha no tiene hora, pero en JS new Date('YYYY-MM-DD') genera medianoche UTC,
    // que comparado con new Date() (local con hora) podría ser en el pasado incluso hoy.
    // Usualmente `fecha` trae la hora si es para agendar. Validemos de todas formas.
    if (fechaProgramada < ahora) {
      throw new Error("La fecha programada no puede ser en el pasado.");
    }

    //Ocupamos el ID real del entrenador en base a su usuario logeado
    const [entrenador] = await sql`
      SELECT id, modelo_contrato
      FROM entrenadores
      WHERE id_usuario = ${id_usuario}`;

    if (!entrenador)
      throw new Error("No tienes un perfil de entrenador asignado.");

    if (
      entrenador.modelo_contrato !== "sueldo_fijo" &&
      valor_cobrado !== undefined &&
      valor_cobrado !== null &&
      Number(valor_cobrado) < 10000
    ) {
      throw new Error("El valor cobrado debe ser de al menos 10000.");
    }

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
