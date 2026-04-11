# ASPROJUMA · Devlog

Registro cronológico de todo el trabajo realizado en el proyecto.
Cada entrada incluye fecha, hora y descripción detallada de lo hecho.

---

## 2026-04-10 — Invitados en Actividades, Carnet JPG y fixes UX

### Implementado

- **Carnet JPG mejorado**: degradado de fondo (linear-gradient), logo más grande, textos mayores, distribución uniforme con `space-around`. Fix: satori no soporta `space-evenly` ni `background` (hay que usar `backgroundImage`).

- **Invitados externos en actividades** (tabla `actividades_invitados`):
  - Campos: `id`, `actividad_id`, `nombre`, `email`, `estado`, `fecha_inscripcion`, `fecha_pago`, `precio`, `notas`, `inscrito_por_socio_id`
  - Socio puede añadir invitados al inscribirse (nombre obligatorio, email opcional, selector dinámico +/-)
  - Admin puede añadir invitados directamente desde panel de la actividad
  - Email de confirmación automático via Resend al marcar pagado (o inmediato si actividad gratuita)
  - Cancelar inscripción de socio cancela también sus invitados pendientes de pago
  - Plazas cuentan socios + invitados activos (no cancelados)

- **Lista de inscritos en ficha de actividad** (vista socio): muestra socios e invitados activos con nombre

- **Columna inscritos en listado admin**: ahora suma socios + invitados activos (antes solo contaba socios y no excluía cancelados)

- **Login**: botón 👁️ para ver/ocultar contraseña

- **Roles**: permiso `solicitudes` añadido al rol `junta` (en `roles.ts` y en tabla visual de `/admin/roles`)

- **Búsqueda socio por email**: en actividades (página detalle y API), igual que en el carnet — busca por `email_uma` o `email_otros` en lugar de `user_id`

### Decisiones técnicas

- **Una sola tabla `actividades_invitados`** para todos los no-socios (acompañantes informales e invitados externos con datos). Diseño elegido frente a mantener `num_invitados` en la inscripción del socio.
- **Resend inicializado lazy** (`getResend()` en lugar de `const resend = new Resend(...)` al importar) para evitar fallo de build cuando `RESEND_API_KEY` no está disponible en entorno local.
- La tabla de permisos en `/admin/roles/page.tsx` está hardcodeada (independiente de `roles.ts`). Hay que mantener ambas sincronizadas manualmente al cambiar permisos.

### Problemas encontrados y soluciones

- **Build error `space-evenly`**: satori no soporta `justifyContent: 'space-evenly'`. Cambiado a `'space-around'`.
- **Build error `Resend API key`**: `new Resend(undefined)` lanza en tiempo de importación. Solución: función `getResend()` lazy.
- **Build error TypeScript cast**: `invitado.actividades as {...}` fallaba por tipo array. Solución: cast a `unknown` primero.
- **Texto invisible en inputs**: faltaba `text-gray-900` en campos del formulario de invitados (admin y socio). Añadido.
- **"Solo socios activos pueden inscribirse"**: la búsqueda del socio usaba `user_id` (no enlazado en BD). Corregido buscando por `email_uma` o `email_otros`.
- **Precio no actualizado en popover**: caché de Next.js. Solucionado con `revalidatePath('/admin/actividades')` tras PATCH.

### Pendiente para próxima sesión

- 📋 **Comunicaciones**: envío masivo de emails a grupos de socios por tipo/estado
- 📋 **Actividades — recordatorio 48h**: email automático a inscritos
- 📋 **Actividades — exportar CSV**: lista de inscritos desde admin
- ⚠️ **Variables Vercel** pendientes: `ASPROJUMA_IAS`, `ASPROJUMA_IBAN`, `ASPROJUMA_BIC`

---

## Sesión · 2026-04-02b — Calendario visual y pulido UX

### Implementado

- **Calendario visual tipo Google Calendar** (`src/components/CalendarioActividades.tsx`):
  - Grid mensual con semana empezando en lunes (offset `(getDay() + 6) % 7`)
  - Navegación mes a mes + botón "Hoy"
  - Pills de actividades: verde=gratuita, naranja=pago, azul=inscrito
  - Admin: clic en día vacío → nueva actividad con fecha pre-rellenada
  - Socio: popover con info resumida + "Ver detalle"
  - Leyenda en pie del calendario
  - Toggle lista / calendario en la vista admin

- **Botones calendario en popover eliminados**: "Google Cal" e ".ics" quitados del popover flotante del calendario. Ahora solo aparecen dentro de la página de detalle de actividad (`AddToCalendar.tsx`). También eliminadas funciones helper `googleCalendarUrl()` y `descargarICS()` del componente calendario para evitar errores ESLint.

