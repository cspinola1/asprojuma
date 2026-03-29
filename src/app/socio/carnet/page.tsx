import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Socio, Carnet, EstadoCarnet } from '@/lib/types'
import QRCode from 'qrcode'

const ESTADO_BADGE: Record<EstadoCarnet, string> = {
  vigente: 'bg-green-100 text-green-800',
  caducado: 'bg-orange-100 text-orange-800',
  anulado: 'bg-red-100 text-red-800',
}

const ESTADO_LABEL: Record<EstadoCarnet, string> = {
  vigente: 'Vigente',
  caducado: 'Caducado',
  anulado: 'Anulado',
}

function CarnetVisual({ socio, carnet, qrDataUrl }: { socio: Socio; carnet?: Carnet; qrDataUrl: string }) {
  const anio = carnet?.anio_vigencia ?? new Date().getFullYear()
  const tipoLabel = socio.tipo === 'profesor'
    ? 'Socio Profesor Jubilado'
    : 'Socio Miembro Cooperante'
  const num = socio.tipo === 'profesor' ? socio.num_socio : socio.num_cooperante

  return (
    <div
      className="w-full max-w-sm rounded-2xl overflow-hidden shadow-xl text-gray-900 flex flex-col"
      style={{ background: 'linear-gradient(160deg, #e8f4fb 0%, #c8e6f5 50%, #a8d4ed 100%)' }}
    >
      {/* Cabecera: logo + título centrados */}
      <div className="flex flex-col items-center gap-3 px-8 pt-8 pb-4">
        <div className="w-28 h-28">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-uma.png"
            alt="Escudo Universidad de Málaga"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 tracking-wide">ASPROJUMA</h2>
          <p className="text-xs text-gray-700 mt-0.5">Asociación de Profesores Jubilados de la</p>
          <p className="text-sm font-bold text-gray-900 tracking-wide">UNIVERSIDAD DE MÁLAGA</p>
        </div>
      </div>

      {/* Separador */}
      <div className="mx-8 border-t border-blue-300/60" />

      {/* Datos del socio */}
      <div className="px-8 py-6 space-y-3">
        <div>
          <p className="text-xs font-bold uppercase text-gray-500 tracking-wider">Nombre</p>
          <p className="text-xl font-bold italic text-gray-900">{socio.nombre}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-gray-500 tracking-wider">Apellidos</p>
          <p className="text-xl font-bold italic text-gray-900">{socio.apellidos}</p>
        </div>
        <div className="pt-1">
          <p className="text-base font-bold text-gray-900">{tipoLabel} Nº {num}</p>
          <p className="text-base font-bold text-gray-900 mt-1">DNI: {socio.dni ?? '—'}</p>
        </div>
      </div>

      {/* Pie: válido + uma.es + QR */}
      <div className="px-8 pb-7 flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900">Válido {anio}</p>
          <p className="text-2xl font-bold mt-1">
            <span style={{ color: '#00a99d' }}>uma</span>
            <span style={{ color: '#007a73' }}>.es</span>
          </p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt="QR verificación" className="w-20 h-20" />
      </div>
    </div>
  )
}

export default async function CarnetPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: socio } = await supabase
    .from('socios')
    .select('*')
    .or(`email_uma.eq.${user.email},email_otros.eq.${user.email}`)
    .single()

  if (!socio) redirect('/socio')

  const { data: carnets } = await supabase
    .from('carnets')
    .select('*')
    .eq('socio_id', socio.id)
    .order('anio_vigencia', { ascending: false })

  const carnetVigente = (carnets ?? []).find((c: Carnet) => c.estado === 'vigente')
  const historial = (carnets ?? []).filter((c: Carnet) => c.estado !== 'vigente')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://asprojuma.vercel.app'
  const qrDataUrl = await QRCode.toDataURL(`${appUrl}/verificar/${socio.id}`, { width: 160, margin: 1 })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/socio" className="text-sm text-blue-600 hover:text-blue-800">
            ← Área del socio
          </Link>
          <form action="/api/auth/logout" method="POST">
            <button className="text-sm text-gray-500 hover:text-red-600">Cerrar sesión</button>
          </form>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi carnet</h1>

        {/* Carnet visual */}
        <div className="flex flex-col items-center mb-8">
          <CarnetVisual socio={socio as Socio} carnet={carnetVigente} qrDataUrl={qrDataUrl} />

          {/* Estado y acciones */}
          <div className="mt-4 flex flex-col items-center gap-3">
            {carnetVigente ? (
              <>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${ESTADO_BADGE[carnetVigente.estado as EstadoCarnet]}`}>
                  {ESTADO_LABEL[carnetVigente.estado as EstadoCarnet]} · {carnetVigente.anio_vigencia}
                </span>
                <a
                  href="/api/carnet"
                  className="bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition"
                >
                  Descargar PDF
                </a>
              </>
            ) : (
              <div className="mt-2 text-center flex flex-col items-center gap-3">
                <p className="text-sm text-gray-500">Aún no tienes un carnet emitido para este año.</p>
                <a
                  href="/api/carnet"
                  className="bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition"
                >
                  Descargar PDF provisional
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Historial */}
        {historial.length > 0 && (
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Carnets anteriores</h2>
            <ul className="divide-y divide-gray-100">
              {historial.map((c: Carnet) => (
                <li key={c.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{c.anio_vigencia}</span>
                    <span className="ml-2 text-xs text-gray-400">
                      Emitido: {new Date(c.fecha_emision).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_BADGE[c.estado]}`}>
                      {ESTADO_LABEL[c.estado]}
                    </span>
                    {c.pdf_url && (
                      <a href={c.pdf_url} target="_blank" rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm">
                        PDF
                      </a>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  )
}
