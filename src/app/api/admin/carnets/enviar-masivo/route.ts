import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { tienePermiso } from '@/lib/roles'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
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

  // Obtener carnets del año actual no enviados, con datos del socio
  const { data: carnets, error } = await admin
    .from('carnets')
    .select('id, socio_id, socios(id, nombre, apellidos, dni, tipo, num_socio, num_cooperante, email_principal, email_uma, email_otros)')
    .eq('anio_vigencia', anio)
    .eq('estado', 'vigente')
    .eq('enviado_email', false)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!carnets?.length) return NextResponse.json({ enviados: 0, errores: [], sinEmail: 0 })

  const resend = new Resend(process.env.RESEND_API_KEY)
  const FROM = process.env.RESEND_FROM ?? 'ASPROJUMA <onboarding@resend.dev>'

  let enviados = 0
  let sinEmail = 0
  const errores: { nombre: string; motivo: string }[] = []

  for (const carnet of carnets) {
    const socio = carnet.socios as unknown as {
      id: number; nombre: string | null; apellidos: string | null
      dni: string | null; tipo: string
      num_socio: number | null; num_cooperante: number | null
      email_principal: string | null; email_uma: string | null; email_otros: string | null
    } | null

    if (!socio) continue

    const email = socio.email_principal ?? socio.email_uma ?? socio.email_otros
    if (!email) { sinEmail++; continue }

    try {
      const jpgBuffer = await generarCarnetJPG(socio, anio)

      // Subir/actualizar en Storage
      const storagePath = `${socio.id}/${anio}.jpg`
      await admin.storage.from('carnets').upload(storagePath, new Uint8Array(jpgBuffer), {
        contentType: 'image/jpeg', upsert: true,
      })
      await admin.storage.from('carnets').remove([`${socio.id}/${anio}.pdf`])
      const { data: urlData } = admin.storage.from('carnets').getPublicUrl(storagePath)

      const num = socio.tipo === 'profesor' ? socio.num_socio : socio.num_cooperante

      await resend.emails.send({
        from: FROM,
        to: email,
        subject: `Tu carnet de socio ASPROJUMA ${anio}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1f2937;">
            <div style="background: #1e3a5f; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 22px; letter-spacing: 2px;">ASPROJUMA</h1>
              <p style="color: #93c5d8; margin: 4px 0 0; font-size: 13px;">Asociación de Profesores Jubilados · UMA</p>
            </div>
            <div style="background: #f9fafb; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
              <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
                Estimado/a <strong>${socio.nombre} ${socio.apellidos}</strong>,
              </p>
              <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
                Adjunto encontrarás tu carnet digital de socio/a de ASPROJUMA válido para el año ${anio}.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
                También puedes descargarlo en cualquier momento desde el portal del socio en
                <a href="${urlData.publicUrl}" style="color: #1e3a5f;">asprojuma.es</a>.
              </p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #9ca3af; font-size: 11px; text-align: center; margin: 0;">
                ASPROJUMA · asprojuma@uma.es · Edificio Rectorado, Avda. Cervantes 2, 29016 Málaga
              </p>
            </div>
          </div>
        `,
        attachments: [{
          filename: `carnet-asprojuma-${num}-${anio}.jpg`,
          content: jpgBuffer.toString('base64'),
        }],
      })

      // Marcar como enviado y actualizar URL
      await admin.from('carnets').update({
        enviado_email: true,
        pdf_url: urlData.publicUrl,
      }).eq('id', carnet.id)

      enviados++
    } catch (e) {
      errores.push({
        nombre: `${socio.apellidos ?? ''}, ${socio.nombre ?? ''}`.trim(),
        motivo: e instanceof Error ? e.message : 'Error desconocido',
      })
    }
  }

  return NextResponse.json({ enviados, errores, sinEmail })
}
