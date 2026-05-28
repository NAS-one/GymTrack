import postgres from "postgres";
import bcrypt from "bcrypt";
import "dotenv/config";

const sql = postgres({
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

// --- UTILIDADES ---
const getRandomInt = (min, max) =>
  Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFloat = (min, max, decimals = 1) =>
  parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
const getRandomItem = (arr) =>
  arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;

const generateRUT = () => {
  const num = getRandomInt(10000000, 26000000).toString();
  const dv = Math.random() > 0.9 ? "K" : getRandomInt(0, 9).toString();
  return `${num.slice(0, 2)}.${num.slice(2, 5)}.${num.slice(5, 8)}-${dv}`;
};

const getRandomTime = (shift = "General") => {
  let hour;
  if (shift === "Mañana") hour = getRandomInt(6, 12);
  else if (shift === "Tarde") hour = getRandomInt(13, 17);
  else if (shift === "Noche") hour = getRandomInt(18, 22);
  else hour = getRandomInt(6, 22);
  return { hour, minute: getRandomInt(0, 59) };
};

const getHistoricalDate = (minYears, maxYears) => {
  const date = new Date();
  const years = getRandomInt(minYears, maxYears);
  date.setFullYear(date.getFullYear() - years);
  date.setMonth(getRandomInt(0, 11));
  date.setDate(getRandomInt(1, 28));
  return date;
};

// Fecha aleatoria dentro de los últimos N meses
const getDateInPastMonths = (monthsAgo) => {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  date.setDate(getRandomInt(1, 28));
  date.setHours(getRandomInt(8, 20), getRandomInt(0, 59), 0);
  return date;
};

const PAYMENT_METHODS = ["Tarjeta", "Efectivo", "Transferencia", "Webpay"];

// Emails de desarrollo: Gmail ignora el tag +alias al entregar,
// así que los 3 llegan al mismo buzón pero satisfacen la restricción UNIQUE de la BD.
const GMAIL_BASE = "victoralexisdelgado10@gmail.com";
const DEV_EMAIL_ADMIN = GMAIL_BASE; // admin@gmail
const DEV_EMAIL_TRAINER = "victoralexisdelgado10+entrenador@gmail.com"; // mismo buzón
const DEV_EMAIL_CLIENT = "victoralexisdelgado10+cliente@gmail.com"; // mismo buzón

async function seed() {
  console.log(
    "ðŸŒ± Iniciando Siembra ENTERPRISE 4.0 (con módulo de entrenador completo)...",
  );

  try {
    // 0. LIMPIEZA TOTAL
    console.log("ðŸ§¹ Limpiando base de datos...");
    await sql`
      TRUNCATE TABLE 
      reportes, maquinas, registro_progreso, asistencia, medidas_fisicas, 
      sesiones_entrenador, detalle_rutina, rutinas, ejercicios, pagos, membresias, planes,
      staff, clientes, entrenadores, usuarios, roles
      RESTART IDENTITY CASCADE
    `;

    // 1. ROLES
    console.log("ðŸ—ï¸ Construyendo cimientos...");
    const roles = await sql`
        INSERT INTO roles (nombre) 
        VALUES ('administrador'), ('entrenador'), ('cliente'), ('recepcionista'), ('mantenimiento'), ('aseo') 
        RETURNING *
    `;
    const getRol = (name) => roles.find((r) => r.nombre === name).id;
    const password = await bcrypt.hash("123456", 10);

    // =========================================================
    // 1.1 USUARIOS DE DESARROLLO (con correo real)
    // =========================================================
    console.log("ðŸ§ª Creando usuarios de prueba de desarrollo...");

    // ADMIN (mismo correo real)
    const [uAdmin] = await sql`
      INSERT INTO usuarios (username, email, password, estado, id_rol)
      VALUES ('admin', ${DEV_EMAIL_ADMIN}, ${password}, 'active', ${getRol("administrador")})
      RETURNING id
    `;
    const [adminProfile] = await sql`
      INSERT INTO staff (nombre, cargo, rut, telefono, direccion, sueldo_base, turno, id_usuario)
      VALUES ('Admin Principal', 'Administrador', '18.234.567-K', '+56912345678', 'Av. Principal 1234, Río Bueno', 1200000, 'Full Time', ${uAdmin.id})
      RETURNING id
    `;

    // ENTRENADOR DE PRUEBA (correo real, mismo email)
    const [uTrainerDev] = await sql`
      INSERT INTO usuarios (username, email, password, estado, id_rol)
      VALUES ('entrenador_dev', ${DEV_EMAIL_TRAINER}, ${password}, 'active', ${getRol("entrenador")})
      RETURNING id
    `;
    const [trainerDevProfile] = await sql`
      INSERT INTO entrenadores (
          rut, nombre, especialidad, telefono, id_usuario, turno,
          modelo_contrato, sueldo_base, porcentaje_retencion, tarifa_arriendo, created_at
      ) VALUES (
          '12.345.678-9', 'Víctor Dev Trainer', 'Hipertrofia y Fuerza', '+56999999999',
          ${uTrainerDev.id}, 'Full Time', 'porcentaje', 0, 0.35, 0, NOW() - INTERVAL '2 years'
      ) RETURNING id
    `;
    const devTrainerId = trainerDevProfile.id;

    // CLIENTE DE PRUEBA (correo real)
    const [uClienteDev] = await sql`
      INSERT INTO usuarios (username, email, password, estado, id_rol)
      VALUES ('cliente_dev', ${DEV_EMAIL_CLIENT}, ${password}, 'active', ${getRol("cliente")})
      RETURNING id
    `;
    const [clienteDevProfile] = await sql`
      INSERT INTO clientes (rut, nombre, objetivo, fecha_nacimiento, genero, id_usuario, id_entrenador, created_at)
      VALUES (
          '22.333.444-5', 'Cliente Dev', 'Musculación y Tonificación',
          '1995-06-15', 'Masculino', ${uClienteDev.id}, ${devTrainerId},
          NOW() - INTERVAL '6 months'
      ) RETURNING id
    `;

    console.log("âœ… Usuarios de prueba creados:");
    console.log(
      `   ðŸ‘¤ admin          | email: ${DEV_EMAIL_ADMIN}    | pass: 123456`,
    );
    console.log(
      `   ðŸ‘¤ entrenador_dev | email: ${DEV_EMAIL_TRAINER} | pass: 123456`,
    );
    console.log(
      `   ðŸ‘¤ cliente_dev    | email: ${DEV_EMAIL_CLIENT}  | pass: 123456`,
    );

    const staffAttendancePool = [];

    // 1.2 STAFF OPERATIVO
    console.log("ðŸ§¹ Contratando Staff...");
    const staffData = [
      {
        nombre: "Maria Recepcionista",
        rut: generateRUT(),
        cargo: "Recepcionista",
        turno: "Mañana",
        sueldo: 500000,
        antiguedad: 3,
      },
      {
        nombre: "Pedro Recepcionista",
        rut: generateRUT(),
        cargo: "Recepcionista",
        turno: "Tarde",
        sueldo: 480000,
        antiguedad: 1,
      },
      {
        nombre: "Juan Limpieza",
        rut: generateRUT(),
        cargo: "Aseo",
        turno: "Tarde",
        sueldo: 450000,
        antiguedad: 2,
      },
      {
        nombre: "Luisa Limpieza",
        rut: generateRUT(),
        cargo: "Aseo",
        turno: "Mañana",
        sueldo: 450000,
        antiguedad: 4,
      },
      {
        nombre: "Carlos Técnico",
        rut: generateRUT(),
        cargo: "Mantenimiento",
        turno: "Full Time",
        sueldo: 650000,
        antiguedad: 5,
      },
    ];

    for (const s of staffData) {
      const username =
        s.nombre.split(" ")[0].toLowerCase() +
        "_" +
        s.cargo.substring(0, 3).toLowerCase();
      let roleId = getRol(s.cargo.toLowerCase());
      if (!roleId) roleId = getRol("recepcionista");
      const [u] =
        await sql`INSERT INTO usuarios (username, email, password, estado, id_rol) VALUES (${username}, ${`${username}@gym.com`}, ${password}, 'active', ${roleId}) RETURNING id`;
      await sql`
            INSERT INTO staff (rut, nombre, telefono, cargo, turno, sueldo_base, id_usuario, fecha_contratacion, created_at) 
            VALUES (${s.rut}, ${s.nombre}, '+56911111111', ${s.cargo}, ${s.turno}, ${s.sueldo}, ${u.id}, ${getHistoricalDate(1, s.antiguedad)}, ${getHistoricalDate(1, s.antiguedad)})
        `;
      staffAttendancePool.push({ id_usuario: u.id, turno: s.turno });
    }

    // 2. PLANES
    const planesData = [
      {
        nombre: "Plan Mensual",
        precio: 35000,
        duracion: 1,
        desc: "Acceso total 1 mes.",
      },
      {
        nombre: "Plan Trimestral",
        precio: 95000,
        duracion: 3,
        desc: "Ahorra un 10%.",
      },
      {
        nombre: "Plan Semestral",
        precio: 180000,
        duracion: 6,
        desc: "Compromiso medio.",
      },
      {
        nombre: "Plan Anual",
        precio: 320000,
        duracion: 12,
        desc: "Mejor valor anual.",
      },
    ];
    const planesListDB = [];
    for (const p of planesData) {
      const [planDB] =
        await sql`INSERT INTO planes (nombre, precio, duracion_meses, descripcion) VALUES (${p.nombre}, ${p.precio}, ${p.duracion}, ${p.desc}) RETURNING *`;
      planesListDB.push(planDB);
    }

    // 3. ENTRENADORES GENERALES
    console.log("ðŸ’ª Contratando Entrenadores...");
    const coachesData = [
      {
        name: "Mike Mentzer",
        esp: "Hipertrofia",
        turno: "Mañana",
        modelo: "sueldo_fijo",
        sueldo: 800000,
        porcentaje: 0,
        arriendo: 0,
        antiguedad: 5,
      },
      {
        name: "Ronnie Coleman",
        esp: "Fuerza Bruta",
        turno: "Tarde",
        modelo: "sueldo_fijo",
        sueldo: 750000,
        porcentaje: 0,
        arriendo: 0,
        antiguedad: 4,
      },
      {
        name: "Chris Bumstead",
        esp: "Estética",
        turno: "Full Time",
        modelo: "porcentaje",
        sueldo: 0,
        porcentaje: 0.4,
        arriendo: 0,
        antiguedad: 3,
      },
      {
        name: "Nina Williams",
        esp: "Yoga & Flex",
        turno: "Mañana",
        modelo: "arriendo_espacio",
        sueldo: 0,
        porcentaje: 0,
        arriendo: 200000,
        antiguedad: 2,
      },
      {
        name: "Tom Platz",
        esp: "Pierna",
        turno: "Tarde",
        modelo: "sueldo_fijo",
        sueldo: 600000,
        porcentaje: 0,
        arriendo: 0,
        antiguedad: 6,
      },
    ];

    const trainerIds = []; // IDs de entrenadores de la tabla entrenadores
    const trainerUserIds = []; // IDs de usuarios de entrenadores (para asistencia)
    for (const c of coachesData) {
      const nameLower = c.name.split(" ")[0].toLowerCase();
      const [u] =
        await sql`INSERT INTO usuarios (username, email, password, estado, id_rol) VALUES (${`coach_${nameLower}`}, ${`${nameLower}@gym.com`}, ${password}, 'active', ${getRol("entrenador")}) RETURNING id`;
      const [t] = await sql`
        INSERT INTO entrenadores (
            rut, nombre, especialidad, telefono, id_usuario, turno,
            modelo_contrato, sueldo_base, porcentaje_retencion, tarifa_arriendo, created_at
        ) VALUES (
            ${generateRUT()}, 
            ${c.name}, ${c.esp}, '+56912345678', ${u.id}, ${c.turno},
            ${c.modelo}, ${c.sueldo}, ${c.porcentaje}, ${c.arriendo}, ${getHistoricalDate(1, c.antiguedad)}
        ) RETURNING id
      `;
      trainerIds.push(t.id);
      trainerUserIds.push({
        id_entrenador: t.id,
        id_usuario: u.id,
        turno: c.turno,
      });
      staffAttendancePool.push({ id_usuario: u.id, turno: c.turno });
    }

    // 4. CLIENTES CON HÃBITOS REALISTAS
    console.log("ðŸ‘¥ Registrando 150 Clientes VIP...");
    const clientPool = [];
    const maleNames = [
      "Juan",
      "Pedro",
      "Diego",
      "Carlos",
      "Luis",
      "Jose",
      "Matias",
      "Nicolas",
      "Felipe",
      "Sebastian",
      "Andres",
      "Gabriel",
      "Tomas",
      "Martin",
      "Joaquin",
    ];
    const femaleNames = [
      "Maria",
      "Ana",
      "Sofia",
      "Camila",
      "Valentina",
      "Isabella",
      "Fernanda",
      "Javiera",
      "Catalina",
      "Martina",
      "Daniela",
      "Constanza",
      "Antonia",
    ];
    const lastnames = [
      "Gonzalez",
      "Muñoz",
      "Rojas",
      "Diaz",
      "Perez",
      "Soto",
      "Contreras",
      "Silva",
      "Martinez",
      "Sepulveda",
      "Morales",
      "Rodriguez",
      "Lopez",
      "Fuentes",
      "Hernandez",
      "Vidal",
      "Guzman",
    ];
    const direcciones = [
      "Av. Providencia 123",
      "Las Condes 444",
      "Santiago Centro",
      "Maipú 90",
      "Ñuñoa 500",
      "La Florida 100",
      "Vitacura 300",
    ];

    // Incluye el cliente dev en el pool para que tenga asistencia y membresía
    const [memClienteDev] = await sql`
      INSERT INTO membresias (id_plan, fecha_inicio, fecha_fin, estado, id_cliente)
      VALUES (${planesListDB[0].id}, NOW() - INTERVAL '2 months', NOW() + INTERVAL '1 month', 'active', ${clienteDevProfile.id})
      RETURNING id
    `;
    await sql`
      INSERT INTO pagos (monto, metodo_pago, id_membresia, id_staff, fecha_pago)
      VALUES (${planesListDB[0].precio}, 'Tarjeta', ${memClienteDev.id}, ${adminProfile.id}, NOW() - INTERVAL '2 months')
    `;
    clientPool.push({
      id_cliente: clienteDevProfile.id,
      id_usuario: uClienteDev.id,
      nombre: "Cliente Dev",
      activeUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      assignedTrainer: devTrainerId,
      habitShift: "Mañana",
      attendanceProb: 0.7,
      currentWeight: 80,
      currentFat: 18,
      targetWeight: 85,
      height: 1.78,
    });

    for (let i = 1; i <= 150; i++) {
      const isMale = Math.random() > 0.5;
      const firstName = getRandomItem(isMale ? maleNames : femaleNames);
      const lastName = getRandomItem(lastnames);
      const nombre = `${firstName} ${lastName}`;
      const baseHeight = isMale
        ? getRandomFloat(1.65, 1.9, 2)
        : getRandomFloat(1.5, 1.75, 2);
      const baseWeight = isMale ? getRandomInt(70, 110) : getRandomInt(50, 80);
      const baseFat = isMale ? getRandomFloat(15, 30) : getRandomFloat(20, 35);

      const [u] =
        await sql`INSERT INTO usuarios (username, email, password, estado, id_rol) VALUES (${`u_${firstName.toLowerCase()}${i}`}, ${`user${i}@mail.com`}, ${password}, 'active', ${getRol("cliente")}) RETURNING id`;
      const joinDate = getHistoricalDate(0, 2);
      // 30% va al entrenador dev, el resto distribuido entre los demás
      const allTrainerIds = [devTrainerId, ...trainerIds];
      const assignedTrainer =
        Math.random() > 0.4 ? getRandomItem(allTrainerIds) : null;

      const [c] = await sql`
        INSERT INTO clientes (rut, nombre, objetivo, fecha_nacimiento, genero, direccion, id_usuario, id_entrenador, created_at) 
        VALUES (
            ${generateRUT()}, 
            ${nombre}, 
            ${isMale ? "Ganar Masa Muscular" : "Tonificar"}, 
            ${getHistoricalDate(18, 50)}, 
            ${isMale ? "Masculino" : "Femenino"}, 
            ${getRandomItem(direcciones)}, 
            ${u.id},
            ${assignedTrainer},
            ${joinDate}
        ) RETURNING id
      `;
      const habitShift = getRandomItem(["Mañana", "Tarde", "Noche"]);
      const attendanceProb = getRandomFloat(0.2, 0.8);
      clientPool.push({
        id_cliente: c.id,
        id_usuario: u.id,
        nombre,
        activeUntil: new Date(2024, 11, 31),
        assignedTrainer,
        habitShift,
        attendanceProb,
        currentWeight: baseWeight,
        currentFat: baseFat,
        targetWeight: baseWeight * (isMale ? 1.05 : 0.9),
        height: baseHeight,
      });
    }

    // 5. SIMULACIÃ“N TEMPORAL
    console.log("â³ Ejecutando simulación temporal...");
    const startDate = new Date(2025, 0, 1);
    const endDate = new Date();
    let currentDate = new Date(startDate);
    let totalAsistencias = 0;
    const measureBuffer = [];

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const dailyAttendanceBuffer = [];
      const entryDateBase = new Date(currentDate);

      if (!isWeekend) {
        for (let staff of staffAttendancePool) {
          if (Math.random() < 0.95 && staff.id_usuario) {
            const { hour, minute } = getRandomTime(staff.turno);
            const entryTime = new Date(entryDateBase);
            entryTime.setHours(hour, minute, 0);
            dailyAttendanceBuffer.push({
              id_usuario: staff.id_usuario,
              estado_acceso: "aprobado",
              fecha_entrada: entryTime,
            });
          }
        }
      }

      for (let client of clientPool) {
        if (client.activeUntil < currentDate) {
          if (Math.random() < 0.05) {
            const planElegido = getRandomItem(planesListDB);
            const metodoPagoElegido = getRandomItem(PAYMENT_METHODS);
            const fechaFin = new Date(currentDate);
            fechaFin.setMonth(fechaFin.getMonth() + planElegido.duracion_meses);
            client.activeUntil = fechaFin;
            const [m] =
              await sql`INSERT INTO membresias (id_plan, fecha_inicio, fecha_fin, estado, id_cliente) VALUES (${planElegido.id}, ${currentDate}, ${fechaFin}, 'active', ${client.id_cliente}) RETURNING id`;
            await sql`INSERT INTO pagos (monto, metodo_pago, id_membresia, id_staff, fecha_pago) VALUES (${planElegido.precio}, ${metodoPagoElegido}, ${m.id}, ${adminProfile.id}, ${currentDate})`;
          }
        }
        if (client.activeUntil >= currentDate) {
          let prob = isWeekend
            ? client.attendanceProb * 0.3
            : client.attendanceProb;
          if (Math.random() < prob && client.id_usuario) {
            const { hour, minute } = getRandomTime(client.habitShift);
            const entryTime = new Date(entryDateBase);
            entryTime.setHours(hour, minute, 0);
            dailyAttendanceBuffer.push({
              id_usuario: client.id_usuario,
              estado_acceso: "aprobado",
              fecha_entrada: entryTime,
            });
            totalAsistencias++;
            if (Math.random() < 0.05) {
              const delta = (client.targetWeight - client.currentWeight) * 0.05;
              client.currentWeight += delta + getRandomFloat(-0.3, 0.3);
              client.currentFat -= 0.1;
              measureBuffer.push({
                peso: parseFloat(client.currentWeight.toFixed(1)),
                altura: client.height,
                porcentaje_grasa: parseFloat(client.currentFat.toFixed(1)),
                fecha_registro: new Date(currentDate),
                id_cliente: client.id_cliente,
              });
            }
          }
        }
      }

      if (dailyAttendanceBuffer.length > 0) {
        const cleanBuffer = dailyAttendanceBuffer.filter(
          (a) => a.id_usuario && a.fecha_entrada,
        );
        if (cleanBuffer.length > 0)
          await sql`INSERT INTO asistencia ${sql(cleanBuffer, "id_usuario", "estado_acceso", "fecha_entrada")}`;
      }
      if (measureBuffer.length > 50) {
        await sql`INSERT INTO medidas_fisicas ${sql(measureBuffer, "peso", "altura", "porcentaje_grasa", "fecha_registro", "id_cliente")}`;
        measureBuffer.length = 0;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    if (measureBuffer.length > 0) {
      await sql`INSERT INTO medidas_fisicas ${sql(measureBuffer, "peso", "altura", "porcentaje_grasa", "fecha_registro", "id_cliente")}`;
    }

    // =========================================================
    // 6. SESIONES DE ENTRENADOR (Para dashboards y finanzas)
    // =========================================================
    console.log(
      "ðŸ“… Generando sesiones de entrenadores (6 meses histórico + próximas)...",
    );

    // Obtener todos los clientes con entrenador asignado
    const clientesConEntrenador = await sql`
      SELECT c.id as id_cliente, c.id_entrenador
      FROM clientes c
      WHERE c.id_entrenador IS NOT NULL
    `;

    const sesionesBuffer = [];
    const TARIFA_SESSION = 25000; // Valor base por sesión personal
    const allTrainerIds = [devTrainerId, ...trainerIds];

    // Historial de 6 meses pasados para cada entrenador
    for (const trainerId of allTrainerIds) {
      const misClientes = clientesConEntrenador.filter(
        (c) => c.id_entrenador === trainerId,
      );
      if (misClientes.length === 0) continue;

      // Porcentaje del entrenador (usamos 0.35 como default para los de sueldo fijo también)
      const [trainerInfo] =
        await sql`SELECT porcentaje_retencion FROM entrenadores WHERE id = ${trainerId}`;
      const porcentajeEntrenador =
        trainerInfo?.porcentaje_retencion > 0
          ? 1 - Number(trainerInfo.porcentaje_retencion)
          : 0.6;

      for (let mesesAtras = 5; mesesAtras >= 0; mesesAtras--) {
        const cantidadSesiones = getRandomInt(
          6,
          Math.min(18, misClientes.length * 3),
        );
        for (let s = 0; s < cantidadSesiones; s++) {
          const clienteElegido = getRandomItem(misClientes);
          const fecha = getDateInPastMonths(mesesAtras);
          const valorCobrado = TARIFA_SESSION + getRandomInt(-3000, 5000);
          const montoEntrenador = Math.round(
            valorCobrado * porcentajeEntrenador,
          );
          const montoGimnasio = valorCobrado - montoEntrenador;
          const estado =
            mesesAtras > 0
              ? Math.random() < 0.9
                ? "realizada"
                : "cancelada"
              : fecha < new Date()
                ? "realizada"
                : "agendada";
          sesionesBuffer.push({
            id_entrenador: trainerId,
            id_cliente: clienteElegido.id_cliente,
            fecha,
            duracion_minutos: getRandomItem([45, 60, 60, 60, 90]),
            estado,
            valor_cobrado: valorCobrado,
            monto_gimnasio: montoGimnasio,
            monto_entrenador: montoEntrenador,
          });
        }
      }

      // Próximas sesiones agendadas (para el panel de "próximas sesiones")
      for (let i = 0; i < getRandomInt(3, 8); i++) {
        const clienteElegido = getRandomItem(misClientes);
        const diasAdelante = getRandomInt(1, 14);
        const fechaFutura = new Date();
        fechaFutura.setDate(fechaFutura.getDate() + diasAdelante);
        fechaFutura.setHours(getRandomInt(8, 19), getRandomItem([0, 30]), 0);
        const valorCobrado = TARIFA_SESSION;
        const montoEntrenador = Math.round(valorCobrado * porcentajeEntrenador);
        sesionesBuffer.push({
          id_entrenador: trainerId,
          id_cliente: clienteElegido.id_cliente,
          fecha: fechaFutura,
          duracion_minutos: getRandomItem([45, 60, 90]),
          estado: "agendada",
          valor_cobrado: valorCobrado,
          monto_gimnasio: valorCobrado - montoEntrenador,
          monto_entrenador: montoEntrenador,
        });
      }
    }

    // Insertar sesiones en bloques
    if (sesionesBuffer.length > 0) {
      await sql`
        INSERT INTO sesiones_entrenador 
        ${sql(sesionesBuffer, "id_entrenador", "id_cliente", "fecha", "duracion_minutos", "estado", "valor_cobrado", "monto_gimnasio", "monto_entrenador")}
      `;
    }
    console.log(`   ðŸ“Š Sesiones generadas: ${sesionesBuffer.length}`);

    // =========================================================
    // 7. MÓDULO DE ENTRENAMIENTO — referencias reservadas
    // =========================================================
    // Los ejercicios se crean en el paso 9 (necesitamos sus IDs).
    // Las rutinas y detalle_rutina se insertan en el paso 9.5.
    console.log("ðŸ’¾ Reservando referencias para módulo de entrenamiento...");
    const clientesDevAsignados = clientesConEntrenador
      .filter((c) => c.id_entrenador === devTrainerId)
      .slice(0, 5);
    const devClientId = clienteDevProfile.id;

    // 8. INVENTARIO
    console.log("ðŸ”§ Equipando Inventario...");
    const inventoryList = [
      {
        name: "Cinta de Correr Pro",
        brand: "LifeFitness",
        type: "Cardio",
        count: 8,
      },
      {
        name: "Elíptica Avanzada",
        brand: "Technogym",
        type: "Cardio",
        count: 6,
      },
      {
        name: "Bicicleta Estática",
        brand: "Schwinn",
        type: "Cardio",
        count: 10,
      },
      {
        name: "Press Banca Olímpico",
        brand: "Hammer Strength",
        type: "Fuerza",
        count: 4,
      },
      {
        name: "Prensa de Piernas 45°",
        brand: "Cybex",
        type: "Fuerza",
        count: 3,
      },
      { name: "Polea Cruzada", brand: "Technogym", type: "Fuerza", count: 2 },
      { name: "Smith Machine", brand: "Precor", type: "Fuerza", count: 2 },
      {
        name: "Set Mancuernas 5-50kg",
        brand: "Rogue",
        type: "Peso Libre",
        count: 2,
      },
      { name: "Banco Ajustable", brand: "Rogue", type: "Peso Libre", count: 8 },
      { name: "Remo Concept2", brand: "Concept2", type: "Cardio", count: 5 },
    ];
    const machinesBuffer = [];
    for (const item of inventoryList) {
      for (let i = 1; i <= item.count; i++) {
        const isBroken = Math.random() > 0.92;
        machinesBuffer.push({
          nombre: `${item.name} #${i}`,
          marca: item.brand,
          codigo_serie: `${item.brand.substring(0, 2).toUpperCase()}-${Math.floor(Math.random() * 10000)}`,
          estado: isBroken ? "en_mantencion" : "operativa",
          fecha_adquisicion: getHistoricalDate(1, 4),
          id_staff: adminProfile.id,
        });
      }
    }
    await sql`INSERT INTO maquinas ${sql(machinesBuffer, "nombre", "marca", "codigo_serie", "estado", "fecha_adquisicion", "id_staff")}`;

    // 9. BIBLIOTECA DE EJERCICIOS (30 ejercicios profesionales)
    console.log("ðŸ‹ï¸ Creando Biblioteca de Ejercicios profesional (30 ejercicios)...");
    const ejerciciosDb = [
      // â”€â”€ PECHO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      { nombre: "Press de Banca Plano", grupo_muscular: "Pecho", url_video: "https://youtu.be/rT7DgCr-3pg", descripcion: "Ejercicio compuesto rey del pecho. Activa pectoral mayor, deltoides anterior y tríceps. Técnica: escápulas retraídas, arco lumbar controlado, barra baja hacia el esternón." },
      { nombre: "Press de Banca Inclinado", grupo_muscular: "Pecho", url_video: "https://youtu.be/DbFgADa2PL8", descripcion: "Variante inclinada (30-45°) que aísla la porción clavicular del pectoral. Excelente para la parte alta del pecho." },
      { nombre: "Aperturas con Mancuernas", grupo_muscular: "Pecho", url_video: "https://youtu.be/eozdVDA78K0", descripcion: "Aislamiento del pectoral en el plano horizontal. Emphasize el estiramiento máximo y la contracción en cima." },
      { nombre: "Fondos en Paralelas", grupo_muscular: "Pecho", url_video: "https://youtu.be/2z8JmcrW-As", descripcion: "Compuesto de empuje que maximiza el rango de movimiento del pectoral inferior. Inclinarse hacia adelante para mayor activación del pecho." },
      // â”€â”€ ESPALDA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      { nombre: "Dominadas Supinas", grupo_muscular: "Espalda", url_video: "https://youtu.be/eGo4IYlbE5g", descripcion: "Tracción vertical con agarre supino. Activa dorsales y bíceps con alta intensidad. Bajar hasta extensión completa del codo." },
      { nombre: "Remo con Barra", grupo_muscular: "Espalda", url_video: "https://youtu.be/G8l_8chR5BE", descripcion: "Tracción horizontal pesada enfocada en grosor de la espalda media. Torso a 45°, barra hacia el ombligo." },
      { nombre: "Peso Muerto Convencional", grupo_muscular: "Espalda", url_video: "https://youtu.be/op9kVnSso6Q", descripcion: "Ejercicio fundamental para toda la cadena posterior. Columna neutra, cadera como eje. Base de cualquier programa serio de fuerza." },
      { nombre: "Jalón al Pecho en Polea", grupo_muscular: "Espalda", url_video: "https://youtu.be/CAwf7n6Luuc", descripcion: "Tracción vertical asistida para desarrollo de dorsales. Barra hacia la clavícula, codos hacia la cadera al bajar." },
      { nombre: "Remo en Polea Baja", grupo_muscular: "Espalda", url_video: "https://youtu.be/GZbfZ033f74", descripcion: "Remo sentado con polea. Control total del movimiento. Ideal para grosor medio de la espalda y romboides." },
      // â”€â”€ PIERNAS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      { nombre: "Sentadilla Libre", grupo_muscular: "Piernas", url_video: "https://youtu.be/ultWZbUMPL8", descripcion: "Rey del tren inferior. Activa cuádriceps, glúteos, isquios y core. Rodillas en línea con pies, espalda recta, profundidad mínima al paralelo." },
      { nombre: "Prensa de Piernas 45°", grupo_muscular: "Piernas", url_video: "https://youtu.be/IZxyjW7MPJQ", descripcion: "Máquina de empuje para hipertrofia del cuádriceps. Posición del pie varía el énfasis: alto=isquios/glúteos, bajo=cuádriceps." },
      { nombre: "Hip Thrust con Barra", grupo_muscular: "Piernas", url_video: "https://youtu.be/LM8XHLYJoYs", descripcion: "Ejercicio de extensión de cadera por excelencia para glúteo mayor. Hombros sobre banco, barra en caderas, máxima contracción arriba." },
      { nombre: "Curl Femoral Tumbado", grupo_muscular: "Piernas", url_video: "https://youtu.be/1Tq3QdYUuHs", descripcion: "Aislamiento de isquiotibiales en máquina. Flexión de rodilla hasta ~120°. Fundamental para equilibrio anterior/posterior del muslo." },
      { nombre: "Extensión de Cuádriceps", grupo_muscular: "Piernas", url_video: "https://youtu.be/YyvSfVjQeL0", descripcion: "Aislamiento de cuádriceps en máquina. Extensión completa al tope. Utilizar en fase de pump o calentamiento." },
      { nombre: "Peso Muerto Rumano", grupo_muscular: "Piernas", url_video: "https://youtu.be/JCXUYuzwNrM", descripcion: "Variante de peso muerto que aísla la cadena posterior: isquiotibiales y glúteos. Rodillas semi-flexionadas, cadera hacia atrás." },
      // â”€â”€ HOMBROS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      { nombre: "Press Militar con Barra", grupo_muscular: "Hombros", url_video: "https://youtu.be/2yjwXTZQDDI", descripcion: "Empuje vertical compuesto para deltoides anterior y medio. De pie o sentado. Core activado. Barra desde la clavícula al bloqueo." },
      { nombre: "Elevaciones Laterales con Mancuernas", grupo_muscular: "Hombros", url_video: "https://youtu.be/3VcKaXpzqRo", descripcion: "Aislamiento del deltoides lateral. Codos ligeramente flexionados, elevar hasta paralelo al suelo. No balancear el torso." },
      { nombre: "Pájaro (Reverse Fly)", grupo_muscular: "Hombros", url_video: "https://youtu.be/ttvAYqd5qiI", descripcion: "Aislamiento del deltoides posterior y romboides. Torso inclinado, brazos en arco hacia arriba. Clave para postura y simetría." },
      // â”€â”€ BRAZOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      { nombre: "Curl de Bíceps con Barra", grupo_muscular: "Brazos", url_video: "https://youtu.be/kwG2ipFRgfo", descripcion: "Aislamiento clásico para el bíceps braquial. Codos fijos al costado del torso. Supinación completa al subir. Bajar controlado." },
      { nombre: "Curl Martillo con Mancuernas", grupo_muscular: "Brazos", url_video: "https://youtu.be/zC3nLlEvin4", descripcion: "Trabaja bíceps braquial y braquiorradial (agarre neutro). Excelente para grosor y amplitud del brazo." },
      { nombre: "Extensión de Tríceps en Polea Alta", grupo_muscular: "Brazos", url_video: "https://youtu.be/vB5OHsJ3EME", descripcion: "Aislamiento de las 3 cabezas del tríceps. Codos fijos, extensión completa. Usar cuerda para mayor rango de movimiento." },
      { nombre: "Press de Tríceps en Banco", grupo_muscular: "Brazos", url_video: "https://youtu.be/6kALZikXxLc", descripcion: "Fondos de tríceps en banco (Skull Crusher alternativo). Aísla la cabeza larga del tríceps eficazmente." },
      // â”€â”€ CORE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      { nombre: "Plancha Isométrica", grupo_muscular: "Core", url_video: "https://youtu.be/pSHjTRCQxIw", descripcion: "Ejercicio isométrico de estabilidad para el core completo. Cadera neutra, glúteos activos. Clave para transferir fuerza en multiarticulares." },
      { nombre: "Crunch Abdominal", grupo_muscular: "Core", url_video: "https://youtu.be/Xyd_fa5zoEU", descripcion: "Flexión de columna para el recto abdominal. Manos detrás de la cabeza sin halar. Exhalar al subir, inhalar al bajar." },
      { nombre: "Rueda Abdominal (Ab Wheel)", grupo_muscular: "Core", url_video: "https://youtu.be/rq5--KFlpU4", descripcion: "Ejercicio avanzado de anti-extensión lumbar. Activa recto abdominal, oblicuos y serrato. Nivel élite de estabilidad central." },
      // â”€â”€ CARDIO / FUNCIONAL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      { nombre: "Remo en Máquina Concept2", grupo_muscular: "Cardio", url_video: "https://youtu.be/H0r1hfhPuOQ", descripcion: "Cardio de bajo impacto de alta exigencia. Trabaja el 86% de los músculos del cuerpo. Perfecto para warm-up o HIIT." },
      { nombre: "Farmer's Walk", grupo_muscular: "Core", url_video: "https://youtu.be/rt17lmnaLSM", descripcion: "Caminata con carga pesada en cada mano. Desarrolla agarre, trapecio y estabilidad lumbar. Funcional y efectivo." },
      { nombre: "Face Pull en Polea", grupo_muscular: "Hombros", url_video: "https://youtu.be/d_vIQEMoTqY", descripcion: "Tracción hacia la cara para deltoides posterior y manguito rotador. Salud óptima del hombro. Clave preventivo y correctivo." },
      { nombre: "Sentadilla Búlgara", grupo_muscular: "Piernas", url_video: "https://youtu.be/2C-uNgKwPLE", descripcion: "Sentadilla unilateral con pie posterior elevado. Máximo estímulo para cuádriceps y glúteo. Corrige desequilibrios laterales." },
      { nombre: "Déficit Push-Up", grupo_muscular: "Pecho", url_video: "https://youtu.be/9GkGXuJMdrg", descripcion: "Flexión de brazos con rango de movimiento extendido usando plataformas. Máximo estiramiento del pectoral menor y mayor." },
    ];

    try {
      const fs = await import('fs');
      const path = await import('path');
      const url = await import('url');
      const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
      const translatedExercisesPath = path.join(__dirname, 'ejercicios_100_traducidos.json');
      if (fs.existsSync(translatedExercisesPath)) {
        const translatedExercises = JSON.parse(fs.readFileSync(translatedExercisesPath, 'utf8'));
        console.log(`💪 Agregando ${translatedExercises.length} ejercicios adicionales desde el archivo JSON...`);
        const existingNames = new Set(ejerciciosDb.map(e => e.nombre));
        for (const ex of translatedExercises) {
          if (!existingNames.has(ex.nombre)) {
            ejerciciosDb.push({
              nombre: ex.nombre,
              grupo_muscular: ex.grupo_muscular,
              url_video: ex.url_video,
              descripcion: ex.descripcion
            });
            existingNames.add(ex.nombre);
          }
        }
      }
    } catch(err) {
      console.error("Error al cargar ejercicios adicionales:", err.message);
    }

    await sql`INSERT INTO ejercicios ${sql(ejerciciosDb, "nombre", "grupo_muscular", "url_video", "descripcion")} ON CONFLICT (nombre) DO NOTHING`;
    // Mapa por nombre para referenciarlos en rutinas
    const ejDB = await sql`SELECT id, nombre FROM ejercicios`;
    const ej = {};
    for (const e of ejDB) ej[e.nombre] = e.id;

    // =========================================================
    // 9.5 RUTINAS COMPLETAS CON DETALLE (Módulo Entrenamiento)
    // =========================================================
    console.log("ðŸ‹ï¸ Creando programa de entrenamiento PUSH/PULL/LEGS para cliente_dev...");

    // â€” PROGRAMA PPL (Push / Pull / Legs) para cliente_dev â€”
    // Rutina 1: PUSH (Pecho + Hombros + Tríceps) â€” Lunes / Jueves
    const [rutinaPush] = await sql`
      INSERT INTO rutinas (nombre, fecha_inicio, fecha_fin, activa, id_cliente, id_entrenador, es_plantilla, created_at)
      VALUES (
        'PPL — Push (Empuje)',
        CURRENT_DATE - INTERVAL '3 months',
        CURRENT_DATE + INTERVAL '3 months',
        true,
        ${devClientId}, ${devTrainerId}, false,
        NOW() - INTERVAL '3 months'
      ) RETURNING id
    `;
    const detallePush = [
      { dia: "Lunes", series: 4, repeticiones: "6-8", carga_proyectada: "80 kg", id_rutina: rutinaPush.id, id_ejercicio: ej["Press de Banca Plano"] },
      { dia: "Lunes", series: 3, repeticiones: "8-10", carga_proyectada: "60 kg", id_rutina: rutinaPush.id, id_ejercicio: ej["Press de Banca Inclinado"] },
      { dia: "Lunes", series: 3, repeticiones: "10-12", carga_proyectada: "16 kg c/u", id_rutina: rutinaPush.id, id_ejercicio: ej["Aperturas con Mancuernas"] },
      { dia: "Lunes", series: 4, repeticiones: "8-10", carga_proyectada: "60 kg", id_rutina: rutinaPush.id, id_ejercicio: ej["Press Militar con Barra"] },
      { dia: "Lunes", series: 3, repeticiones: "12-15", carga_proyectada: "10 kg c/u", id_rutina: rutinaPush.id, id_ejercicio: ej["Elevaciones Laterales con Mancuernas"] },
      { dia: "Lunes", series: 3, repeticiones: "10-12", carga_proyectada: "30 kg", id_rutina: rutinaPush.id, id_ejercicio: ej["Extensión de Tríceps en Polea Alta"] },
      { dia: "Lunes", series: 2, repeticiones: "12-15", carga_proyectada: "Peso corporal", id_rutina: rutinaPush.id, id_ejercicio: ej["Fondos en Paralelas"] },
      { dia: "Jueves", series: 4, repeticiones: "6-8", carga_proyectada: "82 kg", id_rutina: rutinaPush.id, id_ejercicio: ej["Press de Banca Plano"] },
      { dia: "Jueves", series: 3, repeticiones: "8-10", carga_proyectada: "62 kg", id_rutina: rutinaPush.id, id_ejercicio: ej["Press de Banca Inclinado"] },
      { dia: "Jueves", series: 3, repeticiones: "10-12", carga_proyectada: "18 kg c/u", id_rutina: rutinaPush.id, id_ejercicio: ej["Aperturas con Mancuernas"] },
      { dia: "Jueves", series: 4, repeticiones: "8-10", carga_proyectada: "62 kg", id_rutina: rutinaPush.id, id_ejercicio: ej["Press Militar con Barra"] },
      { dia: "Jueves", series: 3, repeticiones: "12-15", carga_proyectada: "12 kg c/u", id_rutina: rutinaPush.id, id_ejercicio: ej["Elevaciones Laterales con Mancuernas"] },
      { dia: "Jueves", series: 3, repeticiones: "10-12", carga_proyectada: "32 kg", id_rutina: rutinaPush.id, id_ejercicio: ej["Extensión de Tríceps en Polea Alta"] },
      { dia: "Jueves", series: 2, repeticiones: "12-15", carga_proyectada: "Peso corporal", id_rutina: rutinaPush.id, id_ejercicio: ej["Fondos en Paralelas"] },
    ];
    await sql`INSERT INTO detalle_rutina ${sql(detallePush, "dia", "series", "repeticiones", "carga_proyectada", "id_rutina", "id_ejercicio")}`;

    // Rutina 2: PULL (Espalda + Bíceps) â€” Martes / Viernes
    const [rutinaPull] = await sql`
      INSERT INTO rutinas (nombre, fecha_inicio, fecha_fin, activa, id_cliente, id_entrenador, es_plantilla, created_at)
      VALUES (
        'PPL â€” Pull (Tracción)',
        CURRENT_DATE - INTERVAL '3 months',
        CURRENT_DATE + INTERVAL '3 months',
        true,
        ${devClientId}, ${devTrainerId}, false,
        NOW() - INTERVAL '3 months'
      ) RETURNING id
    `;
    const detallePull = [
      { dia: "Martes", series: 4, repeticiones: "6-8", carga_proyectada: "120 kg", id_rutina: rutinaPull.id, id_ejercicio: ej["Peso Muerto Convencional"] },
      { dia: "Martes", series: 4, repeticiones: "6-8", carga_proyectada: "Peso corporal", id_rutina: rutinaPull.id, id_ejercicio: ej["Dominadas Supinas"] },
      { dia: "Martes", series: 4, repeticiones: "8-10", carga_proyectada: "75 kg", id_rutina: rutinaPull.id, id_ejercicio: ej["Remo con Barra"] },
      { dia: "Martes", series: 3, repeticiones: "10-12", carga_proyectada: "55 kg", id_rutina: rutinaPull.id, id_ejercicio: ej["Jalón al Pecho en Polea"] },
      { dia: "Martes", series: 3, repeticiones: "10-12", carga_proyectada: "50 kg", id_rutina: rutinaPull.id, id_ejercicio: ej["Remo en Polea Baja"] },
      { dia: "Martes", series: 3, repeticiones: "10-12", carga_proyectada: "35 kg", id_rutina: rutinaPull.id, id_ejercicio: ej["Curl de Bíceps con Barra"] },
      { dia: "Martes", series: 3, repeticiones: "12-15", carga_proyectada: "16 kg c/u", id_rutina: rutinaPull.id, id_ejercicio: ej["Curl Martillo con Mancuernas"] },
      { dia: "Martes", series: 2, repeticiones: "15", carga_proyectada: "15 kg", id_rutina: rutinaPull.id, id_ejercicio: ej["Face Pull en Polea"] },
      { dia: "Viernes", series: 4, repeticiones: "5-6", carga_proyectada: "125 kg", id_rutina: rutinaPull.id, id_ejercicio: ej["Peso Muerto Convencional"] },
      { dia: "Viernes", series: 4, repeticiones: "6-8", carga_proyectada: "Peso corporal +5kg", id_rutina: rutinaPull.id, id_ejercicio: ej["Dominadas Supinas"] },
      { dia: "Viernes", series: 4, repeticiones: "8-10", carga_proyectada: "77 kg", id_rutina: rutinaPull.id, id_ejercicio: ej["Remo con Barra"] },
      { dia: "Viernes", series: 3, repeticiones: "10-12", carga_proyectada: "57 kg", id_rutina: rutinaPull.id, id_ejercicio: ej["Jalón al Pecho en Polea"] },
      { dia: "Viernes", series: 3, repeticiones: "10-12", carga_proyectada: "52 kg", id_rutina: rutinaPull.id, id_ejercicio: ej["Remo en Polea Baja"] },
      { dia: "Viernes", series: 3, repeticiones: "10-12", carga_proyectada: "37 kg", id_rutina: rutinaPull.id, id_ejercicio: ej["Curl de Bíceps con Barra"] },
      { dia: "Viernes", series: 3, repeticiones: "12-15", carga_proyectada: "18 kg c/u", id_rutina: rutinaPull.id, id_ejercicio: ej["Curl Martillo con Mancuernas"] },
    ];
    await sql`INSERT INTO detalle_rutina ${sql(detallePull, "dia", "series", "repeticiones", "carga_proyectada", "id_rutina", "id_ejercicio")}`;

    // Rutina 3: LEGS (Piernas + Core) â€” Miércoles / Sábado
    const [rutinaLegs] = await sql`
      INSERT INTO rutinas (nombre, fecha_inicio, fecha_fin, activa, id_cliente, id_entrenador, es_plantilla, created_at)
      VALUES (
        'PPL — Legs (Tren Inferior + Core)',
        CURRENT_DATE - INTERVAL '3 months',
        CURRENT_DATE + INTERVAL '3 months',
        true,
        ${devClientId}, ${devTrainerId}, false,
        NOW() - INTERVAL '3 months'
      ) RETURNING id
    `;
    const detalleLegs = [
      { dia: "Miércoles", series: 4, repeticiones: "6-8", carga_proyectada: "100 kg", id_rutina: rutinaLegs.id, id_ejercicio: ej["Sentadilla Libre"] },
      { dia: "Miércoles", series: 4, repeticiones: "8-10", carga_proyectada: "160 kg", id_rutina: rutinaLegs.id, id_ejercicio: ej["Prensa de Piernas 45°"] },
      { dia: "Miércoles", series: 3, repeticiones: "10-12", carga_proyectada: "90 kg", id_rutina: rutinaLegs.id, id_ejercicio: ej["Hip Thrust con Barra"] },
      { dia: "Miércoles", series: 3, repeticiones: "10-12", carga_proyectada: "40 kg", id_rutina: rutinaLegs.id, id_ejercicio: ej["Curl Femoral Tumbado"] },
      { dia: "Miércoles", series: 3, repeticiones: "12-15", carga_proyectada: "50 kg", id_rutina: rutinaLegs.id, id_ejercicio: ej["Extensión de Cuádriceps"] },
      { dia: "Miércoles", series: 3, repeticiones: "10", carga_proyectada: "20 kg c/u", id_rutina: rutinaLegs.id, id_ejercicio: ej["Sentadilla Búlgara"] },
      { dia: "Miércoles", series: 3, repeticiones: "60 seg", carga_proyectada: "Isométrico", id_rutina: rutinaLegs.id, id_ejercicio: ej["Plancha Isométrica"] },
      { dia: "Miércoles", series: 3, repeticiones: "15", carga_proyectada: "Peso corporal", id_rutina: rutinaLegs.id, id_ejercicio: ej["Crunch Abdominal"] },
      { dia: "Sábado", series: 4, repeticiones: "5-6", carga_proyectada: "105 kg", id_rutina: rutinaLegs.id, id_ejercicio: ej["Sentadilla Libre"] },
      { dia: "Sábado", series: 4, repeticiones: "8-10", carga_proyectada: "165 kg", id_rutina: rutinaLegs.id, id_ejercicio: ej["Prensa de Piernas 45°"] },
      { dia: "Sábado", series: 3, repeticiones: "10-12", carga_proyectada: "95 kg", id_rutina: rutinaLegs.id, id_ejercicio: ej["Hip Thrust con Barra"] },
      { dia: "Sábado", series: 3, repeticiones: "10-12", carga_proyectada: "70 kg", id_rutina: rutinaLegs.id, id_ejercicio: ej["Peso Muerto Rumano"] },
      { dia: "Sábado", series: 3, repeticiones: "12", carga_proyectada: "Peso corporal", id_rutina: rutinaLegs.id, id_ejercicio: ej["Curl Femoral Tumbado"] },
      { dia: "Sábado", series: 3, repeticiones: "60 seg", carga_proyectada: "Isométrico", id_rutina: rutinaLegs.id, id_ejercicio: ej["Plancha Isométrica"] },
      { dia: "Sábado", series: 3, repeticiones: "10", carga_proyectada: "Peso corporal", id_rutina: rutinaLegs.id, id_ejercicio: ej["Rueda Abdominal (Ab Wheel)"] },
    ];
    await sql`INSERT INTO detalle_rutina ${sql(detalleLegs, "dia", "series", "repeticiones", "carga_proyectada", "id_rutina", "id_ejercicio")}`;

    // PLANTILLA REUTILIZABLE (es_plantilla = true, sin cliente asignado)
    const [rutinaPlantilla] = await sql`
      INSERT INTO rutinas (nombre, fecha_inicio, activa, id_cliente, id_entrenador, es_plantilla, created_at)
      VALUES (
        'Plantilla — Full Body Fuerza',
        CURRENT_DATE,
        true,
        NULL, ${devTrainerId}, true,
        NOW()
      ) RETURNING id
    `;
    const detallePlantilla = [
      { dia: "Lunes", series: 4, repeticiones: "5", carga_proyectada: "RM estimado 85%", id_rutina: rutinaPlantilla.id, id_ejercicio: ej["Sentadilla Libre"] },
      { dia: "Lunes", series: 4, repeticiones: "5", carga_proyectada: "RM estimado 85%", id_rutina: rutinaPlantilla.id, id_ejercicio: ej["Press de Banca Plano"] },
      { dia: "Lunes", series: 4, repeticiones: "5", carga_proyectada: "RM estimado 80%", id_rutina: rutinaPlantilla.id, id_ejercicio: ej["Peso Muerto Convencional"] },
      { dia: "Lunes", series: 3, repeticiones: "8", carga_proyectada: "RM estimado 70%", id_rutina: rutinaPlantilla.id, id_ejercicio: ej["Press Militar con Barra"] },
      { dia: "Lunes", series: 3, repeticiones: "8", carga_proyectada: "Peso corporal", id_rutina: rutinaPlantilla.id, id_ejercicio: ej["Dominadas Supinas"] },
      { dia: "Miércoles", series: 4, repeticiones: "5", carga_proyectada: "RM estimado 87%", id_rutina: rutinaPlantilla.id, id_ejercicio: ej["Sentadilla Libre"] },
      { dia: "Miércoles", series: 4, repeticiones: "5", carga_proyectada: "RM estimado 87%", id_rutina: rutinaPlantilla.id, id_ejercicio: ej["Press de Banca Plano"] },
      { dia: "Miércoles", series: 4, repeticiones: "5", carga_proyectada: "RM estimado 82%", id_rutina: rutinaPlantilla.id, id_ejercicio: ej["Peso Muerto Convencional"] },
      { dia: "Viernes", series: 4, repeticiones: "3", carga_proyectada: "RM estimado 90%", id_rutina: rutinaPlantilla.id, id_ejercicio: ej["Sentadilla Libre"] },
      { dia: "Viernes", series: 4, repeticiones: "3", carga_proyectada: "RM estimado 90%", id_rutina: rutinaPlantilla.id, id_ejercicio: ej["Press de Banca Plano"] },
      { dia: "Viernes", series: 1, repeticiones: "1 (Test RM)", carga_proyectada: "RM máximo", id_rutina: rutinaPlantilla.id, id_ejercicio: ej["Peso Muerto Convencional"] },
    ];
    await sql`INSERT INTO detalle_rutina ${sql(detallePlantilla, "dia", "series", "repeticiones", "carga_proyectada", "id_rutina", "id_ejercicio")}`;

    // Rutinas simples para los 5 clientes asignados al entrenador dev
    console.log("ðŸ“‹ Asignando rutinas a los 5 clientes del entrenador dev...");
    const rutinaTemplates = [
      {
        nombre: "Hipertrofia — Tren Superior A", ejDias: [
          { dia: "Lunes", series: 4, repeticiones: "8-10", carga: "70%RM", ejKey: "Press de Banca Plano" },
          { dia: "Lunes", series: 4, repeticiones: "8-10", carga: "65%RM", ejKey: "Remo con Barra" },
          { dia: "Lunes", series: 3, repeticiones: "10-12", carga: "50%RM", ejKey: "Press Militar con Barra" },
          { dia: "Jueves", series: 4, repeticiones: "8-10", carga: "72%RM", ejKey: "Press de Banca Inclinado" },
          { dia: "Jueves", series: 4, repeticiones: "10-12", carga: "60%RM", ejKey: "Jalón al Pecho en Polea" },
          { dia: "Jueves", series: 3, repeticiones: "12-15", carga: "10kg c/u", ejKey: "Elevaciones Laterales con Mancuernas" },
        ]
      },
      {
        nombre: "Fuerza — Tren Inferior B", ejDias: [
          { dia: "Martes", series: 5, repeticiones: "5", carga: "80%RM", ejKey: "Sentadilla Libre" },
          { dia: "Martes", series: 4, repeticiones: "8", carga: "140kg", ejKey: "Prensa de Piernas 45°" },
          { dia: "Martes", series: 3, repeticiones: "10", carga: "80kg", ejKey: "Hip Thrust con Barra" },
          { dia: "Viernes", series: 5, repeticiones: "5", carga: "82%RM", ejKey: "Sentadilla Libre" },
          { dia: "Viernes", series: 3, repeticiones: "10-12", carga: "50kg", ejKey: "Curl Femoral Tumbado" },
          { dia: "Viernes", series: 3, repeticiones: "12", carga: "60kg", ejKey: "Extensión de Cuádriceps" },
        ]
      },
      {
        nombre: "Tonificación â€” Full Body C", ejDias: [
          { dia: "Lunes", series: 3, repeticiones: "12-15", carga: "60%RM", ejKey: "Sentadilla Libre" },
          { dia: "Lunes", series: 3, repeticiones: "12-15", carga: "60%RM", ejKey: "Press de Banca Plano" },
          { dia: "Miércoles", series: 3, repeticiones: "12-15", carga: "65%RM", ejKey: "Remo con Barra" },
          { dia: "Miércoles", series: 3, repeticiones: "15", carga: "PC", ejKey: "Dominadas Supinas" },
          { dia: "Viernes", series: 3, repeticiones: "15-20", carga: "60seg", ejKey: "Plancha Isométrica" },
          { dia: "Viernes", series: 3, repeticiones: "15", carga: "PC", ejKey: "Crunch Abdominal" },
        ]
      },
      {
        nombre: "Composición â€” Push-Pull D", ejDias: [
          { dia: "Lunes", series: 4, repeticiones: "8-10", carga: "75%RM", ejKey: "Press de Banca Plano" },
          { dia: "Lunes", series: 3, repeticiones: "10-12", carga: "55%RM", ejKey: "Press Militar con Barra" },
          { dia: "Martes", series: 4, repeticiones: "6-8", carga: "85%RM", ejKey: "Peso Muerto Convencional" },
          { dia: "Martes", series: 4, repeticiones: "8-10", carga: "PC", ejKey: "Dominadas Supinas" },
          { dia: "Jueves", series: 4, repeticiones: "6-8", carga: "78%RM", ejKey: "Sentadilla Libre" },
          { dia: "Jueves", series: 3, repeticiones: "10-12", carga: "75kg", ejKey: "Hip Thrust con Barra" },
        ]
      },
      {
        nombre: "Fuerza Base — Principiante E", ejDias: [
          { dia: "Lunes", series: 3, repeticiones: "10", carga: "Barra sola", ejKey: "Sentadilla Libre" },
          { dia: "Lunes", series: 3, repeticiones: "10", carga: "40kg", ejKey: "Press de Banca Plano" },
          { dia: "Lunes", series: 3, repeticiones: "10", carga: "50kg", ejKey: "Peso Muerto Convencional" },
          { dia: "Miércoles", series: 3, repeticiones: "8-10", carga: "30kg", ejKey: "Remo con Barra" },
          { dia: "Miércoles", series: 3, repeticiones: "10", carga: "PC asistido", ejKey: "Dominadas Supinas" },
          { dia: "Viernes", series: 3, repeticiones: "10", carga: "Barra sola", ejKey: "Press Militar con Barra" },
          { dia: "Viernes", series: 3, repeticiones: "45 seg", "carga": "Isométrico", ejKey: "Plancha Isométrica" },
        ]
      },
    ];

    for (let i = 0; i < clientesDevAsignados.length; i++) {
      const cliente = clientesDevAsignados[i];
      const template = rutinaTemplates[i % rutinaTemplates.length];
      const [rutinaCliente] = await sql`
        INSERT INTO rutinas (nombre, fecha_inicio, fecha_fin, activa, id_cliente, id_entrenador, es_plantilla, created_at)
        VALUES (
          ${template.nombre},
          CURRENT_DATE - INTERVAL '2 months',
          CURRENT_DATE + INTERVAL '4 months',
          true,
          ${cliente.id_cliente}, ${devTrainerId}, false,
          NOW() - INTERVAL '2 months'
        ) RETURNING id
      `;
      const detallesCliente = template.ejDias.map(d => ({
        dia: d.dia,
        series: d.series,
        repeticiones: d.repeticiones,
        carga_proyectada: d.carga,
        id_rutina: rutinaCliente.id,
        id_ejercicio: ej[d.ejKey],
      })).filter(d => d.id_ejercicio); // guard: solo si el ejercicio existe
      if (detallesCliente.length > 0) {
        await sql`INSERT INTO detalle_rutina ${sql(detallesCliente, "dia", "series", "repeticiones", "carga_proyectada", "id_rutina", "id_ejercicio")}`;
      }
    }
    console.log(`   âœ… Rutinas creadas: 4 para cliente_dev (PPL x3 + plantilla) + ${clientesDevAsignados.length} para sus alumnos`);

    // =========================================================
    // 10.5 REGISTRO DE PROGRESO HISTÓRICO (3 meses, cliente_dev)
    // =========================================================
    console.log("ðŸ“Š Generando historial de progreso para cliente_dev (3 meses)...");

    // Sesiones de entrenamiento los días de su respectiva rutina
    // Push: Lunes/Jueves | Pull: Martes/Viernes | Legs: Miércoles/Sábado
    const schedulePPL = {
      1: {
        rutinaId: rutinaPush.id, diasEj: [ // Lunes
          { ejKey: "Press de Banca Plano", cargas: [80, 80, 82, 82], repsBase: 7 },
          { ejKey: "Press de Banca Inclinado", cargas: [60, 60, 62], repsBase: 9 },
          { ejKey: "Press Militar con Barra", cargas: [60, 60, 62, 62], repsBase: 9 },
          { ejKey: "Elevaciones Laterales con Mancuernas", cargas: [10, 10, 10], repsBase: 13 },
          { ejKey: "Extensión de Tríceps en Polea Alta", cargas: [30, 30, 32], repsBase: 11 },
        ]
      },
      2: {
        rutinaId: rutinaPull.id, diasEj: [ // Martes
          { ejKey: "Peso Muerto Convencional", cargas: [120, 120, 125, 125], repsBase: 5 },
          { ejKey: "Dominadas Supinas", cargas: [0, 0, 0, 0], repsBase: 7 },
          { ejKey: "Remo con Barra", cargas: [75, 75, 77, 77], repsBase: 9 },
          { ejKey: "Jalón al Pecho en Polea", cargas: [55, 55, 57], repsBase: 11 },
          { ejKey: "Curl de Bíceps con Barra", cargas: [35, 35, 37], repsBase: 11 },
        ]
      },
      3: {
        rutinaId: rutinaLegs.id, diasEj: [ // Miércoles
          { ejKey: "Sentadilla Libre", cargas: [100, 100, 102, 102], repsBase: 6 },
          { ejKey: "Prensa de Piernas 45°", cargas: [160, 160, 165, 165], repsBase: 9 },
          { ejKey: "Hip Thrust con Barra", cargas: [90, 90, 95], repsBase: 11 },
          { ejKey: "Curl Femoral Tumbado", cargas: [40, 40, 42], repsBase: 11 },
          { ejKey: "Plancha Isométrica", cargas: [0, 0, 0], repsBase: 60 }, // segundos
        ]
      },
      4: {
        rutinaId: rutinaPull.id, diasEj: [ // Jueves â†’ Push
          { ejKey: "Press de Banca Plano", cargas: [82, 82, 84, 84], repsBase: 7 },
          { ejKey: "Press de Banca Inclinado", cargas: [62, 62, 64], repsBase: 9 },
          { ejKey: "Press Militar con Barra", cargas: [62, 62, 64, 64], repsBase: 8 },
          { ejKey: "Aperturas con Mancuernas", cargas: [16, 16, 18], repsBase: 11 },
          { ejKey: "Extensión de Tríceps en Polea Alta", cargas: [32, 32, 34], repsBase: 11 },
        ]
      },
      5: {
        rutinaId: rutinaPull.id, diasEj: [ // Viernes â†’ Pull
          { ejKey: "Peso Muerto Convencional", cargas: [125, 125, 130, 130], repsBase: 5 },
          { ejKey: "Dominadas Supinas", cargas: [0, 0, 0, 0], repsBase: 7 },
          { ejKey: "Remo con Barra", cargas: [77, 77, 80, 80], repsBase: 9 },
          { ejKey: "Jalón al Pecho en Polea", cargas: [57, 57, 60], repsBase: 11 },
          { ejKey: "Curl Martillo con Mancuernas", cargas: [16, 16, 18], repsBase: 13 },
        ]
      },
      6: {
        rutinaId: rutinaLegs.id, diasEj: [ // Sábado â†’ Legs
          { ejKey: "Sentadilla Libre", cargas: [105, 105, 107, 107], repsBase: 5 },
          { ejKey: "Prensa de Piernas 45°", cargas: [165, 165, 170, 170], repsBase: 9 },
          { ejKey: "Hip Thrust con Barra", cargas: [95, 95, 100], repsBase: 11 },
          { ejKey: "Peso Muerto Rumano", cargas: [70, 70, 72], repsBase: 11 },
          { ejKey: "Plancha Isométrica", cargas: [0, 0, 0], repsBase: 60 },
        ]
      },
    };

    const progresoBuffer = [];
    const porcentajeProgresion = 0.008; // ~0.8% mejora por semana en cargas
    const fecha3meses = new Date();
    fecha3meses.setMonth(fecha3meses.getMonth() - 3);

    let semana = 0;
    const iterDate = new Date(fecha3meses);
    while (iterDate <= new Date()) {
      const dow = iterDate.getDay(); // 0=Dom, 1=Lun...6=Sáb
      if (schedulePPL[dow]) {
        // El cliente asiste con un 80% de probabilidad (realista)
        if (Math.random() < 0.80) {
          const { rutinaId, diasEj } = schedulePPL[dow];
          for (const ejercicioSesion of diasEj) {
            const ejId = ej[ejercicioSesion.ejKey];
            if (!ejId) continue;
            const factorProgresion = 1 + (semana * porcentajeProgresion);
            // RPE varía: el primer mes (semanas 0-4) es más fácil, sube gradualmente
            const rpe = Math.min(10, Math.max(6, 7 + Math.floor(semana / 3)));

            for (let s = 0; s < ejercicioSesion.cargas.length; s++) {
              const cargaBase = ejercicioSesion.cargas[s];
              const cargaReal = cargaBase > 0
                ? Math.round(cargaBase * factorProgresion * 2) / 2  // redondea a 0.5 kg
                : 0;
              const repsReales = Math.max(1, ejercicioSesion.repsBase + getRandomInt(-1, 1));
              progresoBuffer.push({
                fecha: new Date(iterDate),
                series_reales: s + 1,
                reps_reales: repsReales,
                carga_real: cargaReal > 0 ? `${cargaReal} kg` : "Peso corporal",
                rpe,
                comentarios: s === ejercicioSesion.cargas.length - 1
                  ? getRandomItem(["Ãšltima serie con buen control", "Se siente fuerte hoy", "Técnica sólida", "Ligera fatiga acumulada", null, null, null])
                  : null,
                id_cliente: devClientId,
                id_ejercicio: ejId,
                id_rutina: rutinaId,
              });
            }
          }
        }
      }
      // Incrementar semana cada 7 días
      if (dow === 0) semana++;
      iterDate.setDate(iterDate.getDate() + 1);
    }

    // Insertar en bloques de 100
    for (let i = 0; i < progresoBuffer.length; i += 100) {
      const chunk = progresoBuffer.slice(i, i + 100);
      await sql`INSERT INTO registro_progreso ${sql(chunk, "fecha", "series_reales", "reps_reales", "carga_real", "rpe", "comentarios", "id_cliente", "id_ejercicio", "id_rutina")}`;
    }
    console.log(`   âœ… Registros de progreso generados: ${progresoBuffer.length} (cliente_dev, 3 meses)`);

    // 10. REPORTES
    console.log("ðŸ“ˆ Generando Historial de Reportes...");
    const reportesBuffer = [];
    for (let r = 0; r < 40; r++) {
      const tiposReporte = [
        "financiero",
        "operativo",
        "inventario",
        "asistencia",
      ];
      const tipoD = getRandomItem(tiposReporte);
      const fechaGeneracion = getHistoricalDate(0, 1);
      reportesBuffer.push({
        titulo: `Auditoría ${tipoD.charAt(0).toUpperCase() + tipoD.slice(1)} - ${fechaGeneracion.toLocaleString("es-CL", { month: "long", year: "numeric" })}`,
        tipo: tipoD,
        contenido: sql.json({
          analisis:
            "Generado automáticamente por el sistema de auditoría mensual.",
          metricas_clave: {
            transacciones_revisadas: getRandomInt(100, 500),
            margen_error: "0.2%",
          },
          estado: "Aprobado",
        }),
        id_staff: adminProfile.id,
        fecha_generacion: fechaGeneracion,
      });
    }
    await sql`INSERT INTO reportes ${sql(reportesBuffer, "titulo", "tipo", "contenido", "id_staff", "fecha_generacion")}`;

    console.log("==========================================");
    console.log("âœ… SIEMBRA 5.0 COMPLETADA EXITOSAMENTE");
    console.log(`   ðŸ“Š Clientes: 151 (150 random + 1 dev)`);
    console.log(`   ðŸ’ª Sesiones de entrenador: ${sesionesBuffer.length}`);
    console.log(`   ðŸ“… Asistencias orgánicas: ${totalAsistencias}`);
    console.log(`   ðŸ‹ï¸ Ejercicios en biblioteca: ${ejerciciosDb.length} (con URL de video)`);
    console.log(`   ðŸ—‚ï¸ Rutinas: 4 PPL para cliente_dev + 5 para alumnos + 1 plantilla`);
    console.log(`   ðŸ“Š Registros de progreso: ${progresoBuffer.length} entradas (3 meses, cliente_dev)`);
    console.log(`   ðŸ“… Asistencias orgánicas: ${totalAsistencias}`);
    console.log(`   ðŸ‹ï¸ Ejercicios en biblioteca: ${ejerciciosDb.length}`);
    console.log(`   ðŸ“ˆ Reportes históricos: ${reportesBuffer.length}`);
    console.log("==========================================");
    console.log("ðŸ”‘ CREDENCIALES DE PRUEBA:");
    console.log(`   admin          â†’ admin / 123456   (${DEV_EMAIL_ADMIN})`);
    console.log(
      `   entrenador_dev â†’ entrenador_dev / 123456   (${DEV_EMAIL_TRAINER})`,
    );
    console.log(
      `   cliente_dev    â†’ cliente_dev / 123456   (${DEV_EMAIL_CLIENT})`,
    );
    console.log("==========================================");
  } catch (error) {
    console.error("âŒ Error fatal en el seed:", error);
  } finally {
    await sql.end();
  }
}

seed();