# ASPROJUMA · Roadmap del proyecto

> Plataforma web de gestión para la Asociación de Profesores Jubilados de la Universidad de Málaga
> Stack: Next.js 14 · React · Tailwind CSS · Supabase · Vercel

---

## FASE 1 — Fundamentos ✅ COMPLETADA
**Completada:** 2026-03-27

### Infraestructura y base de datos
- [x] Generar script SQL de migración desde Excel (`migrar_asprojuma.py`)
- [x] Generar `asprojuma_datos.sql` con 113 socios y 54 cooperantes
- [x] Ejecutar `asprojuma_datos.sql` en Supabase SQL Editor
- [x] Verificar datos migrados

### Proyecto Next.js
- [x] Crear proyecto Next.js 14 con TypeScript + Tailwind CSS
- [x] Instalar dependencias Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- [x] Crear clientes Supabase client-side y server-side
- [x] Crear tipos TypeScript (`Socio`, `Cuota`, `Carnet`)
- [x] Crear middleware de protección de rutas (`/socio`, `/admin`)
- [x] Crear `.env.local` con variables de entorno reales

### Páginas públicas
- [x] Página de inicio pública (`/`) con estadísticas en tiempo real
- [ ] Página "Quiénes somos" con información de la asociación
- [ ] Página de contacto

### Autenticación
- [x] Página de login (`/login`) con enlace a recuperación
- [x] Configurar Supabase Auth (email + contraseña)
- [x] Página de recuperación de contraseña (`/recuperar-contrasena`)
- [x] Página de nueva contraseña (`/nueva-contrasena`)
- [x] Flujo de primer acceso por invitación (`/api/admin/invitar`)
- [x] Route de callback de autenticación (`/auth/callback`)

### Formulario de alta online
- [x] Formulario de solicitud de Socio Profesor (`/solicitud-alta/profesor`)
  - [x] Datos personales (nombre, DNI, fecha nacimiento, fecha jubilación)
  - [x] Datos académicos (centro, área de conocimiento)
  - [x] IBAN para domiciliación
  - [x] Validación de campos obligatorios
- [x] Formulario de solicitud de Miembro Cooperante (`/solicitud-alta/cooperante`)
  - [x] Datos personales
  - [x] Relación con UMA (opcional), estudios y aficiones
  - [x] Emails de dos profesores avalistas (validados contra socios activos)
- [x] Prevención de duplicados por DNI

### Área privada del socio
- [x] Dashboard del socio (`/socio`)
- [x] Página "Mi perfil" — ver y editar datos de contacto e IBAN (`/socio/perfil`)
- [x] Página "Mi carnet" — visualización del carnet digital (`/socio/carnet`)
- [x] Página "Mis cuotas" — historial y estado del año actual (`/socio/cuotas`)

### Panel de administración
- [x] Dashboard admin con estadísticas (`/admin`)
  - [x] Total socios activos profesores / cooperantes / bajas / fallecidos / pendientes
- [x] Listado de socios con búsqueda, filtros y ordenación (`/admin/socios`)
- [x] Ficha completa de un socio (`/admin/socios/[id]`)
- [x] Botón de invitación para enviar acceso al socio
- [x] Listado y gestión de cuotas (`/admin/cuotas`)
  - [x] Estadísticas por año/semestre
  - [x] Cambiar estado (cobrado, devuelto, exento, pendiente)
  - [x] Crear y eliminar cuotas
- [x] Listado y gestión de solicitudes de alta (`/admin/solicitudes`)
  - [x] Aprobar solicitud → asignar número de socio y activar
  - [x] Rechazar solicitud → guardar motivo

### GitHub + Vercel
- [x] Crear repositorio GitHub (`cspinola1/asprojuma`) y hacer primer push
- [x] Conectar repositorio con Vercel
- [x] Verificar despliegue automático en Vercel
- [x] Configurar variables de entorno en Vercel
- [x] Configurar Supabase Auth URL Configuration para producción
- [x] Plataforma en producción: `https://asprojuma.vercel.app`

---

## FASE 2 — Carnets digitales
**En curso**

- [x] Diseño del carnet digital (fondo azul degradado, logo UMA, datos del socio)
- [x] Generación de PDF con `@react-pdf/renderer` — tamaño tarjeta CR80
- [x] Añadir código QR con URL de verificación
- [x] Página pública de verificación de carnet por QR (`/verificar/[id]`)
  - [x] Muestra nombre, tipo, número y fecha de ingreso
  - [x] Sin login requerido
- [x] Botón "Descargar PDF" en área privada del socio
- [ ] Subir PDF generado a Supabase Storage y guardar URL en tabla `carnets`
- [ ] Enviar carnet por email al socio
- [ ] Historial de carnets anteriores con descarga individual
- [ ] Proceso de renovación anual
  - [ ] Envío automático de aviso el 1 de diciembre
  - [ ] El socio confirma sus datos desde área privada
  - [ ] Admin valida cobro y activa renovación
  - [ ] Generación y envío automático del nuevo carnet

---

## FASE 3 — Portal del socio completo
**Pendiente**

### Área privada del socio
- [ ] Ver recibos individuales en PDF
- [ ] Cambiar contraseña
- [ ] (Solo profesores) Ver avales realizados a cooperantes

### Panel de administración — cuotas y remesas
- [ ] Generación de remesas SEPA XML (ISO 20022 pain.008)
  - [ ] Seleccionar ejercicio y semestre
  - [ ] Filtrar socios activos con IBAN válido y cuota pendiente
  - [ ] Previsualizar remesa (importe total, número de recibos)
  - [ ] Descargar fichero XML listo para banca electrónica
  - [ ] Marcar automáticamente recibos como "en cobro"
  - [ ] Confirmar cobro → actualizar estado

### Comunicaciones
- [ ] Enviar email a grupos de socios (por tipo, estado, actividad)
- [ ] Plantillas de email configurables desde panel admin

### Informes y exportaciones
- [ ] Exportar listado de socios a CSV/Excel
- [ ] Exportar historial de pagos a CSV/Excel
- [ ] Estadísticas generales de la asociación

---

## FASE 4 — Actividades
**Pendiente**

- [ ] Calendario de actividades — vista mensual y lista
- [ ] Crear / editar / publicar actividades (admin)
- [ ] Inscripción online desde área privada
- [ ] Lista de espera cuando se completa el aforo
- [ ] Recordatorio automático por email 48h antes
- [ ] Gestión de inscritos desde panel admin
- [ ] Informes de asistencia por actividad

---

## Pendientes transversales (cualquier fase)

- [ ] RGPD
  - [ ] Política de privacidad
  - [ ] Registro de consentimientos (fecha + versión)
  - [ ] Derecho de acceso — exportar datos propios
  - [ ] Derecho al olvido — proceso de baja y anonimización
- [ ] Seguridad
  - [ ] Rate limiting en login y formularios públicos
  - [ ] Auditoría de cambios en datos sensibles
  - [ ] Cifrado de IBANs en base de datos
- [ ] Accesibilidad (WCAG AA mínimo)
- [ ] Versión móvil responsive verificada
- [ ] Dominio propio de la asociación (asprojuma.es o similar)
- [ ] Configurar plantillas de email en Supabase Auth (invitación y recuperación)
