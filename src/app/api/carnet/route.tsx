import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'
import QRCode from 'qrcode'

export const runtime = 'nodejs'

// Tarjeta CR80 a 300dpi: 54mm × 85.6mm → 638×1011px
const S = 4  // escala sobre 96dpi base
const W = Math.round(54 * 3.78 * S)   // ~816px
const H = Math.round(85.6 * 3.78 * S) // ~1293px

// Leer fuentes del filesystem (disponible en Vercel Node.js runtime)
const fontRegular = readFileSync(join(process.cwd(), 'public/fonts/inter-regular.ttf'))
const fontBold = readFileSync(join(process.cwd(), 'public/fonts/inter-bold.ttf'))

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
      .select('*')
      .eq('socio_id', socio.id)
      .order('anio_vigencia', { ascending: false })

    const carnetVigente = (carnets ?? []).find((c: { estado: string }) => c.estado === 'vigente')
    const anio = carnetVigente?.anio_vigencia ?? new Date().getFullYear()

    const tipoLabel = socio.tipo === 'profesor' ? 'Socio Profesor Jubilado' : 'Socio Miembro Cooperante'
    const num = socio.tipo === 'profesor' ? socio.num_socio : socio.num_cooperante

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://asprojuma.vercel.app'
    const verifyUrl = `${appUrl}/verificar/${socio.id}`
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 80 * S, margin: 1 })

    const logoRes = await fetch(`${appUrl}/logo-uma.png`)
    const logoBuffer = await logoRes.arrayBuffer()
    const logoBase64 = `data:image/png;base64,${Buffer.from(logoBuffer).toString('base64')}`

    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            width: W,
            height: H,
            backgroundImage: 'linear-gradient(160deg, #e8f4fb 0%, #c8e6f5 50%, #a8d4ed 100%)',
            display: 'flex',
            flexDirection: 'column',
            padding: `${14*S}px ${10*S}px ${10*S}px`,
            fontFamily: 'Inter',
          }}
        >
          {/* Cabecera */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoBase64} width={60*S} height={60*S} alt="" style={{ marginBottom: 5*S }} />
            <span style={{ fontSize: 15*S, fontWeight: 700, color: '#111827', letterSpacing: S }}>ASPROJUMA</span>
            <span style={{ fontSize: 5.5*S, color: '#374151', marginTop: 3*S, textAlign: 'center' }}>Asociación de Profesores Jubilados de la</span>
            <span style={{ fontSize: 6*S, fontWeight: 700, color: '#111827', letterSpacing: 0.5*S }}>UNIVERSIDAD DE MÁLAGA</span>
          </div>

          {/* Divisor */}
          <div style={{ borderTop: `${2}px solid #93c5d8`, marginTop: 10*S, marginBottom: 10*S, marginLeft: 8*S, marginRight: 8*S }} />

          {/* Datos */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-around', paddingLeft: 8*S, paddingRight: 8*S }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 5*S, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.8*S }}>Nombre</span>
              <span style={{ fontSize: 11*S, fontWeight: 700, color: '#111827' }}>{socio.nombre}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 5*S, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.8*S }}>Apellidos</span>
              <span style={{ fontSize: 11*S, fontWeight: 700, color: '#111827' }}>{socio.apellidos}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 8.5*S, fontWeight: 700, color: '#111827' }}>{tipoLabel}  Nº {num}</span>
              <span style={{ fontSize: 8.5*S, fontWeight: 700, color: '#111827', marginTop: 3*S }}>DNI:  {socio.dni ?? '—'}</span>
            </div>
          </div>

          {/* Pie */}
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingLeft: 8*S, paddingRight: 8*S, paddingBottom: 8*S }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 17*S, fontWeight: 700, color: '#111827' }}>Válido {anio}</span>
              <div style={{ display: 'flex', flexDirection: 'row', marginTop: 3*S }}>
                <span style={{ fontSize: 13*S, fontWeight: 700, color: '#00a99d' }}>uma</span>
                <span style={{ fontSize: 13*S, fontWeight: 700, color: '#007a73' }}>.es</span>
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} width={50*S} height={50*S} alt="" />
          </div>
        </div>
      ),
      {
        width: W,
        height: H,
        fonts: [
          { name: 'Inter', data: fontRegular, weight: 400, style: 'normal' },
          { name: 'Inter', data: fontBold, weight: 700, style: 'normal' },
        ],
      }
    )

    const pngBuffer = Buffer.from(await imageResponse.arrayBuffer())

    // Convertir PNG → JPEG con sharp
    const sharp = (await import('sharp')).default
    const jpgBuffer = await sharp(pngBuffer).jpeg({ quality: 95 }).toBuffer()

    // Guardar en Supabase Storage
    try {
      const storagePath = `${socio.id}/${anio}.jpg`
      await admin.storage
        .from('carnets')
        .upload(storagePath, new Uint8Array(jpgBuffer), {
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