### Decisiones técnicas

- Las funciones de exportación al calendario (Google Cal / .ics) se centralizan en el componente `AddToCalendar.tsx` de la página de detalle, no en el calendario. El popover es solo informativo + navegación.

### Pendiente para próxima sesión

- ⚠️ **SQL pendiente** (ejecutar en Supabase SQL Editor si no se ha hecho):
  - `CREATE TABLE admin_roles`
  - `CREATE TABLE actividades`
  - `CREATE TABLE actividades_inscripciones`
- ⚠️ **Variables Vercel** pendientes: `ASPROJUMA_IAS`, `ASPROJUMA_IBAN`, `ASPROJUMA_BIC`, `NEXT_PUBLIC_APP_URL=https://asprojuma.es`
- ⚠️ **Dominio asprojuma.es** — verificar que está verde en Vercel
- ⚠️ **Emails** — probar que confirmación de solicitud llega correctamente
- 📋 Próxima funcionalidad: **Comunicaciones** (envío de emails a grupos de socios)

---

## Sesión · 2026-04-02 — Roles, Actividades y Dominio

### Implementado

- **Sistema de roles** (`lib/roles.ts`): tesorero, secretario, junta, presidente, admin
  - `getRol(email)` consulta primero ADMIN_EMAILS env var, luego tabla `admin_roles` en Supabase
  - `tienePermiso(user, permiso)` usado en todos los API routes de admin
  - Admin layout actualizado con nav condicional según rol y badge del rol activo
  - Página `/admin/roles`: asignar/eliminar roles con tabla visual de permisos
  - Middleware simplificado: ya no bloquea /admin (el layout lo gestiona)

- **Módulo de actividades** completo:
  - Admin: CRUD de actividades (`/admin/actividades`, `/admin/actividades/nueva`, `/admin/actividades/[id]`)
  - Admin: gestión de inscripciones por actividad con marcar pagado/cancelar
  - Socio: listado de próximas actividades agrupado por mes (`/socio/actividades`)
  - Socio: ficha detalle con botón inscribirse/cancelar (`/socio/actividades/[id]`)
  - Aviso de transferencia bancaria para actividades de pago pendiente

- **Dominio asprojuma.es**: DNS configurado en IONOS (A record 216.198.79.1, CNAME www → Vercel, SPF actualizado con amazonses.com)

- **Fix emails**: `email_principal` es columna restringida en Supabase (no insertable directamente). Las acciones de admin ahora usan `email_uma || email_otros`. La confirmación de solicitud de profesor se envía a ambos emails.

- **Skill `update-session`** creado en `~/.claude/skills/update-session/SKILL.md`

### Decisiones técnicas

- `email_principal` en la tabla socios es una columna con restricción DEFAULT (probablemente generada por trigger de Supabase Auth al invitar al usuario). No se puede insertar directamente — hay que leerla desde auth o usar `email_uma || email_otros`.
- El middleware ya no verifica el rol admin (solo autenticación). La verificación de acceso al panel admin la hace el server component del layout, evitando llamadas a BD en Edge runtime.
- Los roles de la BD se cachean por request (una sola query por layout render). No hay caché entre requests.

### Problemas encontrados

- 5 errores de build ESLint por parámetros `_request`/`_ctx` con prefijo `_` que ESLint igualmente marca como "unused". Solución: eliminar el parámetro completamente cuando no se usa, o usar la firma sin parámetro (`GET()` sin args).
- `email_principal`: intento de insert fallaba con "cannot insert a non-DEFAULT value". Revertido y se usa `email_uma || email_otros` en su lugar.

### Pendiente para próxima sesión

- ⚠️ **SQL pendiente** (ejecutar en Supabase SQL Editor si no se ha hecho):
  ```sql
  CREATE TABLE admin_roles (...);  -- sistema de roles
  CREATE TABLE actividades (...);  -- módulo actividades
  CREATE TABLE actividades_inscripciones (...);  -- inscripciones
  ```
- ⚠️ **Variables Vercel** pendientes de configurar:
  - `ASPROJUMA_IAS` — Identificador de Acreedor SEPA
  - `ASPROJUMA_IBAN` — IBAN cuenta ASPROJUMA
  - `ASPROJUMA_BIC` — BIC del banco
  - `NEXT_PUBLIC_APP_URL=https://asprojuma.es` (cuando dominio esté verde en Vercel)
- ⚠️ **Dominio asprojuma.es** — verificar que Vercel lo marca en verde (puede tardar hasta 24h)
- ⚠️ **Emails** — probar solicitud de alta con la corrección de email_principal para confirmar que llegan
- 📋 Próxima funcionalidad acordada: **Comunicaciones** (envío de emails masivos a grupos de socios)

