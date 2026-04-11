'use client'

import { useState } from 'react'
import Link from 'next/link'

export interface RemesaResumen {
  referencia_remesa: string
  anio: number
  semestre: number
  total: number
  cobradas: number
  devueltas: number
  pendientes: number
  importe_total: number
}

export default function RemesasClient({ initialRemesas }: { initialRemesas: RemesaResumen[] }) {
  const anioActual = new Date().getFullYear()
  const [anio, setAnio] = useState(anioActual)
  const [semestre, setSemestre] = useState<1 | 2>(new Date().getMonth() < 6 ? 1 : 2)
  const [fechaCobro, setFechaCobro] = useState(
    new Date().getMonth() < 6 ? `${anioActual}-06-15` : `${anioActual}-12-15`
  )
  const [importe, setImporte] = useState(25)
  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState('')
  const remesas = initialRemesas

  async function handleGenerar(formato: 'xml' | 'csv') {
    if (!confirm(`¿Generar remesa SEPA ${formato.toUpperCase()} para ${anio} semestre ${semestre}?\n\nEsto creará los registros de cuota pendientes.`)) return
    setGenerando(true)
    setError('')
    try {
      const res = await fetch('/api/admin/remesas/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anio, semestre, fechaCobro, importe, formato }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Error al generar la remesa')
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `remesa-${anio}-S${semestre}.${formato}`
      a.click()
      URL.revokeObjectURL(url)
      window.location.reload()
    } catch {
      setError('Error de red. Inténtalo de nuevo.')
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Remesas SEPA</h1>
        <p className="text-sm text-gray-500 mt-1">Gestión de domiciliaciones bancarias de cuotas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Nueva remesa */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Nueva remesa</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Año</label>
                <input type="number" value={anio} onChange={e => setAnio(Number(e.target.value))} min={2024} max={2100}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Semestre</label>
                <select value={semestre} onChange={e => { const s = Number(e.target.value) as 1 | 2; setSemestre(s); setFechaCobro(s === 1 ? `${anio}-06-15` : `${anio}-12-15`) }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value={1}>1º semestre (junio)</option>
                  <option value={2}>2º semestre (diciembre)</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Fecha de cobro</label>
                <input type="date" value={fechaCobro} onChange={e => setFechaCobro(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Importe (€)</label>
                <input type="number" value={importe} onChange={e => setImporte(Number(e.target.value))} min={0} step={0.01}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

            <div className="flex gap-3">
              <button onClick={() => handleGenerar('xml')} disabled={generando}
                className="flex-1 bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition disabled:opacity-50">
                {generando ? 'Generando…' : 'Descargar XML pain.008'}
              </button>
              <button onClick={() => handleGenerar('csv')} disabled={generando}
                className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200 transition disabled:opacity-50">
                Descargar CSV
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
              Solo socios con estado <strong>Activo</strong> e IBAN registrado. Los exentos (&gt;85 años) no se incluyen.
            </div>
          </div>
        </div>

        {/* Historial */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Historial de remesas</h2>
          {remesas.length === 0 ? (
            <p className="text-sm text-gray-400">No hay remesas generadas aún.</p>
          ) : (
            <div className="space-y-2">
              {remesas.map(r => (
                <Link
                  key={r.referencia_remesa}
                  href={`/admin/remesas/${encodeURIComponent(r.referencia_remesa)}`}
                  className="block border border-gray-100 rounded-lg px-4 py-3 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {r.anio} · Semestre {r.semestre}
                      </p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{r.referencia_remesa}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{r.importe_total.toFixed(2)} €</p>
                      <div className="flex gap-2 text-xs mt-0.5 justify-end">
                        <span className="text-green-700">{r.cobradas}✓</span>
                        {r.devueltas > 0 && <span className="text-red-600">{r.devueltas}✗</span>}
                        {r.pendientes > 0 && <span className="text-yellow-700">{r.pendientes}⏳</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 max-w-lg text-xs text-amber-800">
        <p className="font-semibold mb-1">Variables de entorno requeridas</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li><code>ASPROJUMA_IAS</code> — Identificador de Acreedor SEPA</li>
          <li><code>ASPROJUMA_IBAN</code> — IBAN cuenta ASPROJUMA</li>
          <li><code>ASPROJUMA_BIC</code> — BIC del banco (opcional)</li>
        </ul>
      </div>
    </div>
  )
}
