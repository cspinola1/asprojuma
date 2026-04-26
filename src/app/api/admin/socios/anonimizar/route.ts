import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { tienePermiso } from '@/lib/roles'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !await tienePermiso(user, 'editar_socio')) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { socioId } = await request.json()
  if (!socioId) return NextResponse.json({ error: 'socioId requerido' }, { status: 400 })

  const admin = createAdminClient()

  // Solo se puede anonimizar socios de baja o fallecidos
  const { data: socio } = await admin
    .from('socios')
    .select('estado, tipo, datos_anonimizados')
    .eq('id', socioId)
    .single()

  if (!socio) return NextResponse.json({ error: 'Socio no encontrado' }, { status: 404 })
  if (socio.datos_anonimizados) return NextResponse.json({ error: 'Los datos ya han sido anonimizados' }, { status: 400 })
  if (!['baja', 'fallecido'].includes(socio.estado)) {
    return NextResponse.json({ error: 'Solo se pueden anonimizar socios de baja o fallecidos' }, { status: 400 })
  }

  // Anonimizar datos personales en la tabla socios
  const { error: errSocio } = await admin
    .from('socios')
    .update({
      nombre: 'DATOS',
      apellidos: 'ANONIMIZADOS',
      dni: `RGPD-${socioId}`,
      fecha_nacimiento: null,
      email_uma: null,
      email_otros: null,
      tel_movil: null,
      tel_fijo: null,
      direccion: null,
      codigo_postal: null,
      localidad: null,
      provincia: null,
      iban: null,
      titular_cuenta: null,
      notas: null,
      datos_anonimizados: true,
    })
    .eq('id', socioId)

  if (errSocio) return NextResponse.json({ error: errSocio.message }, { status: 500 })

  // Anonimizar datos específicos según tipo
  if (socio.tipo === 'profesor') {
    await admin
      .from('socios_profesores')
      .update({ departamento: null, area_conocimiento: null, categoria: null })
      .eq('socio_id', socioId)
  } else {
    await admin
      .from('socios_cooperantes')
      .update({ estudios: null, aficiones: null, descripcion_relacion: null })
      .eq('socio_id', socioId)
  }

  return NextResponse.json({ ok: true })
}
