import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin'
import { NextResponse } from 'next/server'
import { generarCarnetPDF } from '@/lib/carnet-pdf'

export const maxDuration = 300

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const admin = createAdminClient()
  const anio = new Date().getFullYear()

  // Obtener todos los socios activos
  const { data: socios, error } = await admin
    .from('socios')
    .select('id, nombre, apellidos, dni, tipo, num_socio, num_cooperante')
    .in('estado', ['activo', 'activo_exento', 'honorario'])
    .not('num_socio', 'is', null)
    .order('num_socio', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!socios?.length) return NextResponse.json({ generados: 0, errores: [] })

  // Cargar logo una sola vez
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://asprojuma.vercel.app'
  const logoRes = await fetch(`${appUrl}/logo-uma.png`)
  const logoBase64 = `data:image/png;base64,${Buffer.from(await logoRes.arrayBuffer()).toString('base64')}`

  let generados = 0
  const errores: { id: number; nombre: string; motivo: string }[] = []

  for (const socio of socios) {
    try {
      const buffer = await generarCarnetPDF(socio, logoBase64, anio)
      const storagePath = `${socio.id}/${anio}.pdf`

      await admin.storage.from('carnets').upload(storagePath, new Uint8Array(buffer), {
        contentType: 'application/pdf',
        upsert: true,
      })

      const { data: urlData } = admin.storage.from('carnets').getPublicUrl(storagePath)

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
