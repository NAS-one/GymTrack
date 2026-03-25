-- =============================================================================
-- GYMTRACK DATABASE - SCHEMA ENTERPRISE
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. TIPOS DE DATOS PERSONALIZADOS (ENUMS)
-- Esto asegura la integridad del modelo de negocio de los entrenadores
DROP TYPE IF EXISTS tipo_contrato;
CREATE TYPE tipo_contrato AS ENUM ('sueldo_fijo', 'porcentaje', 'arriendo_espacio');

-- =============================================================================
-- FASE 1: NÚCLEO DE IDENTIDAD
-- =============================================================================

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    estado VARCHAR(20) DEFAULT 'active',
    id_rol INT NOT NULL REFERENCES roles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- FASE 2: STAFF Y OPERACIONES (MEJORADO)
-- =============================================================================

-- A. ADMINISTRADORES (Se mantiene igual para no romper lógica existente de pagos/maquinas)
CREATE TABLE administradores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    cargo VARCHAR(100) DEFAULT 'Gerente',
    id_usuario UUID UNIQUE NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- B. COLABORADORES (NUEVA TABLA: Recepción, Aseo, Mantenimiento)
CREATE TABLE colaboradores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rut VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    direccion VARCHAR(255),
    cargo VARCHAR(50) NOT NULL, -- 'Recepcionista', 'Aseo', 'Tecnico'
    turno VARCHAR(50) DEFAULT 'Full Time',
    sueldo_base INTEGER NOT NULL,
    fecha_contratacion DATE DEFAULT CURRENT_DATE,
    id_usuario UUID UNIQUE REFERENCES usuarios(id) ON DELETE SET NULL, -- Relación Opcional: El personal de aseo no necesita login, Recepción sí
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- C. ENTRENADORES (MEJORADO CON MODELO DE NEGOCIO)
CREATE TABLE entrenadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rut VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    especialidad VARCHAR(100),
    telefono VARCHAR(20),
    turno VARCHAR(50) DEFAULT 'Mañana', 
    -- Lógica de Negocio Híbrida
    modelo_contrato tipo_contrato NOT NULL DEFAULT 'sueldo_fijo',
    sueldo_base INTEGER DEFAULT 0,                  -- Para modelo 'sueldo_fijo'
    porcentaje_retencion DECIMAL(5,2) DEFAULT 0.00, -- Para modelo 'porcentaje' (ej: 0.30)
    tarifa_arriendo INTEGER DEFAULT 0,              -- Para modelo 'arriendo_espacio' 
    id_usuario UUID UNIQUE NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- FASE 3: CLIENTES Y MEMBRESÍAS
-- =============================================================================

CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rut VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    fecha_nacimiento DATE,
    genero VARCHAR(20),
    direccion TEXT,
    objetivo TEXT,
    id_usuario UUID UNIQUE NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    id_entrenador UUID REFERENCES entrenadores(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE planes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    precio INTEGER NOT NULL,
    duracion_meses INTEGER NOT NULL,
    descripcion TEXT,
    estado VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE membresias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_fin DATE NOT NULL,
    estado VARCHAR(20) DEFAULT 'active',
    id_plan UUID REFERENCES planes(id) ON DELETE SET NULL,
    id_cliente UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE
);

CREATE TABLE pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monto INTEGER NOT NULL,
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metodo_pago VARCHAR(50),
    id_administrador UUID REFERENCES administradores(id) ON DELETE SET NULL,
    id_membresia UUID NOT NULL REFERENCES membresias(id) ON DELETE CASCADE
);

-- =============================================================================
-- FASE 4: ENTRENAMIENTO Y SESIONES (MEJORADO)
-- =============================================================================

CREATE TABLE ejercicios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) UNIQUE NOT NULL,
    grupo_muscular VARCHAR(50) NOT NULL,
    url_video TEXT,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rutinas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    fecha_inicio DATE DEFAULT CURRENT_DATE,
    fecha_fin DATE,
    activa BOOLEAN DEFAULT true,
    id_cliente UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    id_entrenador UUID NOT NULL REFERENCES entrenadores(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE detalle_rutina (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dia VARCHAR(20) NOT NULL,
    series INT NOT NULL,
    repeticiones VARCHAR(20) NOT NULL,
    carga_proyectada VARCHAR(50),
    id_rutina UUID NOT NULL REFERENCES rutinas(id) ON DELETE CASCADE,
    id_ejercicio UUID NOT NULL REFERENCES ejercicios(id) ON DELETE RESTRICT
);

-- CONTROL DE SESIONES PARA COMISIONES
CREATE TABLE sesiones_entrenador (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_entrenador UUID REFERENCES entrenadores(id),
    id_cliente UUID REFERENCES clientes(id),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duracion_minutos INT DEFAULT 60,
    -- Desglose Financiero
    valor_cobrado INTEGER NOT NULL,
    monto_gimnasio INTEGER NOT NULL,   -- Lo que se queda el gym
    monto_entrenador INTEGER NOT NULL, -- Lo que gana el entrenador
    
    estado VARCHAR(20) DEFAULT 'realizada' -- 'agendada', 'realizada', 'cancelada'
);

-- =============================================================================
-- FASE 5: SEGUIMIENTO Y OPERACIONES
-- =============================================================================

CREATE TABLE medidas_fisicas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    peso DECIMAL(5, 2),
    altura DECIMAL(3, 2),
    porcentaje_grasa DECIMAL(4, 1),
    circunferencia_cintura DECIMAL(5, 2),
    fecha_registro DATE DEFAULT CURRENT_DATE,
    id_cliente UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE
);

CREATE TABLE asistencia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha_entrada TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado_acceso VARCHAR(20) NOT NULL,
    token_qr TEXT, -- Se mantiene por compatibilidad, aunque usemos RUT directo
    fecha_expiracion_qr TIMESTAMP,
    id_usuario UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE registro_progreso (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    series_reales INT,
    reps_reales INT,
    carga_real VARCHAR(50),
    rpe INT,
    comentarios TEXT,
    id_cliente UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    id_ejercicio UUID NOT NULL REFERENCES ejercicios(id) ON DELETE CASCADE,
    id_rutina UUID REFERENCES rutinas(id) ON DELETE SET NULL
);

CREATE TABLE maquinas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    marca VARCHAR(50),
    codigo_serie VARCHAR(50) UNIQUE,
    fecha_adquisicion DATE,
    estado VARCHAR(20) DEFAULT 'operativa',
    id_administrador UUID REFERENCES administradores(id) ON DELETE SET NULL
);

CREATE TABLE reportes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(100) NOT NULL,
    tipo VARCHAR(50),
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    contenido JSONB NOT NULL,
    id_administrador UUID NOT NULL REFERENCES administradores(id) ON DELETE CASCADE
);

-- =============================================================================
-- DATOS INICIALES OBLIGATORIOS
-- =============================================================================

-- Roles base
INSERT INTO roles (nombre) VALUES 
    ('administrador'), 
    ('entrenador'), 
    ('cliente'),
    ('recepcionista'), 
    ('mantenimiento');