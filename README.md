# 📌 Proyecto Full Stack

Aplicación web desarrollada con **Node.js + Express (backend)** y **React + Vite (frontend)**.  
Incluye autenticación, manejo de sesiones, validaciones y consumo de API.

---

##  Tecnologías utilizadas

###  Backend
- Node.js
- Express
- PostgreSQL
- JWT (autenticación)
- Zod (validaciones)
- bcrypt (hash de contraseñas)
- dotenv (variables de entorno)
- morgan (logs)
- cors

###  Frontend
- React + Vite
- Axios (peticiones HTTP)
- Lucide React / React Icons (iconos)
- Recharts (gráficos)
- Sonner (notificaciones)

---

## 🐳  Forma 1 (Recomendada): Instalación del Proyecto con Docker.

Esta guía te permitirá levantar el proyecto completo de forma local utilizando Docker, incluyendo frontend, backend y base de datos.

---

### Notas Adicionales
- Asegúrate de tener **Docker** y **Docker Compose** instalados en tu sistema.
- Si es la primera vez que ejecutas el proyecto, utiliza siempre **--build** para asegurar la correcta construcción de las imágenes.
- Puedes acceder al frontend desde: **http://localhost:5173**
- El backend estará disponible en: **http://localhost:3000**


##  Servicios Incluidos

El entorno se compone de los siguientes servicios:

| Servicio     | Puerto (Host → Contenedor) |
|--------------|----------------------------|
| Frontend     | 5173 → 80                  |
| Backend      | 3000 → 3000                |
| PostgreSQL   | 5432 → 5432                |

---

##  Levantar el Proyecto

> Para construir y ejecutar todos los servicios en segundo plano:

```bash
docker-compose up -d --build
```

## Ejecutar Datos Iniciales (Seed)

> Una vez que el backend esté en ejecución, puedes cargar datos de prueba con:

```bash
docker exec -it gymtrack-backend-1 npm run seed
```

## Ver Logs del Backend

> Para revisar posibles errores o el estado del backend:

```bash
docker logs gymtrack-backend-1
```


## Reconstruir un Servicio Específico

> Si realizas cambios y necesitas reconstruir un servicio, como:

- Backend
- Frontend
- Base de Datos

```bash
docker-compose up -d --build backend
```

## Detener la Aplicación

> Para detener y eliminar los contenedores:

```bash
docker-compose down
```

> Para detener y eliminar los contenedores y la base de datos:

```bash
docker-compose down -v
```




## Forma 2: Instalación Manual (Sin Docker)

###  Backend

1. Inicializar proyecto:
```bash
npm init -y

```

Antes de ejecutar el proyecto, asegúrate de tener instalado:

- Node.js (incluye npm)
- PostgreSQL

Verificar instalación:
```bash
node -v
npm -v
```

2. Instalar dependencias:

```bash
npm install express zod postgres cors bcrypt jsonwebtoken cookie-parser dotenv morgan
```

3. Instalar dependencias de desarrollo:

```bash
npm install nodemon -D
```

4. Permisos de Ejecucion

```bash
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force
```


### Frontend

1. Crear proyecto con Vite:

```bash
npm create vite@latest frontend
```

2. Instalar dependencias:

```bash
npm install axios lucide-react react-icons recharts sonner
```

3. Instalar dependencias de desarrollo:

```bash
npm install -D vite
```

4. Permisos de Ejecucion

```bash
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force
```

### Funcionalidades principales
> Autenticación con JWT
> Encriptación de contraseñas
> Manejo de sesiones con cookies
> Validaciones de datos con Zod
> Comunicación cliente-servidor con Axios
> Notificaciones en tiempo real
> Visualización de datos (gráficos)


##  Ejecucion del Proyecto

```bash
npm run dev
```

### Nota:
> Configurar archivo .env para la conexión a PostgreSQL.
