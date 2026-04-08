'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface ActividadFormData {
  titulo: string
  descripcion: string
  fecha_inicio: string
  hora_inicio: string
  fecha_fin: string
  hora_fin: string
  lugar: string
  precio: string
  precio_invitado: string
  plazas: string
  estado: 'borrador' | 'publicada' | 'cancelada'
}

interface Props {
  inicial?: Partial<ActividadFormData> & { id?: number }
  modo: 'nueva' | 'editar'
}

export function ActividadForm({ inicial, modo }: Props) {
  const router = useRouter()
  const [form, setForm] = useState<ActividadFormData>({
    titulo: inicial?.titulo ?? '',
    descripcion: inicial?.descripcion ?? '',
    fecha_inicio: inicial?.fecha_inicio ?? '',
    hora_inicio: inicial?.hora_inicio ?? '',
    fecha_fin: inicial?.fecha_fin ?? '',
    hora_fin: inicial?.hora_fin ?? '',
    lugar: inicial?.lugar ?? '',
    precio: inicial?.precio ?? '0',
    precio_invitado: inicial?.precio_invitado ?? '',
    plazas: inicial?.plazas ?? '',
    estado: inicial?.estado ?? 'publicada',
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  function set(field: keyof ActividadFormData, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setError('')

    const url = modo === 'nueva' ? '/api/admin/actividades' : `/api/admin/actividades/${inicial?.id}`
    const method = modo === 'nueva' ? 'POST' : 'PATCH'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, precio: Number(form.precio), precio_invitado: form.precio_invitado !== '' ? Number(form.precio_invitado) : null, plazas: form.plazas ? Number(form.plazas) : null }),
    })
    const data = await res.json()
    if (data.error) { setError(data.error); setGuardando(false); return }
    router.push('/admin/actividades')
    router.refresh()
  }

  async function handleEliminar() {
    if (!confirm('¿Eliminar esta actividad? Se borrarán también las inscripciones.')) return
    await fetch(`/api/admin/actividades/${inicial?.id}`, { method: 'DELETE' })
    router.push('/admin/actividades')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Información general</h2>

        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Título *</label>
          <input
            type="text" required value={form.titulo} onChange={e => set('titulo', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Descripción</label>
          <textarea
            rows={4} value={form.descripcion} onChange={e => set('descripcion', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Lugar</label>
          <input
            type="text" value={form.lugar} onChange={e => set('lugar', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Fecha y hora</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Fecha inicio *</label>
            <input type="date" required value={form.fecha_inicio} onChange={e => set('fecha_inicio', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Hora inicio</label>
            <input type="time" value={form.hora_inicio} onChange={e => set('hora_inicio', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Fecha fin</label>
            <input type="date" value={form.fecha_fin} onChange={e => set('fecha_fin', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Hora fin</label>
            <input type="time" value={form.hora_fin} onChange={e => set('hora_fin', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Inscripción</h2>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Precio socio (€)</label>
            <input type="number" min="0" step="0.01" value={form.precio} onChange={e => set('precio', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <p className="text-xs text-gray-400 mt-1">0 = gratuita</p>
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Precio invitado (€)</label>
            <input type="number" min="0" step="0.01" value={form.precio_invitado} onChange={e => set('precio_invitado', e.target.value)}
              placeholder="Igual que socio"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Plazas</label>
            <input type="number" min="1" value={form.plazas} onChange={e => set('plazas', e.target.value)}
              placeholder="Hasta completar aforo"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Estado</label>
            <select value={form.estado} onChange={e => set('estado', e.target.value as ActividadFormData['estado'])}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="publicada">Publicada</option>
              <option value="borrador">Borrador</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={guardando}
          className="flex-1 bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition disabled:opacity-50">
          {guardando ? 'Guardando…' : modo === 'nueva' ? 'Crear actividad' : 'Guardar cambios'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-6 border border-gray-300 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition">
          Cancelar
        </button>
        {modo === 'editar' && (
          <button type="button" onClick={handleEliminar}
            className="px-4 border border-red-200 text-red-600 py-2.5 rounded-lg text-sm hover:bg-red-50 transition">
            Eliminar
          </button>
        )}
      </div>
    </form>
  )
}