---

## Sesión 1 · 2026-03-23

### 21:22 — Migración de datos Excel → SQL
- Ejecutado `migrar_asprojuma.py` sobre los ficheros Excel
- Generado `asprojuma_datos.sql` con:
  - 113 socios profesores (73 activos, 11 exentos >85 años, 18 bajas, 11 fallecidos)
  - 54 miembros cooperantes (29 activos, 22 bajas, 3 fallecidos)
  - Cuota semestre 2/2025 registrada como cobrada para socios activos con IBAN
  - IBANs en formato antiguo (20 dígitos) normalizados a ES + 22 dígitos
- Generado `informe_migracion.txt` — sin alertas: todos los socios activos tienen IBAN y DNI

### 23:10 — Instalación de Node.js y creación del proyecto
- Instalado Node.js v24.14.0 (LTS)
- Creado proyecto Next.js 14 con TypeScript + Tailwind CSS + ESLint + App Router
- Instaladas dependencias Supabase: `@supabase/supabase-js`, `@supabase/ssr`

### 23:20 — Estructura base del proyecto
Ficheros creados:

| Fichero | Descripción |
|---|---|
| `.env.local` | Variables de entorno (URL y clave anon de Supabase) |
| `src/lib/supabase/client.ts` | Cliente Supabase para componentes del navegador |
| `src/lib/supabase/server.ts` | Cliente Supabase para Server Components (cookies) |
| `src/lib/types.ts` | Tipos TypeScript: `Socio`, `Cuota`, `Carnet`, enums de estado |
| `src/middleware.ts` | Protege rutas `/socio` y `/admin`, redirige a `/login` si no autenticado |
| `src/app/layout.tsx` | Layout raíz: idioma `es`, fuente Inter, metadata ASPROJUMA |
| `src/app/page.tsx` | Página de inicio pública: hero con estadísticas en tiempo real |
| `src/app/login/page.tsx` | Formulario de login con Supabase Auth |
| `src/app/socio/page.tsx` | Dashboard del socio autenticado |
| `src/app/api/auth/logout/route.ts` | API route para cerrar sesión |

### 23:49 — Documentación del proyecto
- Creado `ROADMAP.md` con todos los tasks organizados por fases
- Creado `DEVLOG.md` (este fichero)

---

## Sesión 2 · 2026-03-24

### Panel de administración completo

**`/admin`** — Dashboard con 6 tarjetas de estadísticas:
- Socios activos profesores / cooperantes, bajas, fallecidos, pendientes de aprobación
- Enlace directo a lista filtrada por estado

**`/admin/socios`** — Listado de socios con:
- Búsqueda por nombre, email y DNI
- Filtros por tipo (profesor/cooperante) y estado
- Ordenación por columnas (Nº, apellidos, tipo, estado, centro)
- Solución especial para ordenar Nº en lista mixta: JS-side sort con `num_socio ?? num_cooperante`

**`/admin/socios/[id]`** — Ficha completa con secciones:
- Datos personales, contacto, dirección, académicos/bancarios, notas
- Botón "Enviar acceso al socio" (llama a `/api/admin/invitar`)

**`/admin/solicitudes`** — Lista de solicitudes pendientes con datos de avalistas
**`/admin/solicitudes/[id]`** — Detalle con acciones aprobar/rechazar:
- Aprobar: asigna siguiente num_socio o num_cooperante, cambia estado a 'activo'
- Rechazar: guarda motivo en notas, cambia estado a 'baja'

**`/admin/cuotas`** — Gestión de cuotas:
- Estadísticas: cobradas, pendientes, devueltas, exentas, total €
- Filtros por año (default: año más reciente con datos), semestre, estado
- Búsqueda por nombre y número de socio
- Acciones: cobrar, devolver, marcar exento, pendiente, eliminar
- Crear cuota manual (`/admin/cuotas/nueva`)

### Área privada del socio

**`/socio/perfil`** — Ver y editar datos de contacto:
- Vista modo lectura / modo edición toggle
- Campos editables: teléfonos, dirección completa, IBAN
- Server action `actualizarPerfil`

**`/socio/carnet`** — Visualización del carnet digital:
- Diseño fiel al carnet físico: fondo azul degradado, logo UMA, datos del socio
- "Socio Profesor Jubilado Nº X" o "Socio Miembro Cooperante Nº X"
- Año de validez + uma.es en colores teal
- Historial de carnets anteriores

**`/socio/cuotas`** — Resumen de cuotas:
- Tarjetas resumen: cobradas, pendientes, exentas
- Detalle del año actual por semestre
- Historial de años anteriores

### Autenticación completa

