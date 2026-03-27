import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import React from 'react'
import { renderToBuffer, Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import QRCode from 'qrcode'

const styles = StyleSheet.create({
  page: {
    width: 85.6 * 2.835,  // 85.6mm en puntos (tamaño tarjeta CR80)
    height: 54 * 2.835,   // 54mm en puntos
    backgroundColor: '#c8e6f5',
    padding: 10,
    flexDirection: 'column',
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  logo: {
    width: 40,
    height: 40,
  },
  titleBlock: {
    flexDirection: 'column',
  },
  titleMain: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    letterSpacing: 1,
  },
  titleSub: {
    fontSize: 5,
    color: '#374151',
    marginTop: 1,
  },
  titleUniv: {
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    letterSpacing: 0.5,
  },
  body: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    flex: 1,
  },
  dataBlock: {
    flexDirection: 'column',
    gap: 2,
  },
  dataRow: {
    flexDirection: 'row',
    fontSize: 6,
  },
  dataLabel: {
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    textTransform: 'uppercase',
  },
  dataValue: {
    fontFamily: 'Helvetica-BoldOblique',
    color: '#111827',
  },
  tipoText: {
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginTop: 4,
  },
  rightBlock: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
  },
  validoText: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  umaText: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  qrCode: {
    width: 36,
    height: 36,
  },
})

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: socio } = await supabase
    .from('socios')
    .select('*')
    .or(`email_uma.eq.${user.email},email_otros.eq.${user.email}`)
    .single()

  if (!socio) return NextResponse.json({ error: 'Socio no encontrado' }, { status: 404 })

  const { data: carnets } = await supabase
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
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 72, margin: 1 })

  // Leer logo como base64
  const logoPath = `${process.cwd()}/public/logo-uma.png`
  const fs = await import('fs')
  const logoBuffer = fs.readFileSync(logoPath)
  const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`

  const pdfDoc = (
    <Document>
      <Page size={[85.6 * 2.835, 54 * 2.835]} style={styles.page}>
        {/* Cabecera */}
        <View style={styles.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={logoBase64} style={styles.logo} />
          <View style={styles.titleBlock}>
            <Text style={styles.titleMain}>ASPROJUMA</Text>
            <Text style={styles.titleSub}>Asociación de Profesores Jubilados de la</Text>
            <Text style={styles.titleUniv}>UNIVERSIDAD DE MÁLAGA</Text>
          </View>
        </View>

        {/* Cuerpo */}
        <View style={styles.body}>
          <View style={styles.dataBlock}>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Nombre: </Text>
              <Text style={styles.dataValue}>{socio.nombre}</Text>
            </View>
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Apellidos: </Text>
              <Text style={styles.dataValue}>{socio.apellidos}</Text>
            </View>
            <Text style={styles.tipoText}>{tipoLabel}  Nº {num}</Text>
            <Text style={styles.tipoText}>DNI:  {socio.dni ?? '—'}</Text>
          </View>

          <View style={styles.rightBlock}>
            <Text style={styles.validoText}>Válido {anio}</Text>
            <Text style={styles.umaText}>
              <Text style={{ color: '#00a99d' }}>uma</Text>
              <Text style={{ color: '#007a73' }}>.es</Text>
            </Text>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={qrDataUrl} style={styles.qrCode} />
          </View>
        </View>
      </Page>
    </Document>
  )

  const buffer = await renderToBuffer(pdfDoc)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="carnet-asprojuma-${num}.pdf"`,
    },
  })
}
