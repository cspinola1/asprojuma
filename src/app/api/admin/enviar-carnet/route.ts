import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isAdmin } from '@/lib/admin'
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { generarCarnetPDF } from '@/lib/carnet-pdf'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { socioId } = await request.json()
  if (!socioId) return NextResponse.json({ error: 'socioId requerido' }, { status: 400 })

  const admin = createAdminClient()
  const { data: socio } = await admin.from('socios').select('*').eq('id', socioId).single()
  if (!socio) return NextResponse.json({ error: 'Socio no encontrado' }, { status: 404 })

  const email = socio.email_principal
  if (!email) return NextResponse.json({ error: 'El socio no tiene email registrado' }, { status: 400 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://asprojuma.vercel.app'
  const logoRes = await fetch(`${appUrl}/logo-uma.png`)
  const logoBase64 = `data:image/png;base64,${Buffer.from(await logoRes.arrayBuffer()).toString('base64')}`

  const anio = new Date().getFullYear()
  const buffer = await generarCarnetPDF(socio, logoBase64, anio)

  // Guardar en Storage y actualizar carnets
  const storagePath = `${socio.id}/${anio}.pdf`
  await admin.storage.from('carnets').upload(storagePath, new Uint8Array(buffer), { contentType: 'application/pdf', upsert: true })
  const { data: urlData } = admin.storage.from('carnets').getPublicUrl(storagePath)
  await admin.from('carnets').upsert(
    { socio_id: socio.id, anio_vigencia: anio, estado: 'vigente', fecha_emision: new Date().toISOString().slice(0, 10), fecha_caducidad: `${anio}-12-31`, pdf_url: urlData.publicUrl, enviado_email: true },
    { onConflict: 'socio_id,anio_vigencia' }
  )

  // Enviar email con Resend
  const num = socio.tipo === 'profesor' ? socio.num_socio : socio.num_cooperante
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error: emailError } = await resend.emails.send({
    from: process.env.RESEND_FROM ?? 'ASPROJUMA <onboarding@resend.dev>',
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
            También puedes descargarlo en cualquier momento desde el portal del socio.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #9ca3af; font-size: 11px; text-align: center; margin: 0;">
            ASPROJUMA · asprojuma@uma.es · Edificio Rectorado, Avda. Cervantes 2, 29016 Málaga
          </p>
        </div>
      </div>
    `,
    attachments: [
      {
        filename: `carnet-asprojuma-${num}-${anio}.pdf`,
        content: buffer.toString('base64'),
      },
    ],
  })

  if (emailError) return NextResponse.json({ error: emailError.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
