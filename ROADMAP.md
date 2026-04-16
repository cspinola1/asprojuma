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
- [x] Flujo /auth/confirm con soporte PKCE, token_hash y error params (expirados)
- [x] Redirección automática admin/socio tras login según rol

### Formulario de alta online
- [x] Formulario de solicitud de Socio Profesor (`/solicitud-alta/profesor`)
- [x] Formulario de solicitud de Miembro Cooperante (`/solicitud-alta/cooperante`)
- [x] Prevención de duplicados por DNI y email UMA
- [x] Email de confirmación de recepción al solicitante (vía Resend)
- [x] Email de rechazo con observaciones

### Área privada del socio
- [x] Dashboard del socio (`/socio`)
- [x] Página "Mi perfil" — ver y editar datos de contacto e IBAN
- [x] Página "Mi carnet" — visualización del carnet digital
- [x] Página "Mis cuotas" — historial y estado del año actual
- [x] Página "Actividades" — ver y apuntarse a actividades

### Panel de administración
- [x] Dashboard admin con estadísticas (`/admin`)
- [x] Listado de socios con búsqueda, filtros y exportación CSV
- [x] Ficha completa de un socio con edición y dar de baja
- [x] Botón de invitación y envío de carnet individual
- [x] Listado y gestión de cuotas
- [x] Listado y gestión de solicitudes de alta (aprobar/rechazar)

### GitHub + Vercel
- [x] Repositorio GitHub (`cspinola1/asprojuma`) + despliegue automático Vercel
- [x] Variables de entorno configuradas en Vercel
- [x] Dominio asprojuma.es configurado en Vercel + DNS en IONOS
- [x] Email Resend desde noreply@asprojuma.es (dominio verificado)

---

## FASE 2 — Carnets digitales ✅ COMPLETADA
**Completada:** 2026-04-16

- [x] Diseño del carnet digital (fondo azul degradado, logo UMA, datos del socio)
- [x] Generación PDF con `@react-pdf/renderer` — tamaño tarjeta CR80
- [x] Código QR con URL de verificación pública
- [x] Página pública de verificación de carnet por QR (`/verificar/[id]`)
- [x] Botón "Descargar JPG" en área privada del socio
- [x] Envío de carnet por email al socio desde admin
- [x] Generación masiva anual de carnets (Admin → Carnets)
- [x] **Migración PDF → JPG**: carnets generados como JPG (alta resolución), PDFs borrados del Storage
- [x] **Envío masivo**: botón "Enviar carnets por email" tras generación (paso 2 en admin/carnets)
- [x] **Fix cooperantes**: generación incluye socios con num_cooperante además de num_socio

---

## FASE 3 — Cuotas, Remesas y Comunicaciones ✅ COMPLETADA (parcial)
**Completada:** 2026-04-02

### Remesas SEPA
- [x] Generación de remesa SEPA pain.008 XML (FRST/RCUR agrupados)
- [x] Exportación CSV de remesa
- [x] Panel de gestión de remesa: marcar cobradas / devueltas con motivo
- [x] Motivos de devolución bancaria (MD01, MD06, AC06, AC04, AM04)
- [x] Dar de baja a socio desde devolución no resuelta

### Comunicaciones (pendiente)
- [ ] Enviar email a grupos de socios (por tipo, estado, etc.)
- [ ] Plantillas de email configurables desde panel admin

---

## FASE 4 — Roles y Permisos ✅ COMPLETADA
**Completada:** 2026-04-02

- [x] Sistema de roles: tesorero, secretario, junta, presidente, admin
- [x] Panel `/admin/roles` para asignar y eliminar roles
- [x] Nav admin condicional según rol del usuario
- [x] Todos los API routes protegidos con permisos por rol
- [x] **Nuevo rol `actividades`**: acceso a dashboard, socios y gestión de actividades (2026-04-16)

Matriz de permisos:
| Sección | Tesorero | Secretario | Junta | Presidente | Admin |
|---------|----------|------------|-------|------------|-------|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ |
| Socios (ver) | ✓ | ✓ | ✓ | ✓ | ✓ |
| Solicitudes | ✓ | ✓ | | ✓ | ✓ |
| Cuotas/Remesas | ✓ | | | ✓ | ✓ |
| Carnets | ✓ | ✓ | | ✓ | ✓ |
| Editar/eliminar socio | | ✓ | | ✓ | ✓ |
| Actividades (gestión) | | | ✓ | ✓ | ✓ |
| Roles | | | | | ✓ |

---

## FASE 5 — Actividades ✅ COMPLETADA
**Completada:** 2026-04-10

- [x] Tablas `actividades` y `actividades_inscripciones` en Supabase
- [x] Admin: listar, crear, editar y eliminar actividades
- [x] Admin: gestión de inscripciones por actividad (marcar pagado / cancelar)
- [x] Socio: listado de próximas actividades en calendario mensual
- [x] Socio: ficha detalle con inscripción / cancelación online
- [x] Actividades de pago: instrucciones de transferencia bancaria
- [x] Vista de calendario mensual estilo Google Calendar
- [x] Carnet generado como JPG (alta resolución ×4) con ImageResponse + sharp (2026-04-10)
- [x] **Invitados externos**: tabla `actividades_invitados` con nombre, email, precio, estado (2026-04-10)
- [x] Socio puede añadir invitados al inscribirse (nombre obligatorio, email opcional)
- [x] Admin puede añadir/gestionar invitados externos desde panel de actividad
- [x] Email de confirmación automático a invitados al pagar (o inmediato si gratuita)
- [x] Plazas cuentan socios + invitados activos
- [x] Lista de inscritos visible en ficha de actividad (vista socio)
- [x] Columna inscritos en listado admin suma socios + invitados (sin cancelados)
- [ ] Recordatorio automático 48h antes
- [ ] Lista de espera cuando se completa el aforo
- [ ] Exportar lista de inscritos a CSV

---

## FASE 6 — Mejoras UX y fixes (2026-04-10)

- [x] Carnet JPG: degradado de fondo, textos más grandes, distribución uniforme
- [x] Login: botón ver/ocultar contraseña
- [x] Roles: permiso Solicitudes añadido al rol Junta
- [x] Búsqueda socio por email en actividades (mismo método que carnet)
- [x] Revalidación de caché tras guardar actividad
- [x] SMTP UMA (correo.uma.es) configurado para emails de auth Supabase

---

## Pendientes transversales

- [ ] **Configurar variables de entorno bancarias** en Vercel: `ASPROJUMA_IAS`, `ASPROJUMA_BIC` (IBAN y TITULAR ya configurados)
- [x] **`ASPROJUMA_IBAN`** y **`ASPROJUMA_TITULAR`** configurados en Vercel (2026-04-16)
- [x] **`NEXT_PUBLIC_APP_URL=https://asprojuma.es`** configurado en Vercel
- [ ] RGPD: política de privacidad, registro de consentimientos, derecho al olvido
- [ ] Seguridad: rate limiting en formularios públicos, auditoría de cambios
- [ ] Notificación al admin cuando llega nueva solicitud de alta
- [ ] Portal público con información de actividades (sin login)
- [ ] Historial de cambios por socio (audit log)

---

## 📋 Planificado

- **Acompañante vs Invitado**: distinguir tipo en actividades — acompañante paga el socio, invitado paga él mismo; email diferente; informar quién invita
- **Comunicaciones**: envío masivo de emails a grupos de socios (por tipo/estado)
- **Actividades — recordatorio 48h**: email automático a inscritos antes de la actividad
- **Actividades — exportar CSV**: lista de inscritos descargable desde admin
- **Actividades — lista de espera**: cuando se completa el aforo
