'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function RemesasPage() {
  const anioActual = new Date().getFullYear()
  const [anio, setAnio] = useState(anioActual)
  const [semestre, setSemestre] = useState<1 | 2>(
    new Date().getMonth() < 6 ? 1 : 2
  )
  const [fechaCobro, setFechaCobro] = useState(
    semestre === 1 ? `${anioActual}-06-15` : `${anioActual}-12-15`
  )
  const [importe, setImporte] = useState(25)
  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState('')

  async function handleGenerar() {
    if (!confirm(`¿Generar remesa SEPA para ${anio} semestre ${semestre}?\n\nEsto creará los registros de cuota pendientes y descargará el XML.`)) return
    setGenerando(true)
    setError('')

    try {
      const res = await fetch('/api/admin/remesas/generar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anio, semestre, fechaCobro, importe }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Error al generar la remesa')
        return
      }

      // Descargar el XML
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `remesa-${anio}-S${semestre}.xml`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Error de red. Inténtalo de nuevo.')
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-blue-600 hover:text-blue-800">
          ← Panel admin
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Remesas SEPA</h1>
        <p className="text-sm text-gray-500 mt-1">
          Genera el fichero XML pain.008 para domiciliación bancaria de cuotas.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 max-w-lg">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
          Nueva remesa
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Año</label>
              <input
                type="number"
                value={anio}
                onChange={e => setAnio(Number(e.target.value))}
                min={2024}
                max={2100}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Semestre</label>
              <select
                value={semestre}
                onChange={e => {
                  const s = Number(e.target.value) as 1 | 2
                  setSemestre(s)
                  setFechaCobro(s === 1 ? `${anio}-06-15` : `${anio}-12-15`)
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>1º semestre (junio)</option>
                <option value={2}>2º semestre (diciembre)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Fecha de cobro</label>
              <input
                type="date"
                value={fechaCobro}
                onChange={e => setFechaCobro(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Importe por socio (€)</label>
              <input
                type="number"
                value={importe}
                onChange={e => setImporte(Number(e.target.value))}
                min={0}
                step={0.01}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-800">
            Se incluirán todos los socios con estado <strong>Activo</strong> o <strong>Exento</strong> que tengan IBAN registrado.
            Los socios <strong>Exentos</strong> (mayores de 85 años) no pagan cuota — exclúyelos si es necesario ajustando el listado de socios antes de generar.
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            onClick={handleGenerar}
            disabled={generando}
            className="w-full bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition disabled:opacity-50"
          >
            {generando ? 'Generando XML…' : 'Generar y descargar XML pain.008'}
          </button>
        </div>
      </div>

      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 max-w-lg text-xs text-amber-800">
        <p className="font-semibold mb-1">Configuración requerida</p>
        <p>Para generar remesas es necesario configurar en Vercel las variables de entorno:</p>
        <ul className="mt-1 space-y-0.5 list-disc list-inside">
          <li><code>ASPROJUMA_IAS</code> — Identificador de Acreedor SEPA (p.ej. ES12000GXXXXXXXX)</li>
          <li><code>ASPROJUMA_IBAN</code> — IBAN de la cuenta bancaria de ASPROJUMA</li>
          <li><code>ASPROJUMA_BIC</code> — BIC del banco (opcional)</li>
        </ul>
      </div>
    </div>
  )
}
