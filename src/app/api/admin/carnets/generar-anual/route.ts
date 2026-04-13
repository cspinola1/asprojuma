import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { tienePermiso } from '@/lib/roles'
import { NextResponse } from 'next/server'
import { generarCarnetJPG } from '@/lib/carnet-jpg'

export const maxDuration = 300
export const runtime = 'nodejs'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !await tienePermiso(user, 'carnets')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const admin = createAdminClient()
  const anio = new Date().getFullYear()

  const { data: socios, error } = await admin
    .from('socios')
    .select('id, nombre, apellidos, dni, tipo, num_socio, num_cooperante')
    .in('estado', ['activo', 'activo_exento', 'honorario'])
    .not('num_socio', 'is', null)
    .order('num_socio', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!socios?.length) return NextResponse.json({ generados: 0, errores: [] })

  let generados = 0
  const errores: { id: number; nombre: string; motivo: string }[] = []

  for (const socio of socios) {
    try {
      const jpgBuffer = await generarCarnetJPG(socio, anio)
      const storagePath = `${socio.id}/${anio}.jpg`

      // Subir JPG
      await admin.storage.from('carnets').upload(storagePath, new Uint8Array(jpgBuffer), {
        contentType: 'image/jpeg',
        upsert: true,
      })

      const { data: urlData } = admin.storage.from('carnets').getPublicUrl(storagePath)

      // Actualizar BD con URL del JPG
      await admin.from('carnets').upsert(
        {
          socio_id: socio.id,
          anio_vigencia: anio,
          estado: 'vigente',
          fecha_emision: new Date().toISOString().slice(0, 10),
          fecha_caducidad: `${anio}-12-31`,
          pdf_url: urlData.publicUrl,
          enviado_email: false,
        },
        { onConflict: 'socio_id,anio_vigencia' },
      )

      // Borrar PDF antiguo si existe
      await admin.storage.from('carnets').remove([`${socio.id}/${anio}.pdf`])

      generados++
    } catch (e) {
      errores.push({
        id: socio.id,
        nombre: `${socio.apellidos ?? ''}, ${socio.nombre ?? ''}`.trim(),
        motivo: e instanceof Error ? e.message : 'Error desconocido',
      })
    }
  }

  return NextResponse.json({ generados, errores })
}
