import { ImageResponse } from 'next/og'
import QRCode from 'qrcode'
import { readFileSync } from 'fs'
import { join } from 'path'
import React from 'react'

// Tarjeta CR80 a 300dpi: 54mm × 85.6mm
const S = 4  // escala sobre 96dpi base
const W = Math.round(54 * 3.78 * S)    // ~816px
const H = Math.round(85.6 * 3.78 * S) // ~1293px

// Leer fuentes una sola vez al importar el módulo
const fontRegular = readFileSync(join(process.cwd(), 'public/fonts/inter-regular.ttf'))
const fontBold    = readFileSync(join(process.cwd(), 'public/fonts/inter-bold.ttf'))

export interface SocioParaCarnetJPG {
  id: number
  nombre: string | null
  apellidos: string | null
  dni: string | null
  tipo: string
  num_socio: number | null
  num_cooperante: number | null
}

export async function generarCarnetJPG(
  socio: SocioParaCarnetJPG,
  anio: number,
): Promise<Buffer> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://asprojuma.vercel.app'

  const verifyUrl  = `${appUrl}/verificar/${socio.id}`
  const qrDataUrl  = await QRCode.toDataURL(verifyUrl, { width: 80 * S, margin: 1 })

  const logoRes    = await fetch(`${appUrl}/logo-uma.png`)
  const logoBase64 = `data:image/png;base64,${Buffer.from(await logoRes.arrayBuffer()).toString('base64')}`

  const tipoLabel = socio.tipo === 'profesor' ? 'Socio Profesor Jubilado' : 'Socio Miembro Cooperante'
  const num       = socio.tipo === 'profesor' ? socio.num_socio : socio.num_cooperante

  const imageResponse = new ImageResponse(
    React.createElement(
      'div',
      {
        style: {
          width: W, height: H,
          backgroundImage: 'linear-gradient(160deg, #e8f4fb 0%, #c8e6f5 50%, #a8d4ed 100%)',
          display: 'flex', flexDirection: 'column',
          padding: `${14*S}px ${10*S}px ${10*S}px`,
          fontFamily: 'Inter',
        },
      },
      // Cabecera
      React.createElement(
        'div',
        { style: { display: 'flex', flexDirection: 'column', alignItems: 'center' } },
        React.createElement('img', { src: logoBase64, width: 60*S, height: 60*S, alt: '', style: { marginBottom: 5*S } }),
        React.createElement('span', { style: { fontSize: 15*S, fontWeight: 700, color: '#111827', letterSpacing: S } }, 'ASPROJUMA'),
        React.createElement('span', { style: { fontSize: 5.5*S, color: '#374151', marginTop: 3*S, textAlign: 'center' } }, 'Asociación de Profesores Jubilados de la'),
        React.createElement('span', { style: { fontSize: 6*S, fontWeight: 700, color: '#111827', letterSpacing: 0.5*S } }, 'UNIVERSIDAD DE MÁLAGA'),
      ),
      // Divisor
      React.createElement('div', { style: { borderTop: `2px solid #93c5d8`, marginTop: 10*S, marginBottom: 10*S, marginLeft: 8*S, marginRight: 8*S } }),
      // Datos
      React.createElement(
        'div',
        { style: { display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-around', paddingLeft: 8*S, paddingRight: 8*S } },
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column' } },
          React.createElement('span', { style: { fontSize: 5*S, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.8*S } }, 'Nombre'),
          React.createElement('span', { style: { fontSize: 11*S, fontWeight: 700, color: '#111827' } }, socio.nombre),
        ),
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column' } },
          React.createElement('span', { style: { fontSize: 5*S, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.8*S } }, 'Apellidos'),
          React.createElement('span', { style: { fontSize: 11*S, fontWeight: 700, color: '#111827' } }, socio.apellidos),
        ),
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column' } },
          React.createElement('span', { style: { fontSize: 8.5*S, fontWeight: 700, color: '#111827' } }, `${tipoLabel}  Nº ${num}`),
          React.createElement('span', { style: { fontSize: 8.5*S, fontWeight: 700, color: '#111827', marginTop: 3*S } }, `DNI:  ${socio.dni ?? '—'}`),
        ),
      ),
      // Pie
      React.createElement(
        'div',
        { style: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingLeft: 8*S, paddingRight: 8*S, paddingBottom: 8*S } },
        React.createElement('div', { style: { display: 'flex', flexDirection: 'column' } },
          React.createElement('span', { style: { fontSize: 17*S, fontWeight: 700, color: '#111827' } }, `Válido ${anio}`),
          React.createElement('div', { style: { display: 'flex', flexDirection: 'row', marginTop: 3*S } },
            React.createElement('span', { style: { fontSize: 13*S, fontWeight: 700, color: '#00a99d' } }, 'uma'),
            React.createElement('span', { style: { fontSize: 13*S, fontWeight: 700, color: '#007a73' } }, '.es'),
          ),
        ),
        React.createElement('img', { src: qrDataUrl, width: 50*S, height: 50*S, alt: '' }),
      ),
    ),
    {
      width: W,
      height: H,
      fonts: [
        { name: 'Inter', data: fontRegular, weight: 400, style: 'normal' as const },
        { name: 'Inter', data: fontBold,    weight: 700, style: 'normal' as const },
      ],
    }
  )

  const pngBuffer = Buffer.from(await imageResponse.arrayBuffer())
  const sharp = (await import('sharp')).default
  return sharp(pngBuffer).jpeg({ quality: 95 }).toBuffer()
}
