# ASPROJUMA · Roadmap del proyecto

> Plataforma web de gestión para la Asociación de Profesores Jubilados de la Universidad de Málaga
> Stack: Next.js 14 · React · Tailwind CSS · Supabase · Vercel

---

## FASE 1 — Fundamentos
**Duración estimada:** 6-8 semanas

### Infraestructura y base de datos
- [x] Generar script SQL de migración desde Excel (`migrar_asprojuma.py`)
- [x] Generar `asprojuma_datos.sql` con 113 socios y 54 cooperantes
- [ ] Ejecutar `asprojuma_datos.sql` en Supabase SQL Editor
- [ ] Verificar datos migrados con consultas del Paso 5 del SQL

### Proyecto Next.js
- [x] Crear proyecto Next.js 14 con TypeScript + Tailwind CSS
- [x] Instalar dependencias Supabase (`@supabase/supabase-js`, `@supabase/ssr`)
- [x] Crear clientes Supabase client-side y server-side
- [x] Crear tipos TypeScript (`Socio`, `Cuota`, `Carnet`)
- [x] Crear middleware de protección de rutas (`/socio`, `/admin`)
- [x] Crear `.env.local` con variables de entorno
- [ ] Rellenar `.env.local` con claves reales de Supabase

### Páginas públicas
- [x] Página de inicio pública (`/`)
- [ ] Página "Quiénes somos" con información de la asociación
- [ ] Página de contacto

### Autenticación
- [x] Página de login (`/login`)
- [ ] Configurar Supabase Auth (email + contraseña)
- [ ] Página de recuperación de contraseña
- [ ] Flujo de primer acceso / activación de cuenta

### Formulario de alta online
- [ ] Formulario de solicitud de Socio Profesor
  - [ ] Datos personales (nombre, DNI, fecha nacimiento)
  - [ ] Datos académicos (facultad, departamento, fecha jubilación)
  - [ ] IBAN para domiciliación
  - [ ] Aceptación RGPD
- [ ] Formulario de solicitud de Miembro Cooperante
  - [ ] Datos personales
  - [ ] Estudios y aficiones
  - [ ] Indicar emails de dos profesores avalistas
- [ ] Subida de fotocopia DNI (Supabase Storage)
- [ ] Email de confirmación al solicitante (Resend)

### Flujo de avales para cooperantes
- [ ] Envío automático de email a profesores avalistas al recibir solicitud
- [ ] Página pública de confirmación de aval por token único
- [ ] Notificación al solicitante cuando ambos avales son confirmados
- [ ] Gestión de aval rechazado (notificación + solicitud de nuevo aval)

### Área privada del socio (básica)
- [x] Dashboard del socio (`/socio`)
- [ ] Página "Mi perfil" — ver datos personales
- [ ] Editar datos de contacto (dirección, teléfonos, email)
- [ ] Actualizar IBAN

### Panel de administración (básico)
- [ ] Dashboard admin con estadísticas (`/admin`)
  - [ ] Total socios activos / bajas / fallecidos
  - [ ] Solicitudes pendientes de aprobación
- [ ] Listado de socios con búsqueda y filtros
- [ ] Ficha completa de un socio (ver + editar)
- [ ] Cambiar estado de un socio (activo → baja, etc.)
- [ ] Listado y gestión de solicitudes de alta
  - [ ] Aprobar solicitud → crear socio
  - [ ] Rechazar solicitud → enviar email con motivo

### GitHub + Vercel
- [ ] Crear repositorio GitHub y hacer primer push
- [ ] Conectar repositorio con Vercel
- [ ] Verificar despliegue automático en Vercel
- [ ] Configurar variables de entorno en Vercel

---

## FASE 2 — Carnets digitales
**Duración estimada:** 4-5 semanas

- [ ] Diseño del carnet en PDF (fiel al diseño actual: fondo azul, logo UMA)
- [ ] Generación de PDF con React-PDF o Puppeteer
- [ ] Añadir código QR con URL de verificación única
- [ ] Subir PDF generado a Supabase Storage
- [ ] Enviar carnet por email al socio (Resend)
- [ ] Página pública de verificación de carnet por QR (`/verificar/[token]`)
  - [ ] Muestra foto, nombre, tipo y estado de vigencia en tiempo real
  - [ ] Sin login requerido
- [ ] Página "Mi carnet" en área privada — descargar PDF vigente
- [ ] Historial de carnets anteriores
- [ ] Proceso de renovación anual
  - [ ] Envío automático de aviso el 1 de diciembre
  - [ ] El socio confirma sus datos desde área privada
  - [ ] Admin valida cobro y activa renovación
  - [ ] Generación y envío automático del nuevo carnet

---

## FASE 3 — Portal del socio completo
**Duración estimada:** 5-6 semanas

### Área privada del socio
- [ ] Página "Mis cuotas" — historial de pagos y estado del año actual
- [ ] Ver recibos individuales en PDF
- [ ] Cambiar contraseña
- [ ] Cerrar sesión en todos los dispositivos
- [ ] (Solo profesores) Ver avales realizados a cooperantes

### Panel de administración — cuotas y remesas
- [ ] Registrar pago manual de un socio
- [ ] Marcar socio como exento
- [ ] Generación de remesas SEPA XML (ISO 20022 pain.008)
  - [ ] Seleccionar ejercicio y semestre
  - [ ] Filtrar socios activos con IBAN válido y cuota pendiente
  - [ ] Previsualizar remesa (importe total, número de recibos)
  - [ ] Descargar fichero XML listo para banca electrónica
  - [ ] Marcar automáticamente recibos como "en cobro"
  - [ ] Confirmar cobro → actualizar estado → generar recibos PDF

### Comunicaciones
- [ ] Enviar email a grupos de socios (por tipo, estado, actividad)
- [ ] Plantillas de email configurables desde panel admin

### Informes y exportaciones
- [ ] Exportar listado de socios a CSV/Excel
- [ ] Exportar historial de pagos a CSV/Excel
- [ ] Estadísticas generales de la asociación

---

## FASE 4 — Actividades
**Duración estimada:** 4-5 semanas

- [ ] Calendario de actividades — vista mensual y lista
- [ ] Crear / editar / publicar actividades (admin)
  - [ ] Título, tipo, fecha, lugar, aforo, precio
  - [ ] Imagen de portada
  - [ ] Restringir a solo socios Profesor
- [ ] Inscripción online desde área privada
  - [ ] Confirmación automática por email
  - [ ] Lista de espera cuando se completa el aforo
  - [ ] Notificación automática al liberar plaza
- [ ] Cancelar inscripción
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
- [ ] Dominio .es de la asociación (pendiente de contratar)
