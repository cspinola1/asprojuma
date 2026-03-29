# ASPROJUMA · Esquema de Base de Datos

> Supabase (PostgreSQL) · Última actualización: 2026-03-29

---

## Diagrama de relaciones

```
socios (1) ──────────── (1) socios_profesores
socios (1) ──────────── (1) socios_cooperantes
socios (1) ──────────── (N) carnets
socios (1) ──────────── (N) cuotas
```

---

## Tabla: `socios`

Tabla principal. Contiene todos los socios (profesores y cooperantes).

| Campo | Tipo | Nulo | Clave | Default | Descripción |
|---|---|---|---|---|---|
| `id` | SERIAL | NO | PK | autoincrement | Identificador único |
| `tipo` | VARCHAR(20) | NO | | | `'profesor'` \| `'cooperante'` |
| `estado` | VARCHAR(30) | NO | | `'activo'` | Ver valores más abajo |
| `num_socio` | INT | SÍ | UNIQUE | | Número de socio profesor |
| `num_cooperante` | INT | SÍ | UNIQUE | | Número de miembro cooperante |
| `apellidos` | VARCHAR(200) | SÍ | | | |
| `nombre` | VARCHAR(150) | SÍ | | | |
| `dni` | VARCHAR(20) | SÍ | UNIQUE | | DNI / NIE |
| `fecha_nacimiento` | DATE | SÍ | | | |
| `iban` | VARCHAR(34) | SÍ | | | IBAN para domiciliación (ES + 22 dígitos) |
| `titular_cuenta` | VARCHAR(200) | SÍ | | | Nombre del titular de la cuenta bancaria |
| `fecha_ingreso` | DATE | SÍ | | | Fecha de alta en la asociación |
| `fecha_baja` | DATE | SÍ | | | Fecha de baja (si aplica) |
| `centro` | VARCHAR(200) | SÍ | | | Último centro/facultad de adscripción |
| `direccion` | TEXT | SÍ | | | Dirección postal completa |
| `codigo_postal` | VARCHAR(10) | SÍ | | | |
| `localidad` | VARCHAR(100) | SÍ | | | |
| `provincia` | VARCHAR(100) | SÍ | | | |
| `tel_fijo` | VARCHAR(30) | SÍ | | | Teléfono fijo |
| `tel_movil` | VARCHAR(30) | SÍ | | | Teléfono móvil |
| `email_uma` | VARCHAR(200) | SÍ | | | Email institucional UMA |
| `email_otros` | VARCHAR(200) | SÍ | | | Email personal |
| `email_principal` | VARCHAR(200) | SÍ | GENERATED | `COALESCE(email_uma, email_otros)` | Calculado automáticamente |
| `notas` | TEXT | SÍ | | | Notas internas. Para cooperantes: `"AVALISTAS: email1 \| email2"` |
| `migrado_excel` | BOOLEAN | NO | | `TRUE` | Marca registros importados del Excel original |
| `created_at` | TIMESTAMPTZ | NO | | `NOW()` | |
| `updated_at` | TIMESTAMPTZ | NO | | `NOW()` | |

### Valores de `estado`

| Valor | Descripción |
|---|---|
| `activo` | Socio activo con cuota normal |
| `activo_exento` | Activo exento de cuota (>85 años) |
| `baja` | Baja voluntaria o por impago |
| `fallecido` | Socio fallecido |
| `honorario` | Socio honorario |
| `pendiente` | Solicitud de alta pendiente de aprobación |
| `suspendido` | Suspensión temporal |

### Índices

| Índice | Campo(s) |
|---|---|
| `idx_socios_tipo` | `tipo` |
| `idx_socios_estado` | `estado` |
| `idx_socios_dni` | `dni` |

---

## Tabla: `socios_profesores`

Datos académicos adicionales exclusivos de socios profesores. Relación 1:1 con `socios`.

| Campo | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| `socio_id` | INT | NO | PK / FK → socios(id) | ON DELETE CASCADE |
| `departamento` | VARCHAR(200) | SÍ | | Departamento universitario |
| `titulacion` | VARCHAR(200) | SÍ | | Área de conocimiento |
| `fecha_jubilacion` | DATE | SÍ | | Fecha de jubilación |
| `categoria` | VARCHAR(100) | SÍ | | Categoría académica (Catedrático, Titular, etc.) |

