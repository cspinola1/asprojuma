'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { crearCuota } from '../actions'

export default function NuevaCuotaPage() {
  const router = useRouter()
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const anioActual = new Date().getFullYear()

  const [form, setForm] = useState({
    socio_id: '',
    anio: anioActual.toString(),
    semestre: '2',
    importe: '25.00',
    estado: 'pendiente',
    fecha_cobro: '',
    metodo_pago: 'domiciliacion',
    referencia_remesa: '',
    notas: '',
  })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.socio_id) { setError('El ID de socio es obligatorio'); return }
    setGuardando(true)
    setError('')
    const result = await crearCuota({
      socio_id: parseInt(form.socio_id),
      anio: parseInt(form.anio),
      semestre: parseInt(form.semestre) as 1 | 2,
      importe: parseFloat(form.importe),
      estado: form.estado as 'pendiente' | 'cobrado' | 'devuelto' | 'exento',
      fecha_cobro: form.fecha_cobro || undefined,
      metodo_pago: form.metodo_pago,
      referencia_remesa: form.referencia_remesa || undefined,
      notas: form.notas || undefined,
    })
    setGuardando(false)
    if (result.error) { setError(result.error); return }
    router.push('/admin/cuotas')
  }

  const campo = (label: string, key: string, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      <input
        type={type}
        value={form[key as keyof typeof form]}
        onChange={set(key)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <Link href="/admin/cuotas" className="text-sm text-blue-600 hover:text-blue-800">
          ← Volver a cuotas
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Nueva cuota</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        {campo('ID del socio *', 'socio_id', 'number', 'Busca el ID en la ficha del socio')}

        <div className="grid grid-cols-2 gap-4">
          {campo('Año', 'anio', 'number')}
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Semestre</label>
            <select value={form.semestre} onChange={set('semestre')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="1">1º semestre</option>
              <option value="2">2º semestre</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {campo('Importe (€)', 'importe', 'number')}
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Estado</label>
            <select value={form.estado} onChange={set('estado')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="pendiente">Pendiente</option>
              <option value="cobrado">Cobrado</option>
              <option value="exento">Exento</option>
              <option value="devuelto">Devuelto</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {campo('Fecha de cobro', 'fecha_cobro', 'date')}
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Método de pago</label>
            <select value={form.metodo_pago} onChange={set('metodo_pago')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="domiciliacion">Domiciliación bancaria</option>
              <option value="transferencia">Transferencia</option>
              <option value="efectivo">Efectivo</option>
            </select>
          </div>
        </div>

        {campo('Referencia remesa', 'referencia_remesa', 'text', 'ASPROJUMA 2025-2')}

        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Notas</label>
          <textarea
            value={form.notas}
            onChange={set('notas')}
            rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-2">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={guardando}
            className="bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Crear cuota'}
          </button>
          <Link href="/admin/cuotas" className="px-5 py-2.5 rounded-lg text-sm border border-gray-300 hover:bg-gray-50 transition">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
