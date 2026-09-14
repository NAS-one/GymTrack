# GymTrack — Task Tracker

## FASE 1 — Bugs Críticos ✅
- [x] 1.1 Fix: Entrenador "Alumnos sin rutina" redirige al login
- [x] 1.2 Fix: Queries de planes con números inconsistentes (plan.js)
- [x] 1.3 Fix: Dashboard admin queries (dashboard.js) — coherencia de datos
- [x] 1.4 Fix: Frontend admin Planes.jsx mostrar activos/vencidos correctos
- [x] 1.5 Fix: Dashboard TrendsChart — gráfico de planes coherente

## FASE 2 — Panel Entrenador
- [ ] 2.1 Eliminar campana y settings del header EntrenadorLayout
- [ ] 2.2 Crear página PerfilEntrenador.jsx funcional
- [ ] 2.3 Agregar ruta /entrenador/perfil en App.jsx
- [ ] 2.4 Conectar botón "Ajustes de Perfil" al navigate

## FASE 3 — Panel Cliente
- [ ] 3.1 Eliminar campana del header ClientLayout
- [ ] 3.2 Bloquear edición de entrenador en Perfil.jsx
- [ ] 3.3 Crear flujo de pago/renovación PagoRenovacion.jsx
- [ ] 3.4 Backend endpoint para procesar pago simulado
- [ ] 3.5 Descarga de rutina en PDF con marca de agua
- [ ] 3.6 Ocultar descarga PDF si tiene entrenador (rutina privada)

## FASE 4 — Nuevas Funcionalidades
- [ ] 4.1 Migración SQL: tabla testimonios + campos staff + tabla vacaciones
- [ ] 4.2 Backend: CRUD testimonios + endpoint público
- [ ] 4.3 Frontend: Formulario testimonio en perfil cliente
- [ ] 4.4 Frontend: Carrusel testimonios en Login/Register
- [ ] 4.5 Frontend: Panel admin moderación testimonios
- [ ] 4.6 Panel Staff completo (layout + dashboard + info + documentos + asistencia)
- [ ] 4.7 Backend: Endpoints staff personal (/staff/me, documents, attendance)
- [ ] 4.8 ProtectedRoute + Login redirección para roles staff
- [ ] 4.9 Sistema de vacaciones (solicitud + aprobación admin)
- [ ] 4.10 Panel admin: sección vacaciones pendientes

## FASE 5 — Fotos de Perfil + Pulido
- [ ] 5.1 Backend: multer + endpoint /upload/profile
- [ ] 5.2 Backend: servir archivos estáticos /uploads
- [ ] 5.3 Frontend: componente de subida de foto reutilizable
- [ ] 5.4 Integrar foto en perfil cliente, entrenador, staff
- [ ] 5.5 Logo personalizable desde configuracion_empresa
