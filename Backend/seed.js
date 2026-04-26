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
const GMAIL_BASE = "torretahk.github@gmail.com";
const DEV_EMAIL_ADMIN = GMAIL_BASE; // admin@gmail
const DEV_EMAIL_TRAINER = "torretahk.github+entrenador@gmail.com"; // mismo buzón
const DEV_EMAIL_CLIENT = "torretahk.github+cliente@gmail.com"; // mismo buzón

async function seed() {
  console.log(
    "🌱 Iniciando Siembra ENTERPRISE 4.0 (con módulo de entrenador completo)...",
  );

  try {
    // 0. LIMPIEZA TOTAL
    console.log("🧹 Limpiando base de datos...");
    await sql`
      TRUNCATE TABLE 
      reportes, maquinas, registro_progreso, asistencia, medidas_fisicas, 
      sesiones_entrenador, detalle_rutina, rutinas, ejercicios, pagos, membresias, planes,
      administradores, colaboradores, clientes, entrenadores, usuarios, roles
      RESTART IDENTITY CASCADE
    `;

    // 1. ROLES
    console.log("🏗️ Construyendo cimientos...");
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
    console.log("🧪 Creando usuarios de prueba de desarrollo...");

    // ADMIN (mismo correo real)
    const [uAdmin] = await sql`
      INSERT INTO usuarios (username, email, password, estado, id_rol)
      VALUES ('admin', ${DEV_EMAIL_ADMIN}, ${password}, 'active', ${getRol("administrador")})
      RETURNING id
    `;
    const [adminProfile] = await sql`
      INSERT INTO administradores (nombre, cargo, id_usuario)
      VALUES ('Admin Principal', 'Gerente General', ${uAdmin.id})
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

    console.log("✅ Usuarios de prueba creados:");
    console.log(
      `   👤 admin          | email: ${DEV_EMAIL_ADMIN}    | pass: 123456`,
    );
    console.log(
      `   👤 entrenador_dev | email: ${DEV_EMAIL_TRAINER} | pass: 123456`,
    );
    console.log(
      `   👤 cliente_dev    | email: ${DEV_EMAIL_CLIENT}  | pass: 123456`,
    );

    const staffAttendancePool = [];

    // 1.2 STAFF OPERATIVO
    console.log("🧹 Contratando Staff...");
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
            INSERT INTO colaboradores (rut, nombre, telefono, cargo, turno, sueldo_base, id_usuario, fecha_contratacion, created_at) 
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
    console.log("💪 Contratando Entrenadores...");
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

    // 4. CLIENTES CON HÁBITOS REALISTAS
    console.log("👥 Registrando 150 Clientes VIP...");
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
      INSERT INTO pagos (monto, metodo_pago, id_membresia, id_administrador, fecha_pago)
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

    // 5. SIMULACIÓN TEMPORAL
    console.log("⏳ Ejecutando simulación temporal...");
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
            await sql`INSERT INTO pagos (monto, metodo_pago, id_membresia, id_administrador, fecha_pago) VALUES (${planElegido.precio}, ${metodoPagoElegido}, ${m.id}, ${adminProfile.id}, ${currentDate})`;
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
      "📅 Generando sesiones de entrenadores (6 meses histórico + próximas)...",
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
    console.log(`   📊 Sesiones generadas: ${sesionesBuffer.length}`);

    // =========================================================
    // 7. RUTINAS PARA ENTRENADOR DEV (Para que su dashboard no esté vacío)
    // =========================================================
    console.log("🏋️ Creando rutinas para el entrenador de desarrollo...");
    const clientesDevAsignados = clientesConEntrenador
      .filter((c) => c.id_entrenador === devTrainerId)
      .slice(0, 5);

    for (const cliente of clientesDevAsignados) {
      // Creamos una rutina asignada al cliente (activa = true)
      const [rutina] = await sql`
        INSERT INTO rutinas (nombre, id_cliente, id_entrenador, activa)
        VALUES (
          ${`Rutina ${getRandomItem(["Fuerza A", "Hipertrofia B", "Full Body C", "Push Pull D", "Tonificación E"])}`},
          ${cliente.id_cliente},
          ${devTrainerId},
          true
        ) RETURNING id
      `;
    }

    // 8. INVENTARIO
    console.log("🔧 Equipando Inventario...");
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
          id_administrador: adminProfile.id,
        });
      }
    }
    await sql`INSERT INTO maquinas ${sql(machinesBuffer, "nombre", "marca", "codigo_serie", "estado", "fecha_adquisicion", "id_administrador")}`;

    // 9. BIBLIOTECA DE EJERCICIOS
    console.log("🏋️ Creando Biblioteca de Ejercicios...");
    const ejerciciosDb = [
      {
        nombre: "Press de Banca Plano",
        grupo_muscular: "Pecho",
        descripcion:
          "Ejercicio compuesto para desarrollar fuerza en el pectoral mayor.",
      },
      {
        nombre: "Sentadilla Libre",
        grupo_muscular: "Piernas",
        descripcion:
          "Rey de los ejercicios de piernas, enfocado en cuádriceps y glúteos.",
      },
      {
        nombre: "Dominadas Supinas",
        grupo_muscular: "Espalda",
        descripcion: "Ejercicio de tracción vertical para dorsales y bíceps.",
      },
      {
        nombre: "Peso Muerto Convencional",
        grupo_muscular: "Espalda",
        descripcion: "Ejercicio fundamental para la cadena posterior completa.",
      },
      {
        nombre: "Press Militar con Barra",
        grupo_muscular: "Hombros",
        descripcion: "Empuje vertical para el desarrollo de los deltoides.",
      },
      {
        nombre: "Curl de Bíceps con Barra",
        grupo_muscular: "Brazos",
        descripcion: "Aislamiento clásico para el desarrollo del bíceps.",
      },
      {
        nombre: "Extensión de Tríceps en Polea",
        grupo_muscular: "Brazos",
        descripcion: "Aislamiento para las tres cabezas del tríceps.",
      },
      {
        nombre: "Prensa de Piernas",
        grupo_muscular: "Piernas",
        descripcion: "Máquina de empuje para hipertrofia del tren inferior.",
      },
      {
        nombre: "Remo con Barra",
        grupo_muscular: "Espalda",
        descripcion: "Tracción horizontal pesada para grosor de la espalda.",
      },
      {
        nombre: "Hip Thrust",
        grupo_muscular: "Piernas",
        descripcion: "Ejercicio por excelencia para el aislamiento de glúteos.",
      },
      {
        nombre: "Elevaciones Laterales",
        grupo_muscular: "Hombros",
        descripcion: "Aislamiento para el deltoides lateral.",
      },
      {
        nombre: "Crunch Abdominal",
        grupo_muscular: "Core",
        descripcion: "Contracción clásica para el recto abdominal.",
      },
    ];
    await sql`INSERT INTO ejercicios ${sql(ejerciciosDb, "nombre", "grupo_muscular", "descripcion")}`;

    // 10. REPORTES
    console.log("📈 Generando Historial de Reportes...");
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
        id_administrador: adminProfile.id,
        fecha_generacion: fechaGeneracion,
      });
    }
    await sql`INSERT INTO reportes ${sql(reportesBuffer, "titulo", "tipo", "contenido", "id_administrador", "fecha_generacion")}`;

    console.log("==========================================");
    console.log("✅ SIEMBRA 4.0 COMPLETADA EXITOSAMENTE");
    console.log(`   📊 Clientes: 151 (150 random + 1 dev)`);
    console.log(`   💪 Sesiones de entrenador: ${sesionesBuffer.length}`);
    console.log(`   📅 Asistencias orgánicas: ${totalAsistencias}`);
    console.log(`   🏋️ Ejercicios en biblioteca: ${ejerciciosDb.length}`);
    console.log(`   📈 Reportes históricos: ${reportesBuffer.length}`);
    console.log("==========================================");
    console.log("🔑 CREDENCIALES DE PRUEBA:");
    console.log(`   admin          → admin / 123456   (${DEV_EMAIL_ADMIN})`);
    console.log(
      `   entrenador_dev → entrenador_dev / 123456   (${DEV_EMAIL_TRAINER})`,
    );
    console.log(
      `   cliente_dev    → cliente_dev / 123456   (${DEV_EMAIL_CLIENT})`,
    );
    console.log("==========================================");
  } catch (error) {
    console.error("❌ Error fatal en el seed:", error);
  } finally {
    await sql.end();
  }
}

seed();
