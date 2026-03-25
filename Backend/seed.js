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
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFloat = (min, max, decimals = 1) => parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
const getRandomItem = (arr) => arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;

// Generador de horas ponderado (Pico tarde)
const getRandomTime = (shift = 'General') => {
  const rand = Math.random();
  let hour;
  if (shift === 'Mañana') hour = getRandomInt(7, 13);
  else if (shift === 'Tarde') hour = getRandomInt(14, 21);
  else { // Clientes
    if (rand < 0.2) hour = getRandomInt(6, 9);
    else if (rand < 0.3) hour = getRandomInt(10, 11);
    else if (rand < 0.45) hour = getRandomInt(12, 14);
    else if (rand < 0.55) hour = getRandomInt(15, 16);
    else if (rand < 0.9) hour = getRandomInt(17, 21);
    else hour = getRandomInt(21, 22);
  }
  return { hour, minute: getRandomInt(0, 59) };
};

// Generador de fecha pasada para antigüedad
const getHistoricalDate = (minYears, maxYears) => {
    const date = new Date();
    const years = getRandomInt(minYears, maxYears);
    date.setFullYear(date.getFullYear() - years);
    date.setMonth(getRandomInt(0, 11));
    return date;
};

async function seed() {
  console.log("🌱 Iniciando Siembra ENTERPRISE 2.0 (Progreso & Inventario)...");

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

    // 1. CONFIGURACIÓN BASE (ROLES)
    console.log("🏗️ Construyendo cimientos...");
    const roles = await sql`
        INSERT INTO roles (nombre) 
        VALUES ('administrador'), ('entrenador'), ('cliente'), ('recepcionista'), ('mantenimiento'), ('aseo') 
        RETURNING *
    `;
    const getRol = (name) => roles.find((r) => r.nombre === name).id;
    const password = await bcrypt.hash("123456", 10);

    // 1.1 ADMIN
    const [uAdmin] = await sql`INSERT INTO usuarios (username, email, password, estado, id_rol) VALUES ('admin', 'admin@gymtrack.com', ${password}, 'active', ${getRol("administrador")}) RETURNING id`;
    const [adminProfile] = await sql`INSERT INTO administradores (nombre, cargo, id_usuario) VALUES ('Admin Principal', 'Gerente General', ${uAdmin.id}) RETURNING id`;

    const staffAttendancePool = []; 

    // 1.2 STAFF OPERATIVO MEJORADO (Antigüedad y Roles)
    console.log("🧹 Contratando Staff...");
    
    const staffData = [
        { nombre: "Maria Recepcionista", rut: "15.555.555-5", cargo: "Recepcionista", turno: "Mañana", sueldo: 500000, antiguedad: 3 },
        { nombre: "Pedro Recepcionista", rut: "18.888.888-8", cargo: "Recepcionista", turno: "Tarde", sueldo: 480000, antiguedad: 1 },
        { nombre: "Juan Limpieza", rut: "16.666.666-6", cargo: "Aseo", turno: "Tarde", sueldo: 450000, antiguedad: 2 },
        { nombre: "Luisa Limpieza", rut: "17.777.777-7", cargo: "Aseo", turno: "Mañana", sueldo: 450000, antiguedad: 4 },
        { nombre: "Carlos Técnico", rut: "14.444.444-4", cargo: "Mantenimiento", turno: "Full Time", sueldo: 650000, antiguedad: 5 },
    ];

    for (const s of staffData) {
        const username = s.nombre.split(" ")[0].toLowerCase() + "_" + s.cargo.substring(0,3).toLowerCase();
        // Fallback seguro para roles (si 'mantenimiento' no existe en DB como rol de usuario, usa 'recepcionista' o similar para login)
        let roleId = getRol(s.cargo.toLowerCase());
        if (!roleId) roleId = getRol('recepcionista'); // Fallback

        const [u] = await sql`INSERT INTO usuarios (username, email, password, estado, id_rol) VALUES (${username}, ${`${username}@gym.com`}, ${password}, 'active', ${roleId}) RETURNING id`;
        
        await sql`
            INSERT INTO colaboradores (rut, nombre, telefono, cargo, turno, sueldo_base, id_usuario, fecha_contratacion, created_at) 
            VALUES (${s.rut}, ${s.nombre}, '+56911111111', ${s.cargo}, ${s.turno}, ${s.sueldo}, ${u.id}, ${getHistoricalDate(1, s.antiguedad)}, ${getHistoricalDate(1, s.antiguedad)})
        `;
        staffAttendancePool.push({ id_usuario: u.id, turno: s.turno });
    }

    // 2. PLANES
    const planesData = [
      { nombre: "Plan Mensual", precio: 35000, duracion: 1, desc: "Acceso total 1 mes." },
      { nombre: "Plan Trimestral", precio: 95000, duracion: 3, desc: "Ahorra un 10%." },
      { nombre: "Plan Semestral", precio: 180000, duracion: 6, desc: "Compromiso medio." },
      { nombre: "Plan Anual", precio: 320000, duracion: 12, desc: "Mejor valor anual." },
    ];
    const planesMap = {};
    for (const p of planesData) {
      const [planDB] = await sql`INSERT INTO planes (nombre, precio, duracion_meses, descripcion) VALUES (${p.nombre}, ${p.precio}, ${p.duracion}, ${p.desc}) RETURNING *`;
      planesMap[planDB.nombre] = planDB;
    }

    // 3. ENTRENADORES MEJORADOS
    console.log("💪 Contratando Entrenadores...");
    const coachesData = [
      { name: "Mike Mentzer", esp: "Hipertrofia", turno: "Mañana", modelo: "sueldo_fijo", sueldo: 800000, porcentaje: 0, arriendo: 0, antiguedad: 5 },
      { name: "Ronnie Coleman", esp: "Fuerza Bruta", turno: "Tarde", modelo: "sueldo_fijo", sueldo: 750000, porcentaje: 0, arriendo: 0, antiguedad: 4 },
      { name: "Chris Bumstead", esp: "Estética", turno: "Full Time", modelo: "porcentaje", sueldo: 0, porcentaje: 0.4, arriendo: 0, antiguedad: 3 },
      { name: "Nina Williams", esp: "Yoga & Flex", turno: "Mañana", modelo: "arriendo_espacio", sueldo: 0, porcentaje: 0, arriendo: 200000, antiguedad: 2 },
      { name: "Tom Platz", esp: "Pierna", turno: "Tarde", modelo: "sueldo_fijo", sueldo: 600000, porcentaje: 0, arriendo: 0, antiguedad: 6 },
    ];

    const trainerIds = [];
    for (const c of coachesData) {
      const nameLower = c.name.split(" ")[0].toLowerCase().replace(" ", "");
      const [u] = await sql`INSERT INTO usuarios (username, email, password, estado, id_rol) VALUES (${`coach_${nameLower}`}, ${`${nameLower}@gym.com`}, ${password}, 'active', ${getRol("entrenador")}) RETURNING id`;
      
      const [t] = await sql`
        INSERT INTO entrenadores (
            rut, nombre, especialidad, telefono, id_usuario, turno,
            modelo_contrato, sueldo_base, porcentaje_retencion, tarifa_arriendo, created_at
        ) VALUES (
            ${getRandomInt(10, 25) + "." + getRandomInt(100, 999) + "-K"}, 
            ${c.name}, ${c.esp}, '+56912345678', ${u.id}, ${c.turno},
            ${c.modelo}, ${c.sueldo}, ${c.porcentaje}, ${c.arriendo}, ${getHistoricalDate(1, c.antiguedad)}
        ) RETURNING id
      `;
      trainerIds.push(t.id);
      staffAttendancePool.push({ id_usuario: u.id, turno: c.turno });
    }

    // 4. CLIENTES MEJORADOS (Nombres reales + Datos Físicos Iniciales)
    console.log("👥 Registrando 120 Clientes...");
    const clientPool = [];
    const maleNames = ["Juan", "Pedro", "Diego", "Carlos", "Luis", "Jose", "Matias", "Nicolas", "Felipe", "Sebastian", "Andres", "Gabriel", "Tomas", "Martin"];
    const femaleNames = ["Maria", "Ana", "Sofia", "Camila", "Valentina", "Isabella", "Fernanda", "Javiera", "Catalina", "Martina", "Daniela", "Constanza"];
    const lastnames = ["Gonzalez", "Muñoz", "Rojas", "Diaz", "Perez", "Soto", "Contreras", "Silva", "Martinez", "Sepulveda", "Morales", "Rodriguez", "Lopez", "Fuentes", "Hernandez"];

    for (let i = 1; i <= 120; i++) {
      const isMale = Math.random() > 0.5;
      const firstName = getRandomItem(isMale ? maleNames : femaleNames);
      const lastName = getRandomItem(lastnames);
      const nombre = `${firstName} ${lastName}`;
      
      // Datos Físicos Base (Para evolución)
      const baseHeight = isMale ? getRandomFloat(1.65, 1.90, 2) : getRandomFloat(1.50, 1.75, 2);
      const baseWeight = isMale ? getRandomInt(70, 110) : getRandomInt(50, 80);
      const baseFat = isMale ? getRandomFloat(15, 30) : getRandomFloat(20, 35);
      
      const [u] = await sql`INSERT INTO usuarios (username, email, password, estado, id_rol) VALUES (${`u_${firstName.toLowerCase()}${i}`}, ${`user${i}@mail.com`}, ${password}, 'active', ${getRol("cliente")}) RETURNING id`;
      
      // Fecha registro aleatoria en los últimos 2 años
      const joinDate = getHistoricalDate(0, 2);

      const [c] = await sql`
        INSERT INTO clientes (rut, nombre, objetivo, fecha_nacimiento, genero, direccion, id_usuario, created_at) 
        VALUES (
            ${getRandomInt(10, 22) + "." + getRandomInt(100, 999) + "-" + getRandomInt(0, 9)}, 
            ${nombre}, 
            ${isMale ? 'Ganar Masa Muscular' : 'Tonificar'}, 
            ${getHistoricalDate(18, 40)}, -- Entre 18 y 40 años atrás
            ${isMale ? 'Masculino' : 'Femenino'}, 
            'Av. Siempre Viva 123', 
            ${u.id},
            ${joinDate}
        ) 
        RETURNING id
      `;

      clientPool.push({
        id_cliente: c.id,
        id_usuario: u.id,
        nombre: nombre,
        activeUntil: new Date(2024, 11, 31), // Se actualizará en simulación
        assignedTrainer: null,
        // Datos para simulación de progreso
        currentWeight: baseWeight,
        currentFat: baseFat,
        targetWeight: baseWeight * (isMale ? 1.05 : 0.9), // Hombres quieren subir, mujeres bajar (generalización seed)
        height: baseHeight
      });
    }

    // --- SIMULACIÓN TEMPORAL (2025 - HOY) ---
    console.log("⏳ Ejecutando simulación temporal (Asistencia, Pagos y Progreso Físico)...");
    
    const startDate = new Date(2025, 0, 1);
    const endDate = new Date();
    let currentDate = new Date(startDate);
    let totalAsistencias = 0;
    const planMensual = planesMap["Plan Mensual"];

    // Buffer para insertions masivos
    const measureBuffer = [];

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const dailyAttendanceBuffer = [];
      const entryDateBase = new Date(currentDate);

      // 1. ASISTENCIA STAFF
      if (!isWeekend) {
          for (let staff of staffAttendancePool) {
              if (Math.random() < 0.95 && staff.id_usuario) {
                  const { hour, minute } = getRandomTime(staff.turno);
                  const entryTime = new Date(entryDateBase);
                  entryTime.setHours(hour, minute, 0);
                  dailyAttendanceBuffer.push({ id_usuario: staff.id_usuario, estado_acceso: "aprobado", fecha_entrada: entryTime });
              }
          }
      }

      // 2. GESTIÓN CLIENTES
      for (let client of clientPool) {
        // A. Renovación (Simulada)
        if (client.activeUntil < currentDate) {
          if (Math.random() < 0.03) { // 3% chance diario de renovar si está vencido
            const fechaFin = new Date(currentDate);
            fechaFin.setMonth(fechaFin.getMonth() + 1);
            client.activeUntil = fechaFin;

            const [m] = await sql`INSERT INTO membresias (id_plan, fecha_inicio, fecha_fin, estado, id_cliente) VALUES (${planMensual.id}, ${currentDate}, ${fechaFin}, 'active', ${client.id_cliente}) RETURNING id`;
            await sql`INSERT INTO pagos (monto, metodo_pago, id_membresia, id_administrador, fecha_pago) VALUES (${planMensual.precio}, 'Tarjeta', ${m.id}, ${adminProfile.id}, ${currentDate})`;
            
            // Asignación Entrenador (Retención)
            if (!client.assignedTrainer && Math.random() > 0.5) {
                 const newTrainer = getRandomItem(trainerIds);
                 client.assignedTrainer = newTrainer;
                 await sql`UPDATE clientes SET id_entrenador = ${newTrainer} WHERE id = ${client.id_cliente}`;
            }
          }
        }

        // B. Asistencia & Progreso
        if (client.activeUntil >= currentDate) {
          let attendanceProb = isWeekend ? 0.2 : 0.5;
          
          if (Math.random() < attendanceProb && client.id_usuario) {
            // -- Asistencia --
            const { hour, minute } = getRandomTime('General');
            const entryTime = new Date(entryDateBase);
            entryTime.setHours(hour, minute, 0);
            dailyAttendanceBuffer.push({ id_usuario: client.id_usuario, estado_acceso: "aprobado", fecha_entrada: entryTime });
            totalAsistencias++;

            // -- Progreso Físico (Medición cada ~15 asistencias) --
            if (Math.random() < 0.07) {
                // Simular evolución: Se acerca a su meta
                const delta = (client.targetWeight - client.currentWeight) * 0.05; // 5% hacia la meta
                client.currentWeight += delta + getRandomFloat(-0.5, 0.5); // + Ruido
                client.currentFat -= 0.1; // Baja grasa lentamente

                measureBuffer.push({
                    peso: parseFloat(client.currentWeight.toFixed(1)),
                    altura: client.height,
                    porcentaje_grasa: parseFloat(client.currentFat.toFixed(1)),
                    fecha_registro: new Date(currentDate),
                    id_cliente: client.id_cliente
                });
            }
          }
        }
      }

      // Bulk Inserts Diarios
      if (dailyAttendanceBuffer.length > 0) {
        const cleanBuffer = dailyAttendanceBuffer.filter(a => a.id_usuario && a.fecha_entrada);
        if (cleanBuffer.length > 0) await sql`INSERT INTO asistencia ${sql(cleanBuffer, "id_usuario", "estado_acceso", "fecha_entrada")}`;
      }

      if (measureBuffer.length > 50) { // Batch medidas para no saturar memoria
          await sql`INSERT INTO medidas_fisicas ${sql(measureBuffer, "peso", "altura", "porcentaje_grasa", "fecha_registro", "id_cliente")}`;
          measureBuffer.length = 0;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Insertar medidas remanentes
    if (measureBuffer.length > 0) {
        await sql`INSERT INTO medidas_fisicas ${sql(measureBuffer, "peso", "altura", "porcentaje_grasa", "fecha_registro", "id_cliente")}`;
    }

    // 5. INVENTARIO MEJORADO (50+ Máquinas)
    console.log("🔧 Equipando Inventario Masivo...");
    const inventoryList = [
        { name: "Cinta de Correr", brand: "LifeFitness", type: "Cardio", count: 10 },
        { name: "Elíptica", brand: "Technogym", type: "Cardio", count: 8 },
        { name: "Bicicleta Estática", brand: "Schwinn", type: "Cardio", count: 8 },
        { name: "Press Banca", brand: "Hammer Strength", type: "Fuerza", count: 4 },
        { name: "Prensa de Piernas", brand: "Cybex", type: "Fuerza", count: 2 },
        { name: "Polea Alta", brand: "Technogym", type: "Fuerza", count: 3 },
        { name: "Smith Machine", brand: "Precor", type: "Fuerza", count: 2 },
        { name: "Rack de Mancuernas", brand: "Rogue", type: "Peso Libre", count: 3 },
        { name: "Banco Ajustable", brand: "Rogue", type: "Peso Libre", count: 6 },
        { name: "Remo Concept2", brand: "Concept2", type: "Cardio", count: 4 },
    ];

    const machinesBuffer = [];
    for (const item of inventoryList) {
        for (let i = 1; i <= item.count; i++) {
            const isBroken = Math.random() > 0.9; // 10% probabilidad fallo
            machinesBuffer.push({
                nombre: `${item.name} #${i}`,
                marca: item.brand,
                codigo_serie: `${item.brand.substring(0,2).toUpperCase()}-${Math.floor(Math.random()*10000)}`,
                estado: isBroken ? 'en_mantencion' : 'operativa',
                fecha_adquisicion: getHistoricalDate(1, 3),
                id_administrador: adminProfile.id
            });
        }
    }
    await sql`INSERT INTO maquinas ${sql(machinesBuffer, "nombre", "marca", "codigo_serie", "estado", "fecha_adquisicion", "id_administrador")}`;

    console.log("==========================================");
    console.log("✅ SIEMBRA COMPLETADA EXITOSAMENTE");
    console.log(`📊 Asistencias: ${totalAsistencias}`);
    console.log(`🔧 Máquinas: ${machinesBuffer.length}`);
    console.log(`📈 Medidas Físicas: Simuladas en el tiempo`);
    console.log("==========================================");
  } catch (error) {
    console.error("❌ Error fatal en el seed:", error);
  } finally {
    await sql.end();
  }
}

seed();