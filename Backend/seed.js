import postgres from "postgres";
import bcrypt from "bcrypt";
import "dotenv/config";

const sql = postgres({
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

// --- UTILIDADES MEJORADAS ---
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomFloat = (min, max, decimals = 1) => parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
const getRandomItem = (arr) => arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;

// Generador de RUT Chileno Realista
const generateRUT = () => {
    const num = getRandomInt(10000000, 26000000).toString();
    const dv = Math.random() > 0.9 ? 'K' : getRandomInt(0, 9).toString();
    return `${num.slice(0,2)}.${num.slice(2,5)}.${num.slice(5,8)}-${dv}`;
};

// Generador de horas ponderado por Jornada del Cliente
const getRandomTime = (shift = 'General') => {
  let hour;
  if (shift === 'Mañana') hour = getRandomInt(6, 12);
  else if (shift === 'Tarde') hour = getRandomInt(13, 17);
  else if (shift === 'Noche') hour = getRandomInt(18, 22);
  else hour = getRandomInt(6, 22); // Fallback
  return { hour, minute: getRandomInt(0, 59) };
};

// Generador de fecha pasada para antigüedad
const getHistoricalDate = (minYears, maxYears) => {
    const date = new Date();
    const years = getRandomInt(minYears, maxYears);
    date.setFullYear(date.getFullYear() - years);
    date.setMonth(getRandomInt(0, 11));
    date.setDate(getRandomInt(1, 28));
    return date;
};

// Métodos de pago disponibles
const PAYMENT_METHODS = ['Tarjeta', 'Efectivo', 'Transferencia', 'Webpay'];

async function seed() {
  console.log("🌱 Iniciando Siembra ENTERPRISE 3.0 (Datos Realistas, Finanzas y Stats)...");

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
    const [uAdmin] = await sql`INSERT INTO usuarios (username, email, password, estado, id_rol) VALUES ('admin', 'victoralexis.gonzalez@alumnos.ulagos.cl', ${password}, 'active', ${getRol("administrador")}) RETURNING id`;
    const [adminProfile] = await sql`INSERT INTO administradores (nombre, cargo, id_usuario) VALUES ('Admin Principal', 'Gerente General', ${uAdmin.id}) RETURNING id`;

    const staffAttendancePool = []; 

    // 1.2 STAFF OPERATIVO
    console.log("🧹 Contratando Staff...");
    const staffData = [
        { nombre: "Maria Recepcionista", rut: generateRUT(), cargo: "Recepcionista", turno: "Mañana", sueldo: 500000, antiguedad: 3 },
        { nombre: "Pedro Recepcionista", rut: generateRUT(), cargo: "Recepcionista", turno: "Tarde", sueldo: 480000, antiguedad: 1 },
        { nombre: "Juan Limpieza", rut: generateRUT(), cargo: "Aseo", turno: "Tarde", sueldo: 450000, antiguedad: 2 },
        { nombre: "Luisa Limpieza", rut: generateRUT(), cargo: "Aseo", turno: "Mañana", sueldo: 450000, antiguedad: 4 },
        { nombre: "Carlos Técnico", rut: generateRUT(), cargo: "Mantenimiento", turno: "Full Time", sueldo: 650000, antiguedad: 5 },
    ];

    for (const s of staffData) {
        const username = s.nombre.split(" ")[0].toLowerCase() + "_" + s.cargo.substring(0,3).toLowerCase();
        let roleId = getRol(s.cargo.toLowerCase());
        if (!roleId) roleId = getRol('recepcionista');

        const [u] = await sql`INSERT INTO usuarios (username, email, password, estado, id_rol) VALUES (${username}, ${`${username}@gym.com`}, ${password}, 'active', ${roleId}) RETURNING id`;
        
        await sql`
            INSERT INTO colaboradores (rut, nombre, telefono, cargo, turno, sueldo_base, id_usuario, fecha_contratacion, created_at) 
            VALUES (${s.rut}, ${s.nombre}, '+56911111111', ${s.cargo}, ${s.turno}, ${s.sueldo}, ${u.id}, ${getHistoricalDate(1, s.antiguedad)}, ${getHistoricalDate(1, s.antiguedad)})
        `;
        staffAttendancePool.push({ id_usuario: u.id, turno: s.turno });
    }

    // 2. PLANES (Ahora se usan todos)
    const planesData = [
      { nombre: "Plan Mensual", precio: 35000, duracion: 1, desc: "Acceso total 1 mes." },
      { nombre: "Plan Trimestral", precio: 95000, duracion: 3, desc: "Ahorra un 10%." },
      { nombre: "Plan Semestral", precio: 180000, duracion: 6, desc: "Compromiso medio." },
      { nombre: "Plan Anual", precio: 320000, duracion: 12, desc: "Mejor valor anual." },
    ];
    const planesListDB = [];
    for (const p of planesData) {
      const [planDB] = await sql`INSERT INTO planes (nombre, precio, duracion_meses, descripcion) VALUES (${p.nombre}, ${p.precio}, ${p.duracion}, ${p.desc}) RETURNING *`;
      planesListDB.push(planDB);
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
            ${generateRUT()}, 
            ${c.name}, ${c.esp}, '+56912345678', ${u.id}, ${c.turno},
            ${c.modelo}, ${c.sueldo}, ${c.porcentaje}, ${c.arriendo}, ${getHistoricalDate(1, c.antiguedad)}
        ) RETURNING id
      `;
      trainerIds.push(t.id);
      staffAttendancePool.push({ id_usuario: u.id, turno: c.turno });
    }

    // 4. CLIENTES CON HÁBITOS REALISTAS
    console.log("👥 Registrando 150 Clientes VIP...");
    const clientPool = [];
    const maleNames = ["Juan", "Pedro", "Diego", "Carlos", "Luis", "Jose", "Matias", "Nicolas", "Felipe", "Sebastian", "Andres", "Gabriel", "Tomas", "Martin", "Joaquin"];
    const femaleNames = ["Maria", "Ana", "Sofia", "Camila", "Valentina", "Isabella", "Fernanda", "Javiera", "Catalina", "Martina", "Daniela", "Constanza", "Antonia"];
    const lastnames = ["Gonzalez", "Muñoz", "Rojas", "Diaz", "Perez", "Soto", "Contreras", "Silva", "Martinez", "Sepulveda", "Morales", "Rodriguez", "Lopez", "Fuentes", "Hernandez", "Vidal", "Guzman"];
    const direcciones = ["Av. Providencia 123", "Las Condes 444", "Santiago Centro", "Maipú 90", "Ñuñoa 500", "La Florida 100", "Vitacura 300"];

    for (let i = 1; i <= 150; i++) {
      const isMale = Math.random() > 0.5;
      const firstName = getRandomItem(isMale ? maleNames : femaleNames);
      const lastName = getRandomItem(lastnames);
      const nombre = `${firstName} ${lastName}`;
      
      const baseHeight = isMale ? getRandomFloat(1.65, 1.90, 2) : getRandomFloat(1.50, 1.75, 2);
      const baseWeight = isMale ? getRandomInt(70, 110) : getRandomInt(50, 80);
      const baseFat = isMale ? getRandomFloat(15, 30) : getRandomFloat(20, 35);
      
      const [u] = await sql`INSERT INTO usuarios (username, email, password, estado, id_rol) VALUES (${`u_${firstName.toLowerCase()}${i}`}, ${`user${i}@mail.com`}, ${password}, 'active', ${getRol("cliente")}) RETURNING id`;
      
      const joinDate = getHistoricalDate(0, 2);
      const assignedTrainer = Math.random() > 0.4 ? getRandomItem(trainerIds) : null; // 60% tiene entrenador desde el inicio

      const [c] = await sql`
        INSERT INTO clientes (rut, nombre, objetivo, fecha_nacimiento, genero, direccion, id_usuario, id_entrenador, created_at) 
        VALUES (
            ${generateRUT()}, 
            ${nombre}, 
            ${isMale ? 'Ganar Masa Muscular' : 'Tonificar'}, 
            ${getHistoricalDate(18, 50)}, 
            ${isMale ? 'Masculino' : 'Femenino'}, 
            ${getRandomItem(direcciones)}, 
            ${u.id},
            ${assignedTrainer},
            ${joinDate}
        ) 
        RETURNING id
      `;

      // Hábito del cliente (Atributos ocultos para la simulación)
      const shifts = ['Mañana', 'Tarde', 'Noche'];
      const habitShift = getRandomItem(shifts);
      const attendanceProb = getRandomFloat(0.2, 0.8); // Algunos van 2 veces por semana, otros 6.

      clientPool.push({
        id_cliente: c.id,
        id_usuario: u.id,
        nombre: nombre,
        activeUntil: new Date(2024, 11, 31), // Vencimiento inicial para forzar renovación
        assignedTrainer: assignedTrainer,
        habitShift: habitShift,
        attendanceProb: attendanceProb,
        currentWeight: baseWeight,
        currentFat: baseFat,
        targetWeight: baseWeight * (isMale ? 1.05 : 0.9), 
        height: baseHeight
      });
    }

    // --- SIMULACIÓN TEMPORAL (2025 - HOY) ---
    console.log("⏳ Ejecutando simulación temporal (Planes variados, Pagos Múltiples y Asistencia)...");
    
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
        // A. Renovación Dinámica (Uso de todos los planes y métodos de pago)
        if (client.activeUntil < currentDate) {
          if (Math.random() < 0.05) { // 5% chance diario de renovar si está vencido
            const planElegido = getRandomItem(planesListDB); // Ahora eligen cualquier plan (Mensual, Trimestral, etc.)
            const metodoPagoElegido = getRandomItem(PAYMENT_METHODS); // Variedad de pagos
            
            const fechaFin = new Date(currentDate);
            fechaFin.setMonth(fechaFin.getMonth() + planElegido.duracion_meses);
            client.activeUntil = fechaFin;

            const [m] = await sql`INSERT INTO membresias (id_plan, fecha_inicio, fecha_fin, estado, id_cliente) VALUES (${planElegido.id}, ${currentDate}, ${fechaFin}, 'active', ${client.id_cliente}) RETURNING id`;
            await sql`INSERT INTO pagos (monto, metodo_pago, id_membresia, id_administrador, fecha_pago) VALUES (${planElegido.precio}, ${metodoPagoElegido}, ${m.id}, ${adminProfile.id}, ${currentDate})`;
          }
        }

        // B. Asistencia Realista Basada en Hábitos
        if (client.activeUntil >= currentDate) {
          // El cliente va a su jornada preferida con su probabilidad personalizada (Si es finde, va menos)
          let prob = isWeekend ? (client.attendanceProb * 0.3) : client.attendanceProb;
          
          if (Math.random() < prob && client.id_usuario) {
            const { hour, minute } = getRandomTime(client.habitShift);
            const entryTime = new Date(entryDateBase);
            entryTime.setHours(hour, minute, 0);
            dailyAttendanceBuffer.push({ id_usuario: client.id_usuario, estado_acceso: "aprobado", fecha_entrada: entryTime });
            totalAsistencias++;

            // Progreso Físico Lento y Constante
            if (Math.random() < 0.05) {
                const delta = (client.targetWeight - client.currentWeight) * 0.05;
                client.currentWeight += delta + getRandomFloat(-0.3, 0.3);
                client.currentFat -= 0.1;

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

      // Inserción en Bloque de Asistencia
      if (dailyAttendanceBuffer.length > 0) {
        const cleanBuffer = dailyAttendanceBuffer.filter(a => a.id_usuario && a.fecha_entrada);
        if (cleanBuffer.length > 0) await sql`INSERT INTO asistencia ${sql(cleanBuffer, "id_usuario", "estado_acceso", "fecha_entrada")}`;
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

    // 5. INVENTARIO (Equipos en Mantención y Activos)
    console.log("🔧 Equipando Inventario Masivo...");
    const inventoryList = [
        { name: "Cinta de Correr Pro", brand: "LifeFitness", type: "Cardio", count: 8 },
        { name: "Elíptica Avanzada", brand: "Technogym", type: "Cardio", count: 6 },
        { name: "Bicicleta Estática", brand: "Schwinn", type: "Cardio", count: 10 },
        { name: "Press Banca Olímpico", brand: "Hammer Strength", type: "Fuerza", count: 4 },
        { name: "Prensa de Piernas 45°", brand: "Cybex", type: "Fuerza", count: 3 },
        { name: "Polea Cruzada", brand: "Technogym", type: "Fuerza", count: 2 },
        { name: "Smith Machine", brand: "Precor", type: "Fuerza", count: 2 },
        { name: "Set Mancuernas 5-50kg", brand: "Rogue", type: "Peso Libre", count: 2 },
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
                codigo_serie: `${item.brand.substring(0,2).toUpperCase()}-${Math.floor(Math.random()*10000)}`,
                estado: isBroken ? 'en_mantencion' : 'operativa',
                fecha_adquisicion: getHistoricalDate(1, 4),
                id_administrador: adminProfile.id
            });
        }
    }
    await sql`INSERT INTO maquinas ${sql(machinesBuffer, "nombre", "marca", "codigo_serie", "estado", "fecha_adquisicion", "id_administrador")}`;

    // 6. BIBLIOTECA DE EJERCICIOS
    console.log("🏋️ Creando Biblioteca de Ejercicios...");
    const ejerciciosDb = [
        { nombre: "Press de Banca Plano", grupo_muscular: "Pecho", descripcion: "Ejercicio compuesto para desarrollar fuerza en el pectoral mayor." },
        { nombre: "Sentadilla Libre", grupo_muscular: "Piernas", descripcion: "Rey de los ejercicios de piernas, enfocado en cuádriceps y glúteos." },
        { Dominadas: "Dominadas Supinas", grupo_muscular: "Espalda", descripcion: "Ejercicio de tracción vertical para dorsales y bíceps." },
        { nombre: "Peso Muerto Convencional", grupo_muscular: "Espalda", descripcion: "Ejercicio fundamental para la cadena posterior completa." },
        { nombre: "Press Militar con Barra", grupo_muscular: "Hombros", descripcion: "Empuje vertical para el desarrollo de los deltoides." },
        { nombre: "Curl de Bíceps con Barra", grupo_muscular: "Brazos", descripcion: "Aislamiento clásico para el desarrollo del bíceps." },
        { nombre: "Extensión de Tríceps en Polea", grupo_muscular: "Brazos", descripcion: "Aislamiento para las tres cabezas del tríceps." },
        { nombre: "Prensa de Piernas", grupo_muscular: "Piernas", descripcion: "Máquina de empuje para hipertrofia del tren inferior." },
        { nombre: "Remo con Barra", grupo_muscular: "Espalda", descripcion: "Tracción horizontal pesada para grosor de la espalda." },
        { nombre: "Hip Thrust", grupo_muscular: "Piernas", descripcion: "Ejercicio por excelencia para el aislamiento de glúteos." },
        { nombre: "Elevaciones Laterales", grupo_muscular: "Hombros", descripcion: "Aislamiento para el deltoides lateral." },
        { nombre: "Crunch Abdominal", grupo_muscular: "Core", descripcion: "Contracción clásica para el recto abdominal." }
    ].map(e => ({ nombre: e.nombre || 'Dominadas', grupo_muscular: e.grupo_muscular, descripcion: e.descripcion })); // Normalización rápida
    
    await sql`INSERT INTO ejercicios ${sql(ejerciciosDb, "nombre", "grupo_muscular", "descripcion")}`;

    // 7. HISTORIAL DE REPORTES (Auditoría Administrativa)
    console.log("📈 Generando Historial de Reportes...");
    const reportesBuffer = [];
    for(let r=0; r<40; r++) {
        const tiposReporte = ['financiero', 'operativo', 'inventario', 'asistencia'];
        const tipoD = getRandomItem(tiposReporte);
        const fechaGeneracion = getHistoricalDate(0, 1);
        
        reportesBuffer.push({
            titulo: `Auditoría ${tipoD.charAt(0).toUpperCase() + tipoD.slice(1)} - ${fechaGeneracion.toLocaleString('es-CL', { month: 'long', year: 'numeric' })}`,
            tipo: tipoD,
            contenido: sql.json({ 
                analisis: "Generado automáticamente por el sistema de auditoría mensual.", 
                metricas_clave: { transacciones_revisadas: getRandomInt(100, 500), margen_error: "0.2%" },
                estado: "Aprobado"
            }),
            id_administrador: adminProfile.id,
            fecha_generacion: fechaGeneracion
        });
    }
    await sql`INSERT INTO reportes ${sql(reportesBuffer, "titulo", "tipo", "contenido", "id_administrador", "fecha_generacion")}`;

    console.log("==========================================");
    console.log("✅ SIEMBRA COMPLETADA EXITOSAMENTE");
    console.log(`📊 Clientes VIP: 150 (con hábitos asignados)`);
    console.log(`💳 Asistencias Orgánicas Simuladas: ${totalAsistencias}`);
    console.log(`🏋️ Ejercicios en Biblioteca: ${ejerciciosDb.length}`);
    console.log(`📈 Reportes Históricos Generados: ${reportesBuffer.length}`);
    console.log("==========================================");
  } catch (error) {
    console.error("❌ Error fatal en el seed:", error);
  } finally {
    await sql.end();
  }
}

seed();