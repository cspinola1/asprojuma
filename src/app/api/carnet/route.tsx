import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ImageResponse } from 'next/og'
import { readFileSync } from 'fs'
import { join } from 'path'
import QRCode from 'qrcode'

export const runtime = 'nodejs'

// Tarjeta vertical CR80: 54mm × 85.6mm a 96dpi → ×3.78 para px
const W = Math.round(54 * 3.78)   // 204px
const H = Math.round(85.6 * 3.78) // 323px

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
      .select('*')
      .or(`email_uma.eq.${user.email},email_otros.eq.${user.email}`)
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
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 80, margin: 1 })

    const logoRes = await fetch(`${appUrl}/logo-uma.png`)
    const logoBuffer = await logoRes.arrayBuffer()
    const logoBase64 = `data:image/png;base64,${Buffer.from(logoBuffer).toString('base64')}`

    const imageResponse = new ImageResponse(
      (
        <div
          style={{
            width: W,
            height: H,
            backgroundColor: '#c8e6f5',
            display: 'flex',
            flexDirection: 'column',
            padding: '12px 10px 10px',
            fontFamily: 'Inter',
          }}
        >
          {/* Cabecera */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 8 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoBase64} width={48} height={48} alt="" style={{ marginBottom: 4 }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', letterSpacing: 1 }}>ASPROJUMA</span>
            <span style={{ fontSize: 5.5, color: '#374151', marginTop: 2, textAlign: 'center' }}>Asociación de Profesores Jubilados de la</span>
            <span style={{ fontSize: 6, fontWeight: 700, color: '#111827', letterSpacing: 0.5 }}>UNIVERSIDAD DE MÁLAGA</span>
          </div>

          {/* Divisor */}
          <div style={{ borderTop: '0.5px solid #93c5d8', marginBottom: 8 }} />

          {/* Datos */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingLeft: 8, paddingRight: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 6 }}>
              <span style={{ fontSize: 5, fontWeight: 700, color: '#4b7a8f', textTransform: 'uppercase', letterSpacing: 0.5 }}>Nombre</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#111827', fontStyle: 'italic' }}>{socio.nombre}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 6 }}>
              <span style={{ fontSize: 5, fontWeight: 700, color: '#4b7a8f', textTransform: 'uppercase', letterSpacing: 0.5 }}>Apellidos</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#111827', fontStyle: 'italic' }}>{socio.apellidos}</span>
            </div>
            <span style={{ fontSize: 7.5, fontWeight: 700, color: '#111827', marginTop: 4 }}>{tipoLabel}  Nº {num}</span>
            <span style={{ fontSize: 7.5, fontWeight: 700, color: '#111827', marginTop: 4 }}>DNI:  {socio.dni ?? '—'}</span>
          </div>

          {/* Pie */}
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingLeft: 8, paddingRight: 8, paddingBottom: 4 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Válido {anio}</span>
              <div style={{ display: 'flex', flexDirection: 'row' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#00a99d' }}>uma</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#007a73' }}>.es</span>
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} width={42} height={42} alt="" />
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
