import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import React from 'react'
import { renderToBuffer, Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import QRCode from 'qrcode'

// Tarjeta vertical: 54mm ancho × 85.6mm alto (CR80 girada)
const W = 54 * 2.835
const H = 85.6 * 2.835

const styles = StyleSheet.create({
  page: {
    width: W,
    height: H,
    backgroundColor: '#a8d4ed',
    padding: 10,
    flexDirection: 'column',
    fontFamily: 'Helvetica',
    position: 'relative',
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: H * 0.45,
    backgroundColor: '#ffffff',
    opacity: 0.85,
  },
  gradientMid: {
    position: 'absolute',
    top: H * 0.2,
    left: 0,
    right: 0,
    height: H * 0.35,
    backgroundColor: '#daeef8',
    opacity: 0.7,
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  logo: { width: 44, height: 44 },
  titleMain: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    letterSpacing: 1,
    textAlign: 'center',
  },
  titleSub: {
    fontSize: 4.5,
    color: '#374151',
    textAlign: 'center',
    marginTop: 1,
  },
  titleUniv: {
    fontSize: 5,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  divider: {
    borderTopWidth: 0.5,
    borderTopColor: '#93c5d8',
    marginHorizontal: 4,
    marginBottom: 6,
  },
  dataSection: {
    paddingHorizontal: 8,
    gap: 5,
    flex: 1,
  },
  dataGroup: { flexDirection: 'column', gap: 1 },
  dataLabel: {
    fontSize: 4,
    fontFamily: 'Helvetica-Bold',
    color: '#4b7a8f',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dataValue: {
    fontSize: 8,
    fontFamily: 'Helvetica-BoldOblique',
    color: '#111827',
  },
  tipoText: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  validoText: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  umaBlock: { flexDirection: 'row' },
  qrCode: { width: 38, height: 38 },
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
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 76, margin: 1 })

  const logoRes = await fetch(`${appUrl}/logo-uma.png`)
  const logoBuffer = await logoRes.arrayBuffer()
  const logoBase64 = `data:image/png;base64,${Buffer.from(logoBuffer).toString('base64')}`

  const pdfDoc = (
    <Document>
      <Page size={[W, H]} style={styles.page}>
        {/* Capas de degradado simulado */}
        <View style={styles.gradientTop} />
        <View style={styles.gradientMid} />
        {/* Cabecera centrada */}
        <View style={styles.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={logoBase64} style={styles.logo} />
          <Text style={styles.titleMain}>ASPROJUMA</Text>
          <Text style={styles.titleSub}>Asociación de Profesores Jubilados de la</Text>
          <Text style={styles.titleUniv}>UNIVERSIDAD DE MÁLAGA</Text>
        </View>

        <View style={styles.divider} />

        {/* Datos */}
        <View style={styles.dataSection}>
          <View style={styles.dataGroup}>
            <Text style={styles.dataLabel}>Nombre</Text>
            <Text style={styles.dataValue}>{socio.nombre}</Text>
          </View>
          <View style={styles.dataGroup}>
            <Text style={styles.dataLabel}>Apellidos</Text>
            <Text style={styles.dataValue}>{socio.apellidos}</Text>
          </View>
          <Text style={styles.tipoText}>{tipoLabel}  Nº {num}</Text>
          <Text style={styles.tipoText}>DNI:  {socio.dni ?? '—'}</Text>
        </View>

        {/* Pie */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.validoText}>Válido {anio}</Text>
            <View style={styles.umaBlock}>
              <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#00a99d' }}>uma</Text>
              <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#007a73' }}>.es</Text>
            </View>
          </View>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={qrDataUrl} style={styles.qrCode} />
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
