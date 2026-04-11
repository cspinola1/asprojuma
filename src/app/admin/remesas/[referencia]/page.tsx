'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface CuotaRemesa {
  id: number
  socio_id: number
  anio: number
  semestre: number
  importe: number
  estado: string
  fecha_cobro: string | null
  motivo_devolucion: string | null
  socios: {
    num_socio: number | null
    num_cooperante: number | null
    tipo: string
    nombre: string | null
    apellidos: string | null
    iban: string | null
  }
}

const ESTADO_BADGE: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  cobrado: 'bg-green-100 text-green-800',
  devuelto: 'bg-red-100 text-red-800',
}

const MOTIVOS_DEVOLUCION = [
  'MD01-MANDATO NO VÁLIDO',
  'MD06-OPERACIÓN AUTORIZADA',
  'AC06-CUENTA BLOQUEADA',
  'AC04-CUENTA CANCELADA',
  'AM04-FONDOS INSUFICIENTES',
  'MS03-SIN MOTIVO ESPECIFICADO',
  'Otro',
]

export default function RemesaDetallePage() {
  const { referencia } = useParams<{ referencia: string }>()
  const refDecoded = decodeURIComponent(referencia)

  const [cuotas, setCuotas] = useState<CuotaRemesa[]>([])
  const [cargando, setCargando] = useState(true)
  const [marcandoCobradas, setMarcandoCobradas] = useState(false)
  const [devolviendo, setDevolviendo] = useState<number | null>(null)
  const [dandoBaja, setDandoBaja] = useState<number | null>(null)
  const [motivoModal, setMotivoModal] = useState<{ cuotaId: number; nombre: string } | null>(null)
  const [motivo, setMotivo] = useState(MOTIVOS_DEVOLUCION[0])
  const [msg, setMsg] = useState('')

  const cargar = useCallback(async () => {
    setCargando(true)
    const res = await fetch(`/api/admin/remesas/cuotas?ref=${encodeURIComponent(refDecoded)}`)
    const data = await res.json()
    setCuotas((Array.isArray(data) ? data : []) as unknown as CuotaRemesa[])
    setCargando(false)
  }, [refDecoded])

  useEffect(() => { cargar() }, [cargar])

  const pendientes = cuotas.filter(c => c.estado === 'pendiente').length
  const cobradas = cuotas.filter(c => c.estado === 'cobrado').length
  const devueltas = cuotas.filter(c => c.estado === 'devuelto').length
  const totalImporte = cuotas.reduce((s, c) => s + c.importe, 0)

  async function marcarTodasCobradas() {
    if (!confirm(`¿Marcar las ${pendientes} cuotas pendientes como cobradas?`)) return
    setMarcandoCobradas(true)
    setMsg('')
    const res = await fetch('/api/admin/remesas/cobrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referencia: refDecoded }),
    })
    const data = await res.json()
    if (data.error) { setMsg(`Error: ${data.error}`) }
    else { await cargar() }
    setMarcandoCobradas(false)
  }

  async function darDeBaja(socioId: number, nombre: string, motivoDevolucion: string | null) {
    if (!confirm(`¿Dar de baja a ${nombre} por devolución no resuelta?`)) return
    setDandoBaja(socioId)
    const res = await fetch('/api/admin/socios/baja', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ socioId, motivo: motivoDevolucion ?? 'Devolución de cuota no resuelta' }),
    })
    const data = await res.json()
    if (data.error) setMsg(`Error: ${data.error}`)
    else await cargar()
    setDandoBaja(null)
  }

  async function cambiarEstado(cuotaId: number, estado: 'cobrado' | 'devuelto', motivoVal?: string) {
    setDevolviendo(cuotaId)
    const res = await fetch('/api/admin/cuotas/estado', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cuotaId, estado, motivo: motivoVal }),
    })
    const data = await res.json()
    if (data.error) setMsg(`Error: ${data.error}`)
    else await cargar()
    setDevolviendo(null)
    setMotivoModal(null)
  }

  function numSocio(c: CuotaRemesa) {
    return c.socios.tipo === 'profesor'
      ? String(c.socios.num_socio ?? '—')
      : `C${c.socios.num_cooperante ?? '—'}`
  }

  if (cargando) return <div className="text-sm text-gray-500 p-8">Cargando…</div>

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/remesas" className="text-sm text-blue-600 hover:text-blue-800">← Remesas</Link>
        <h1 className="text-xl font-bold text-gray-900 mt-2 font-mono">{refDecoded}</h1>
        <div className="flex gap-4 mt-2 text-sm text-gray-500">
          <span>{cuotas.length} socios</span>
          <span>Total: <strong>{totalImporte.toFixed(2)} €</strong></span>
          <span className="text-green-700">{cobradas} cobradas</span>
          <span className="text-red-600">{devueltas} devueltas</span>
          {pendientes > 0 && <span className="text-yellow-700">{pendientes} pendientes</span>}
        </div>
      </div>

      {msg && <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{msg}</p>}

      {pendientes > 0 && (
        <button
          onClick={marcarTodasCobradas}
          disabled={marcandoCobradas}
          className="mb-4 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
        >
          {marcandoCobradas ? 'Marcando…' : `✓ Marcar ${pendientes} pendiente${pendientes !== 1 ? 's' : ''} como cobrada${pendientes !== 1 ? 's' : ''}`}
        </button>
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Nº</th>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">IBAN</th>
              <th className="px-4 py-3 text-right">Importe</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-left">Motivo devolución</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cuotas.map(c => (
              <tr key={c.id} className={`hover:bg-gray-50 ${c.estado === 'devuelto' ? 'bg-red-50' : ''}`}>
                <td className="px-4 py-3 font-mono text-gray-500">{numSocio(c)}</td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {c.socios.apellidos}, {c.socios.nombre}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.socios.iban ?? '—'}</td>
                <td className="px-4 py-3 text-right tabular-nums">{c.importe.toFixed(2)} €</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_BADGE[c.estado] ?? ''}`}>
                    {c.estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{c.motivo_devolucion ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  {c.estado === 'devuelto' && (
                    <div className="flex flex-col gap-1 items-end">
                      <button
                        onClick={() => cambiarEstado(c.id, 'cobrado')}
                        disabled={devolviendo === c.id}
                        className="text-xs text-green-700 hover:text-green-900 font-medium"
                      >
                        Marcar cobrada
                      </button>
                      <button
                        onClick={() => darDeBaja(c.socio_id, `${c.socios.apellidos}, ${c.socios.nombre}`, c.motivo_devolucion)}
                        disabled={dandoBaja === c.socio_id}
                        className="text-xs text-gray-500 hover:text-red-700 font-medium"
                      >
                        Dar de baja
                      </button>
                    </div>
                  )}
                  {(c.estado === 'cobrado' || c.estado === 'pendiente') && (
                    <button
                      onClick={() => { setMotivoModal({ cuotaId: c.id, nombre: `${c.socios.apellidos}, ${c.socios.nombre}` }); setMotivo(MOTIVOS_DEVOLUCION[0]) }}
                      disabled={devolviendo === c.id}
                      className="text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      Marcar devuelta
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal motivo devolución */}
      {motivoModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-gray-900 mb-1">Registrar devolución</h3>
            <p className="text-sm text-gray-500 mb-4">{motivoModal.nombre}</p>
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Motivo</label>
            <select
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {MOTIVOS_DEVOLUCION.map(m => <option key={m}>{m}</option>)}
            </select>
            <div className="flex gap-3">
              <button
                onClick={() => cambiarEstado(motivoModal.cuotaId, 'devuelto', motivo)}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition"
              >
                Confirmar devolución
              </button>
              <button
                onClick={() => setMotivoModal(null)}
                className="flex-1 border border-gray-300 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
