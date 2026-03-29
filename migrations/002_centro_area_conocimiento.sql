-- ================================================================
-- Migración 002: centro → socios_profesores, titulacion → area_conocimiento
-- Ejecutar en Supabase > SQL Editor > New query > Run
-- ================================================================

-- 1. Renombrar titulacion → area_conocimiento en socios_profesores
ALTER TABLE socios_profesores
  RENAME COLUMN titulacion TO area_conocimiento;

-- 2. Añadir campo centro a socios_profesores
ALTER TABLE socios_profesores
  ADD COLUMN IF NOT EXISTS centro VARCHAR(200);

-- 3. Copiar datos de socios.centro → socios_profesores.centro
UPDATE socios_profesores sp
SET centro = s.centro
FROM socios s
WHERE sp.socio_id = s.id
  AND s.centro IS NOT NULL;

-- 4. Eliminar campo centro de socios
ALTER TABLE socios
  DROP COLUMN IF EXISTS centro;
