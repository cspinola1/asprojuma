import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generarCarnetJPG } from '@/lib/carnet-jpg'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const admin = createAdminClient()
    const { data: socios } = await admin
      .from('socios')
      .select('id, tipo, nombre, apellidos, dni, num_socio, num_cooperante')
      .or(`email_uma.ilike.${user.email},email_otros.ilike.${user.email}`)
      .order('id', { ascending: true })
      .limit(1)
    const socio = socios?.[0] ?? null

    if (!socio) return NextResponse.json({ error: 'Socio no encontrado' }, { status: 404 })

    const { data: carnets } = await admin
      .from('carnets')
      .select('anio_vigencia, estado')
      .eq('socio_id', socio.id)
      .order('anio_vigencia', { ascending: false })

    const carnetVigente = (carnets ?? []).find((c: { estado: string }) => c.estado === 'vigente')
    const anio = carnetVigente?.anio_vigencia ?? new Date().getFullYear()

    const num = socio.tipo === 'profesor' ? socio.num_socio : socio.num_cooperante
    const jpgBuffer = await generarCarnetJPG(socio, anio)

    // Guardar en Storage (sin bloquear la descarga si falla)
    try {
      const storagePath = `${socio.id}/${anio}.jpg`
      await admin.storage.from('carnets').upload(storagePath, new Uint8Array(jpgBuffer), {
        contentType: 'image/jpeg',
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
        },
        { onConflict: 'socio_id,anio_vigencia' },
      )
      // Borrar PDF antiguo si existe
      await admin.storage.from('carnets').remove([`${socio.id}/${anio}.pdf`])
    } catch {
      // No bloquear la descarga si falla el guardado
    }

    return new NextResponse(new Uint8Array(jpgBuffer), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': `attachment; filename="carnet-asprojuma-${num}.jpg"`,
      },
    })
  } catch (err) {
    console.error('[carnet]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
