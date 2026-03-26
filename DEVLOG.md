# ASPROJUMA · Devlog

Registro cronológico de todo el trabajo realizado en el proyecto.
Cada entrada incluye fecha, hora y descripción detallada de lo hecho.

---

## Sesión 1 · 2026-03-23

### 23:03 — Contexto y planificación inicial
- Revisado el documento de contexto del proyecto (`contexto proyecto.pdf`)
- Revisado el documento de arquitectura y especificaciones técnicas (`arquitectura plataforma.pdf`)
- Definido el stack: Next.js 14 + React + Tailwind CSS + Supabase + Vercel
- Infraestructura ya creada: GitHub (vacío), Supabase (vacío), Vercel (creado)

### 21:22 — Migración de datos Excel → SQL
*(Esta tarea se completó antes de la sesión de desarrollo)*
- Ejecutado `migrar_asprojuma.py` sobre los ficheros Excel
- Generado `asprojuma_datos.sql` con:
  - 113 socios profesores (73 activos, 11 exentos >85 años, 18 bajas, 11 fallecidos)
  - 54 miembros cooperantes (29 activos, 22 bajas, 3 fallecidos)
  - Cuota semestre 2/2025 registrada como cobrada para socios activos con IBAN
  - IBANs en formato antiguo (20 dígitos) normalizados a ES + 22 dígitos
- Generado `informe_migracion.txt` — sin alertas: todos los socios activos tienen IBAN y DNI
- Ficheros pendientes de subir a GitHub

### 23:10 — Instalación de Node.js y creación del proyecto
- Instalado Node.js v24.14.0 (LTS)
- Resuelto error de PowerShell (`ExecutionPolicy`) usando Git Bash
- Creado proyecto Next.js 14 con:
  ```
  npx create-next-app@14 asprojuma --typescript --tailwind --eslint --app --src-dir
  ```
- Instaladas dependencias Supabase:
  ```
  npm install @supabase/supabase-js @supabase/ssr
  ```

### 23:20 — Estructura base del proyecto
Ficheros creados:

| Fichero | Descripción |
|---|---|
| `.env.local` | Variables de entorno (URL y clave anon de Supabase) — pendiente de rellenar con valores reales |
| `src/lib/supabase/client.ts` | Cliente Supabase para componentes del navegador (usa `createBrowserClient`) |
| `src/lib/supabase/server.ts` | Cliente Supabase para Server Components (usa `createServerClient` + cookies) |
| `src/lib/types.ts` | Tipos TypeScript: `Socio`, `Cuota`, `Carnet`, enums de estado |
| `src/middleware.ts` | Middleware Next.js: protege rutas `/socio` y `/admin`, redirige a `/login` si no autenticado |
| `src/app/layout.tsx` | Layout raíz: idioma `es`, fuente Inter, metadata ASPROJUMA |
| `src/app/page.tsx` | Página de inicio pública: cabecera, hero con degradado azul, estadísticas, pie de página |
| `src/app/login/page.tsx` | Formulario de login con Supabase Auth (email + contraseña) |
| `src/app/socio/page.tsx` | Dashboard del socio autenticado (Server Component protegido) |
| `src/app/api/auth/logout/route.ts` | API route para cerrar sesión |

### 23:35 — Traslado del proyecto
- Proyecto movido de `C:/Users/cspin/Documents/asprojuma` a `C:/prj claude/asprojuma`
- Servidor de desarrollo arrancado con `npm run dev` — accesible en `http://localhost:3000`

### 23:49 — Documentación del proyecto
- Creado `ROADMAP.md` con todos los tasks organizados por fases (Fase 1 a Fase 4) y tareas transversales
- Creado `DEVLOG.md` (este fichero)

---

## Pendiente para próxima sesión
- [ ] Rellenar `.env.local` con las claves reales de Supabase
- [ ] Ejecutar `asprojuma_datos.sql` en Supabase SQL Editor
- [ ] Crear repositorio GitHub y hacer primer `git push`
- [ ] Conectar con Vercel para despliegue automático
- [ ] Iniciar Fase 1: autenticación y panel de administración básico