---

## Tabla: `socios_cooperantes`

Datos adicionales exclusivos de miembros cooperantes. Relación 1:1 con `socios`.

| Campo | Tipo | Nulo | Clave | Descripción |
|---|---|---|---|---|
| `socio_id` | INT | NO | PK / FK → socios(id) | ON DELETE CASCADE |
| `estudios` | TEXT | SÍ | | Estudios realizados |
| `aficiones` | TEXT | SÍ | | Aficiones e intereses |
| `descripcion_relacion` | TEXT | SÍ | | Relación con la UMA (PAS, familiar, etc.) |

---

## Tabla: `carnets`

Carnets digitales emitidos a los socios. Un socio puede tener varios (uno por año).

| Campo | Tipo | Nulo | Clave | Default | Descripción |
|---|---|---|---|---|---|
| `id` | SERIAL | NO | PK | autoincrement | |
| `socio_id` | INT | NO | FK → socios(id) | | ON DELETE CASCADE |
| `anio_vigencia` | INT | NO | | | Año de validez del carnet |
| `fecha_emision` | DATE | NO | | `CURRENT_DATE` | Fecha de emisión |
| `fecha_caducidad` | DATE | SÍ | | | Fecha de caducidad (normalmente 31/12 del año) |
| `estado` | VARCHAR(20) | NO | | `'vigente'` | `'vigente'` \| `'caducado'` \| `'anulado'` |
| `pdf_url` | VARCHAR(500) | SÍ | | | URL del PDF en Supabase Storage |
| `enviado_email` | BOOLEAN | NO | | `FALSE` | Si se ha enviado por email al socio |
| `created_at` | TIMESTAMPTZ | NO | | `NOW()` | |

---

## Tabla: `cuotas`

Recibos de cuotas semestrales de los socios.

| Campo | Tipo | Nulo | Clave | Default | Descripción |
|---|---|---|---|---|---|
| `id` | SERIAL | NO | PK | autoincrement | |
| `socio_id` | INT | NO | FK → socios(id) | | ON DELETE CASCADE |
| `anio` | INT | NO | | | Año del ejercicio |
| `semestre` | INT | NO | | | `1` (junio) \| `2` (diciembre) |
| `importe` | DECIMAL(8,2) | NO | | | Importe en euros (normalmente 25,00 €) |
| `estado` | VARCHAR(20) | NO | | `'pendiente'` | Ver valores más abajo |
| `fecha_cobro` | DATE | SÍ | | | Fecha efectiva de cobro |
| `metodo_pago` | VARCHAR(30) | NO | | `'domiciliacion'` | `'domiciliacion'` \| `'transferencia'` \| `'efectivo'` |
| `referencia_remesa` | VARCHAR(60) | SÍ | | | Referencia de la remesa SEPA |
| `notas` | TEXT | SÍ | | | Notas internas |
| `created_at` | TIMESTAMPTZ | NO | | `NOW()` | |

### Valores de `estado`

| Valor | Descripción |
|---|---|
| `pendiente` | Recibo pendiente de cobro |
| `cobrado` | Cobrado correctamente |
| `devuelto` | Devuelto por el banco |
| `exento` | Exento de pago |

### Índices

| Índice | Campo(s) |
|---|---|
| `idx_cuotas_socio` | `socio_id, anio` |

---

## Notas de diseño

- **Autenticación**: gestionada por Supabase Auth. Los usuarios se vinculan a socios por coincidencia de `email_uma` o `email_otros` con `auth.users.email`. No hay FK explícita entre `auth.users` y `socios`.
- **Cooperantes y avalistas**: los emails de los dos avalistas se guardan en el campo `notas` de `socios` con el formato `AVALISTAS: email1 | email2`.
- **Numeración**: profesores usan `num_socio` (secuencia propia), cooperantes usan `num_cooperante` (secuencia separada). Ambos campos son `UNIQUE` pero admiten `NULL`.
- **email_principal**: campo calculado (`GENERATED ALWAYS AS`) — siempre devuelve el primer email disponible (`email_uma` > `email_otros`). No se puede escribir directamente.
- **Cuota estándar**: 25 € por semestre (50 € anuales). Socios `activo_exento` no generan recibo.
