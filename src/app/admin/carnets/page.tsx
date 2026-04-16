'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Resultado {
  generados: number
  errores: { id: number; nombre: string; motivo: string }[]
}

interface ResultadoEnvio {
  enviados: number
  sinEmail: number
  errores: { nombre: string; motivo: string }[]
}

export default function CarnetesAdminPage() {
  const [estadoGen, setEstadoGen] = useState<'idle' | 'generando' | 'ok' | 'error'>('idle')
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [msgErrorGen, setMsgErrorGen] = useState('')

  const [estadoEnvio, setEstadoEnvio] = useState<'idle' | 'enviando' | 'ok' | 'error'>('idle')
  const [resultadoEnvio, setResultadoEnvio] = useState<ResultadoEnvio | null>(null)
  const [msgErrorEnvio, setMsgErrorEnvio] = useState('')

  const anio = new Date().getFullYear()

  async function handleGenerar() {
    if (!confirm(`¿Generar carnets ${anio} para todos los socios activos? Esta operación puede tardar varios minutos.`)) return
    setEstadoGen('generando')
    setResultado(null)
    setMsgErrorGen('')

    try {
      const res = await fetch('/api/admin/carnets/generar-anual', { method: 'POST' })
      const data = await res.json()
      if (data.error) { setMsgErrorGen(data.error); setEstadoGen('error') }
      else { setResultado(data); setEstadoGen('ok') }
    } catch {
      setMsgErrorGen('Error de red. Inténtalo de nuevo.')
      setEstadoGen('error')
    }
  }

  async function handleEnviar() {
    if (!confirm(`¿Enviar por email los carnets ${anio} a todos los socios que aún no lo han recibido?`)) return
    setEstadoEnvio('enviando')
    setResultadoEnvio(null)
    setMsgErrorEnvio('')

    try {
      const res = await fetch('/api/admin/carnets/enviar-masivo', { method: 'POST' })
      const data = await res.json()
      if (data.error) { setMsgErrorEnvio(data.error); setEstadoEnvio('error') }
      else { setResultadoEnvio(data); setEstadoEnvio('ok') }
    } catch {
      setMsgErrorEnvio('Error de red. Inténtalo de nuevo.')
      setEstadoEnvio('error')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-blue-600 hover:text-blue-800">
          ← Panel admin
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Carnets {anio}</h1>
        <p className="text-sm text-gray-500 mt-1">
          Genera y distribuye los carnets digitales del año en curso.
        </p>
      </div>

      <div className="space-y-6 max-w-xl">
        {/* Paso 1: Generar */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-blue-700 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">1</span>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Generar carnets en JPG</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Se generarán los carnets en formato JPG para todos los socios con estado <strong>Activo</strong>,{' '}
            <strong>Exento</strong> u <strong>Honorario</strong> y se guardarán en el almacenamiento.
            Los socios podrán descargarlos desde su área privada.
          </p>
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
            Esta operación puede tardar 2-4 minutos. No cierres la página.
          </p>

          <button
            onClick={handleGenerar}
            disabled={estadoGen === 'generando'}
            className="bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition disabled:opacity-50"
          >
            {estadoGen === 'generando' ? 'Generando carnets… por favor espera' : `Generar carnets ${anio}`}
          </button>

          {estadoGen === 'generando' && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
              <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Procesando socios…
            </div>
          )}
          {estadoGen === 'error' && (
            <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{msgErrorGen}</p>
          )}
          {estadoGen === 'ok' && resultado && (
            <div className="mt-4 space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800">
                ✓ {resultado.generados} carnet{resultado.generados !== 1 ? 's' : ''} generado{resultado.generados !== 1 ? 's' : ''} correctamente.
              </div>
              {resultado.errores.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <p className="text-sm font-medium text-red-700 mb-2">{resultado.errores.length} error{resultado.errores.length !== 1 ? 'es' : ''}:</p>
                  <ul className="text-xs text-red-600 space-y-1">
                    {resultado.errores.map(e => (
                      <li key={e.id}><span className="font-medium">{e.nombre}</span> — {e.motivo}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Paso 2: Enviar */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-blue-700 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">2</span>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Enviar carnets por email</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Envía por email el carnet {anio} a todos los socios que aún no lo han recibido.
            Solo se envían los carnets con <strong>enviado_email = No</strong>.
          </p>
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
            Esta operación puede tardar varios minutos. No cierres la página.
          </p>

          <button
            onClick={handleEnviar}
            disabled={estadoEnvio === 'enviando'}
            className="bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-green-800 transition disabled:opacity-50"
          >
            {estadoEnvio === 'enviando' ? 'Enviando carnets… por favor espera' : `Enviar carnets ${anio} por email`}
          </button>

          {estadoEnvio === 'enviando' && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
              <svg className="animate-spin h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Enviando emails…
            </div>
          )}
          {estadoEnvio === 'error' && (
            <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{msgErrorEnvio}</p>
          )}
          {estadoEnvio === 'ok' && resultadoEnvio && (
            <div className="mt-4 space-y-3">
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800">
                ✓ {resultadoEnvio.enviados} carnet{resultadoEnvio.enviados !== 1 ? 's' : ''} enviado{resultadoEnvio.enviados !== 1 ? 's' : ''} correctamente.
                {resultadoEnvio.sinEmail > 0 && (
                  <span className="block mt-1 text-amber-700">
                    ⚠ {resultadoEnvio.sinEmail} socio{resultadoEnvio.sinEmail !== 1 ? 's' : ''} sin email registrado (omitido{resultadoEnvio.sinEmail !== 1 ? 's' : ''}).
                  </span>
                )}
              </div>
              {resultadoEnvio.errores.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <p className="text-sm font-medium text-red-700 mb-2">{resultadoEnvio.errores.length} error{resultadoEnvio.errores.length !== 1 ? 'es' : ''}:</p>
                  <ul className="text-xs text-red-600 space-y-1">
                    {resultadoEnvio.errores.map((e, i) => (
                      <li key={i}><span className="font-medium">{e.nombre}</span> — {e.motivo}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
