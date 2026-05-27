import { sql } from "../bd.js";

export class PagoModel {
  
  // 1. OBTENER TODOS
  static async getAll() {
    return await sql`
        SELECT 
            p.id, p.monto, p.metodo_pago, p.fecha_pago,
            c.nombre as nombre_cliente, c.rut as rut_cliente,
            pl.nombre as nombre_plan,
            a.nombre as nombre_admin
        FROM pagos p
        JOIN membresias m ON p.id_membresia = m.id
        JOIN clientes c ON m.id_cliente = c.id
        LEFT JOIN planes pl ON m.id_plan = pl.id
        LEFT JOIN staff a ON p.id_staff = a.id
        ORDER BY p.fecha_pago DESC
    `;
  }

  // 2. CREAR PAGO
  static async create(input) {
    const { monto, metodo_pago, id_membresia, id_staff } = input;
    const [pago] = await sql`
      INSERT INTO pagos (monto, metodo_pago, id_membresia, id_staff)
      VALUES (${monto}, ${metodo_pago}, ${id_membresia}, ${id_staff})
      RETURNING *
    `;
    return pago;
  }

  // 3. PROCESAR RENOVACIÓN
  static async procesarRenovacion({ id_cliente, id_plan, monto, metodo_pago, meses_duracion }) {
    return await sql.begin(async (sql) => {
      const fechaInicio = new Date();
      const fechaFin = new Date();
      const meses = parseInt(meses_duracion) || 1;
      fechaFin.setMonth(fechaFin.getMonth() + meses);

      const [admin] = await sql`SELECT id FROM staff LIMIT 1`;
      const id_staff = admin ? admin.id : null;

      // Desactivar anteriores (Forzando fecha pasada)
      await sql`
        UPDATE membresias 
        SET estado = 'expired', fecha_fin = CURRENT_DATE - INTERVAL '1 day' 
        WHERE id_cliente = ${id_cliente} AND estado = 'active'
      `;

      // Crear nueva
      const [newMembresia] = await sql`
        INSERT INTO membresias (id_plan, fecha_inicio, fecha_fin, estado, id_cliente)
        VALUES (${id_plan}, ${fechaInicio}, ${fechaFin}, 'active', ${id_cliente})
        RETURNING id
      `;

      // Activar usuario (sincronizar estado con la membresía recién creada)
      await sql`
        UPDATE usuarios
        SET estado = 'active'
        FROM clientes
        WHERE clientes.id = ${id_cliente}
          AND usuarios.id = clientes.id_usuario
          AND usuarios.estado != 'inactive'
      `;

      // Registrar pago
      const [newPago] = await sql`
        INSERT INTO pagos (monto, metodo_pago, id_membresia, id_staff, fecha_pago)
        VALUES (${monto}, ${metodo_pago}, ${newMembresia.id}, ${id_staff}, CURRENT_TIMESTAMP)
        RETURNING *
      `;

      return { membresia: newMembresia, pago: newPago };
    });
  }

  // 4. CANCELAR MEMBRESÍA (CORREGIDO)
  static async cancelarMembresia(id_cliente) {
    if (!id_cliente) throw new Error("ID Cliente requerido");

    // Al cancelar, forzamos que la fecha fin sea AYER.
    const result = await sql`
        UPDATE membresias 
        SET 
            estado = 'cancelled',
            fecha_fin = CURRENT_DATE - INTERVAL '1 day' 
        WHERE id_cliente = ${id_cliente} AND estado = 'active'
        RETURNING id
    `;
    return result.length > 0;
  }
}