**`/recuperar-contrasena`** — Formulario para solicitar reset por email
**`/nueva-contrasena`** — Formulario para establecer nueva contraseña
**`/auth/callback`** — Intercambia código Supabase por sesión, redirige a `/nueva-contrasena` para invitaciones y recuperaciones
**`/api/admin/invitar`** — Llama a `inviteUserByEmail` con service_role key

Dependencias añadidas:
- `src/lib/admin.ts` — helper `isAdmin()` basado en `ADMIN_EMAILS` env var
- `src/lib/supabase/admin.ts` — cliente con service_role key para operaciones admin

Variables de entorno añadidas a `.env.local`:
- `ADMIN_EMAILS=cspinola1@gmail.com`
- `SUPABASE_SERVICE_ROLE_KEY=sb_secret_...` (nuevo formato sin JWT)
- `NEXT_PUBLIC_APP_URL=http://localhost:3000`

Nota: la nueva API key de Supabase usa prefijo `sb_secret_` en lugar del formato JWT `eyJ...`

---

## Sesión 3 · 2026-03-25

### Formularios de solicitud de alta

**`/solicitud-alta`** — Landing con tarjetas Profesor vs Cooperante

**`/solicitud-alta/profesor`** — Formulario completo con:
- Validación de campos obligatorios antes de envío (incluyendo fechas)
- Label "Último Centro al que estuvo adscrito (Facultad o Escuela)"
- Label "Área de Conocimiento" (en lugar de Titulación)
- Texto cuota: "La cuota anual es de 50 € divididos en dos semestres de 25 € (junio · diciembre)"
- Server action que verifica duplicados por DNI e inserta en `socios` + `socios_profesores`

**`/solicitud-alta/cooperante`** — Formulario con:
- Relación con UMA (no obligatorio), estudios, aficiones
- Dos campos de email de avalistas (validados como socios profesores activos)
- Server action que verifica avalistas y guarda "AVALISTAS: email1 | email2" en notas

### Fixes aplicados
- `text-gray-900` añadido a todos los inputs/selects para visibilidad del texto
- Removido `onError` de `<img>` en Server Components (causa error de hidratación)
- Ordenación de cooperantes en lista mixta: uso de `num_cooperante` cuando el filtro es `tipo=cooperante`

---

## Sesión 4 · 2026-03-26 — 2026-03-27

### Despliegue en producción

**GitHub:**
- Inicializado repositorio git local
- Instalado GitHub CLI (`gh`) via winget
- Autenticado con GitHub via browser
- Primer commit con 60 ficheros (11.089 líneas)
- Repo: `https://github.com/cspinola1/asprojuma`

**Vercel:**
- Proyecto importado desde GitHub
- Variables de entorno configuradas (las 4 necesarias + `NEXT_PUBLIC_APP_URL`)
- Deploy automático en cada push a `master`
- URL de producción: `https://asprojuma.vercel.app`

**Supabase Auth URL Configuration:**
- Site URL: `https://asprojuma.vercel.app`
- Redirect URLs: `https://asprojuma.vercel.app/auth/callback`

**Fixes para build de producción (TypeScript/ESLint strict):**
- `let` → `const` en `updateData` en `solicitudes/actions.ts`
- `[...new Set(...)]` → `Array.from(new Set(...))` en `cuotas/page.tsx`
- Eliminado cast explícito `(s: Socio)` en `.map()` de `socios/page.tsx`
- Añadido `as EstadoSocio` y `as EstadoCarnet` donde necesario para indexar Records

---

## Sesión 5 · 2026-03-28

### Fase 2 — PDF del carnet con QR code

**`/api/carnet`** — API route que genera PDF on-demand:
- Tamaño tarjeta CR80 (85.6mm × 54mm)
- Logo UMA embebido como base64
- Cabecera: ASPROJUMA + Universidad de Málaga
- Datos: nombre, apellidos, tipo, número, DNI
- Columna derecha: año de validez, uma.es, QR code
- QR code enlaza a `/verificar/[id]`
- Generado con `@react-pdf/renderer` v4 + `qrcode`
- Descarga con nombre `carnet-asprojuma-[num].pdf`

**`/verificar/[id]`** — Página pública de verificación:
- No requiere login
- Muestra nombre, categoría, número y fecha de ingreso del socio
- Indica si el socio está activo o no
- Accesible escaneando el QR del carnet

**`/socio/carnet`** — Actualizado con botón "Descargar PDF":
- Si tiene carnet vigente: botón "Descargar PDF"
- Si no tiene carnet: botón "Descargar PDF provisional"
- Ambos llaman a `/api/carnet`

Dependencias añadidas: `@react-pdf/renderer ^4.3.2`, `qrcode ^1.5.4`, `@types/qrcode ^1.5.6`
