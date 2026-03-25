# 📌 Proyecto Full Stack (Backend + Frontend)

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

##  Instalación del Proyecto

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
