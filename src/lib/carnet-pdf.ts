import { renderToBuffer, Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import QRCode from 'qrcode'
import React from 'react'

const W = 54 * 2.835
const H = 85.6 * 2.835

const styles = StyleSheet.create({
  page: { width: W, height: H, backgroundColor: '#c8e6f5', padding: 10, flexDirection: 'column', fontFamily: 'Helvetica' },
  header: { flexDirection: 'column', alignItems: 'center', gap: 4, marginBottom: 6 },
  logo: { width: 44, height: 44 },
  titleMain: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#111827', letterSpacing: 1, textAlign: 'center' },
  titleSub: { fontSize: 4.5, color: '#374151', textAlign: 'center', marginTop: 1 },
  titleUniv: { fontSize: 5, fontFamily: 'Helvetica-Bold', color: '#111827', letterSpacing: 0.5, textAlign: 'center' },
  divider: { borderTopWidth: 0.5, borderTopColor: '#93c5d8', marginHorizontal: 4, marginBottom: 6 },
  dataSection: { paddingHorizontal: 8, gap: 5, flex: 1 },
  dataGroup: { flexDirection: 'column', gap: 1 },
  dataLabel: { fontSize: 4, fontFamily: 'Helvetica-Bold', color: '#4b7a8f', textTransform: 'uppercase', letterSpacing: 0.5 },
  dataValue: { fontSize: 8, fontFamily: 'Helvetica-BoldOblique', color: '#111827' },
  tipoText: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: '#111827', marginTop: 4 },
  footer: { paddingHorizontal: 8, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  validoText: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#111827' },
  qrCode: { width: 38, height: 38 },
})

export interface SocioParaCarnet {
  id: number
  nombre: string | null
  apellidos: string | null
  dni: string | null
  tipo: string
  num_socio: number | null
  num_cooperante: number | null
}

export async function generarCarnetPDF(
  socio: SocioParaCarnet,
  logoBase64: string,
  anio: number,
): Promise<Buffer> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://asprojuma.vercel.app'
  const verifyUrl = `${appUrl}/verificar/${socio.id}`
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 76, margin: 1 })

  const tipoLabel = socio.tipo === 'profesor' ? 'Socio Profesor Jubilado' : 'Socio Miembro Cooperante'
  const num = socio.tipo === 'profesor' ? socio.num_socio : socio.num_cooperante

  const pdfDoc = React.createElement(Document, null,
    React.createElement(Page, { size: [W, H], style: styles.page },
      React.createElement(View, { style: styles.header },
        React.createElement(Image, { src: logoBase64, style: styles.logo }),
        React.createElement(Text, { style: styles.titleMain }, 'ASPROJUMA'),
        React.createElement(Text, { style: styles.titleSub }, 'Asociación de Profesores Jubilados de la'),
        React.createElement(Text, { style: styles.titleUniv }, 'UNIVERSIDAD DE MÁLAGA'),
      ),
      React.createElement(View, { style: styles.divider }),
      React.createElement(View, { style: styles.dataSection },
        React.createElement(View, { style: styles.dataGroup },
          React.createElement(Text, { style: styles.dataLabel }, 'Nombre'),
          React.createElement(Text, { style: styles.dataValue }, socio.nombre ?? ''),
        ),
        React.createElement(View, { style: styles.dataGroup },
          React.createElement(Text, { style: styles.dataLabel }, 'Apellidos'),
          React.createElement(Text, { style: styles.dataValue }, socio.apellidos ?? ''),
        ),
        React.createElement(Text, { style: styles.tipoText }, `${tipoLabel}  Nº ${num}`),
        React.createElement(Text, { style: styles.tipoText }, `DNI:  ${socio.dni ?? '—'}`),
      ),
      React.createElement(View, { style: styles.footer },
        React.createElement(View, null,
          React.createElement(Text, { style: styles.validoText }, `Válido ${anio}`),
          React.createElement(View, { style: { flexDirection: 'row' } },
            React.createElement(Text, { style: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#00a99d' } }, 'uma'),
            React.createElement(Text, { style: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#007a73' } }, '.es'),
          ),
        ),
        React.createElement(Image, { src: qrDataUrl, style: styles.qrCode }),
      ),
    )
  )

  return Buffer.from(await renderToBuffer(pdfDoc))
}
