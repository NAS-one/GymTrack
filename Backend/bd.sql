-- =============================================================================
-- GYMTRACK DATABASE - SCHEMA ENTERPRISE (VERSIÓN FINAL)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. TIPOS DE DATOS PERSONALIZADOS (ENUMS)
-- Esto asegura la integridad del modelo de negocio de los entrenadores
DROP TYPE IF EXISTS tipo_contrato;
CREATE TYPE tipo_contrato AS ENUM ('sueldo_fijo', 'porcentaje', 'arriendo_espacio');

-- =============================================================================
-- FASE 1: NÚCLEO DE IDENTIDAD Y CONFIGURACIÓN GLOBAL
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
    ultima_actualizacion_password TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) DEFAULT 'active',
    codigo_2fa VARCHAR(6),
    expiracion_2fa TIMESTAMP,
    id_rol INT NOT NULL REFERENCES roles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CONFIGURACIÓN DE LA EMPRESA (SaaS)
CREATE TABLE configuracion_empresa (
    id SERIAL PRIMARY KEY, 
    razon_social VARCHAR(255) NOT NULL,
    nombre_fantasia VARCHAR(255) NOT NULL,
    rut_empresa VARCHAR(20) NOT NULL,
    giro_comercial VARCHAR(255),
    direccion_comercial TEXT,
    telefono_contacto VARCHAR(20),
    email_contacto VARCHAR(100),
    moneda_base VARCHAR(10) DEFAULT 'CLP',
    zona_horaria VARCHAR(50) DEFAULT 'America/Santiago',
    logo_url VARCHAR(500),
    datos_bancarios JSONB DEFAULT '{
      "banco": "",
      "tipo_cuenta": "Cuenta Corriente",
      "numero_cuenta": "",
      "correo_comprobantes": ""
    }'::jsonb,
    politicas_seguridad JSONB DEFAULT '{
      "forzar_cambio_password": true,
      "dias_caducidad": 90,
      "autenticacion_2fa": false
    }'::jsonb,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- FASE 2: STAFF Y OPERACIONES
-- =============================================================================

-- A. ADMINISTRADORES
CREATE TABLE administradores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    cargo VARCHAR(100) DEFAULT 'Gerente',
    telefono VARCHAR(20), 
    preferencias_alertas JSONB DEFAULT '{
      "cierre_caja": { "activo": true, "canal": "push", "umbral": 0 },
      "inventario_critico": { "activo": true, "canal": "push" },
      "riesgo_fuga": { "activo": false, "dias_ausencia": 7 },
      "acceso_fuera_horario": { "activo": true, "canal": "email" }
    }'::jsonb, -- Preferencias Inteligentes
    foto_perfil VARCHAR(500), 
    id_usuario UUID UNIQUE NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- B. COLABORADORES (Recepción, Aseo, Mantenimiento)
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
    foto_perfil VARCHAR(500),
    id_usuario UUID UNIQUE REFERENCES usuarios(id) ON DELETE SET NULL, 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- C. ENTRENADORES (MODELO DE NEGOCIO)
CREATE TABLE entrenadores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rut VARCHAR(20) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    especialidad VARCHAR(100),
    telefono VARCHAR(20),
    turno VARCHAR(50) DEFAULT 'Mañana', 
    modelo_contrato tipo_contrato NOT NULL DEFAULT 'sueldo_fijo',
    sueldo_base INTEGER DEFAULT 0,                  
    porcentaje_retencion DECIMAL(5,2) DEFAULT 0.00, 
    tarifa_arriendo INTEGER DEFAULT 0,              
    foto_perfil VARCHAR(500),
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
    foto_perfil VARCHAR(500),
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
-- FASE 4: ENTRENAMIENTO Y SESIONES
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
    id_cliente UUID  DROP NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    id_entrenador UUID NOT NULL REFERENCES entrenadores(id) ON DELETE CASCADE,
    es_plantilla BOOLEAN DEFAULT false,
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

CREATE TABLE sesiones_entrenador (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_entrenador UUID REFERENCES entrenadores(id),
    id_cliente UUID REFERENCES clientes(id),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duracion_minutos INT DEFAULT 60,
    valor_cobrado INTEGER NOT NULL,
    monto_gimnasio INTEGER NOT NULL,   
    monto_entrenador INTEGER NOT NULL, 
    estado VARCHAR(20) DEFAULT 'realizada' 
);

-- =============================================================================
-- FASE 5: SEGUIMIENTO, OPERACIONES, NOTIFICACIONES Y AUDITORÍA
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
    token_qr TEXT, 
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

-- SISTEMA DE NOTIFICACIONES UNIFICADO
CREATE TABLE notificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo VARCHAR(150) NOT NULL,
    mensaje TEXT NOT NULL,
    tipo VARCHAR(20) NOT NULL, -- 'success', 'warning', 'info', 'error'
    leida BOOLEAN DEFAULT FALSE,
    id_usuario UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLA DE AUDITORÍA DE SESIONES
CREATE TABLE auditoria_sesiones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    ip_address VARCHAR(45),
    dispositivo VARCHAR(255),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20), -- 'success', 'failed'
    dispositivo_confiable BOOLEAN DEFAULT FALSE
);

-- =============================================================================
-- DATOS INICIALES OBLIGATORIOS
-- =============================================================================

-- INSERT BASE: Roles
INSERT INTO roles (nombre) VALUES 
    ('administrador'), 
    ('entrenador'), 
    ('cliente'),
    ('recepcionista'), 
    ('mantenimiento');

-- INSERT BASE: CONFIGURACIÓN DE LA EMPRESA
INSERT INTO configuracion_empresa (razon_social, nombre_fantasia, rut_empresa, giro_comercial, email_contacto)
VALUES (
    'Inversiones GymTrack SpA', 
    'GymTrack Fitness', 
    '76.123.456-7', 
    'Actividades de gimnasios y centros de fitness', 
    'contacto@gymtrack.cl'
);