'use client'

import { useEffect, useState, useCallback } from 'react'

interface Inscripcion {
  id: number
  estado: 'inscrito' | 'pagado' | 'cancelado'
  fecha_inscripcion: string
  fecha_pago: string | null
  notas: string | null
  socios: {
    num_socio: number | null
    num_cooperante: number | null
    tipo: string
    nombre: string | null
    apellidos: string | null
  }
}

interface Invitado {
  id: number
  nombre: string
  email: string | null
  estado: 'inscrito' | 'pagado' | 'cancelado'
  fecha_inscripcion: string
  fecha_pago: string | null
  precio: number | null
  notas: string | null
  socios: { nombre: string | null; apellidos: string | null } | null
}

const ESTADO_BADGE: Record<string, string> = {
  inscrito:  'bg-yellow-100 text-yellow-800',
  pagado:    'bg-green-100 text-green-800',
  cancelado: 'bg-gray-100 text-gray-500',
}

export function InscripcionesAdmin({ actividadId, precio, precioInvitado }: {
  actividadId: number
  precio: number
  precioInvitado: number | null
}) {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([])
  const [invitados, setInvitados] = useState<Invitado[]>([])
  const [cargando, setCargando] = useState(true)
  const [actualizando, setActualizando] = useState<string | null>(null)

  // Nuevo invitado form
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoEmail, setNuevoEmail] = useState('')
  const [nuevoNotas, setNuevoNotas] = useState('')
  const [añadiendo, setAñadiendo] = useState(false)
  const [mostrarForm, setMostrarForm] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    const [resIns, resInv] = await Promise.all([
      fetch(`/api/admin/actividades/${actividadId}/inscripciones`),
      fetch(`/api/admin/actividades/${actividadId}/invitados`),
    ])
    setInscripciones(await resIns.json())
    setInvitados(await resInv.json())
    setCargando(false)
  }, [actividadId])

  useEffect(() => { cargar() }, [cargar])

  async function marcarSocioPagado(ins: Inscripcion) {
    setActualizando(`s-${ins.id}`)
    await fetch(`/api/admin/actividades/${actividadId}/inscripciones`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inscripcionId: ins.id, estado: 'pagado', fecha_pago: new Date().toISOString().slice(0, 10) }),
    })
    await cargar()
    setActualizando(null)
  }

  async function cancelarSocio(ins: Inscripcion) {
    if (!confirm(`¿Cancelar la inscripción de ${ins.socios.apellidos}, ${ins.socios.nombre}?`)) return
    setActualizando(`s-${ins.id}`)
    await fetch(`/api/admin/actividades/${actividadId}/inscripciones`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inscripcionId: ins.id, estado: 'cancelado' }),
    })
    await cargar()
    setActualizando(null)
  }

  async function marcarInvitadoPagado(inv: Invitado) {
    setActualizando(`i-${inv.id}`)
    await fetch(`/api/admin/actividades/${actividadId}/invitados`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitadoId: inv.id, estado: 'pagado', fecha_pago: new Date().toISOString().slice(0, 10) }),
    })
    await cargar()
    setActualizando(null)
  }

  async function cancelarInvitado(inv: Invitado) {
    if (!confirm(`¿Cancelar la inscripción de ${inv.nombre}?`)) return
    setActualizando(`i-${inv.id}`)
    await fetch(`/api/admin/actividades/${actividadId}/invitados`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitadoId: inv.id, estado: 'cancelado' }),
    })
    await cargar()
    setActualizando(null)
  }

  async function añadirInvitado() {
    if (!nuevoNombre.trim()) return
    setAñadiendo(true)
    await fetch(`/api/admin/actividades/${actividadId}/invitados`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: nuevoNombre,
        email: nuevoEmail || null,
        precio: (precioInvitado ?? precio) || null,
        notas: nuevoNotas || null,
      }),
    })
    setNuevoNombre('')
    setNuevoEmail('')
    setNuevoNotas('')
    setMostrarForm(false)
    setAñadiendo(false)
    await cargar()
  }

  const sociosActivos = inscripciones.filter(i => i.estado !== 'cancelado')
  const invitadosActivos = invitados.filter(i => i.estado !== 'cancelado')
  const totalPersonas = sociosActivos.length + invitadosActivos.length
  const pendientesSocios = sociosActivos.filter(i => i.estado === 'inscrito' && precio > 0).length
  const pendientesInvitados = invitadosActivos.filter(i => i.estado === 'inscrito' && (precioInvitado ?? precio) > 0).length
  const totalPendientes = pendientesSocios + pendientesInvitados

  function numSocio(i: Inscripcion) {
    return i.socios.tipo === 'profesor' ? String(i.socios.num_socio ?? '—') : `C${i.socios.num_cooperante ?? '—'}`
  }

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex gap-6 text-sm">
        <span className="text-gray-700"><strong>{totalPersonas}</strong> personas</span>
        <span className="text-gray-500">{sociosActivos.length} socios · {invitadosActivos.length} invitados</span>
        {totalPendientes > 0 && (
          <span className="text-yellow-700">{totalPendientes} pendiente{totalPendientes !== 1 ? 's' : ''} de pago</span>
        )}
      </div>

      {/* Socios inscritos */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Socios inscritos</h2>
        {cargando ? (
          <p className="text-sm text-gray-400">Cargando…</p>
        ) : inscripciones.length === 0 ? (
          <p className="text-sm text-gray-400">Nadie inscrito aún.</p>
        ) : (
          <div className="space-y-2">
            {inscripciones.map(i => (
              <div key={i.id} className={`flex items-center justify-between border rounded-lg px-3 py-2 ${i.estado === 'cancelado' ? 'border-gray-100 opacity-50' : 'border-gray-200'}`}>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    <span className="text-gray-400 text-xs mr-2">{numSocio(i)}</span>
                    {i.socios.apellidos}, {i.socios.nombre}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(i.fecha_inscripcion).toLocaleDateString('es-ES')}
                    {i.fecha_pago && ` · Pagado ${new Date(i.fecha_pago).toLocaleDateString('es-ES')}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_BADGE[i.estado]}`}>
                    {i.estado}
                  </span>
                  {i.estado === 'inscrito' && precio > 0 && (
                    <button onClick={() => marcarSocioPagado(i)} disabled={actualizando === `s-${i.id}`}
                      className="text-xs text-green-700 hover:text-green-900 font-medium">
                      Marcar pagado
                    </button>
                  )}
                  {i.estado !== 'cancelado' && (
                    <button onClick={() => cancelarSocio(i)} disabled={actualizando === `s-${i.id}`}
                      className="text-xs text-gray-400 hover:text-red-600">
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invitados externos */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Invitados externos</h2>
          <button onClick={() => setMostrarForm(f => !f)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium">
            + Añadir invitado
          </button>
        </div>

        {/* Formulario nuevo invitado */}
        {mostrarForm && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nombre *</label>
                <input value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Email</label>
                <input type="email" value={nuevoEmail} onChange={e => setNuevoEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Notas</label>
              <input value={nuevoNotas} onChange={e => setNuevoNotas(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-2">
              <button onClick={añadirInvitado} disabled={añadiendo || !nuevoNombre.trim()}
                className="bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-50">
                {añadiendo ? 'Añadiendo…' : 'Añadir'}
              </button>
              <button onClick={() => setMostrarForm(false)}
                className="px-4 py-1.5 rounded-lg text-sm border border-gray-300 text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {cargando ? (
          <p className="text-sm text-gray-400">Cargando…</p>
        ) : invitados.length === 0 ? (
          <p className="text-sm text-gray-400">Sin invitados externos.</p>
        ) : (
          <div className="space-y-2">
            {invitados.map(i => (
              <div key={i.id} className={`flex items-center justify-between border rounded-lg px-3 py-2 ${i.estado === 'cancelado' ? 'border-gray-100 opacity-50' : 'border-gray-200'}`}>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {i.nombre}
                    {i.email && <span className="text-gray-400 text-xs ml-2">{i.email}</span>}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(i.fecha_inscripcion).toLocaleDateString('es-ES')}
                    {i.socios && ` · Añadido por ${i.socios.apellidos}, ${i.socios.nombre}`}
                    {i.fecha_pago && ` · Pagado ${new Date(i.fecha_pago).toLocaleDateString('es-ES')}`}
                    {i.precio != null && ` · ${Number(i.precio).toFixed(2)} €`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_BADGE[i.estado]}`}>
                    {i.estado}
                  </span>
                  {i.estado === 'inscrito' && (precioInvitado ?? precio) > 0 && (
                    <button onClick={() => marcarInvitadoPagado(i)} disabled={actualizando === `i-${i.id}`}
                      className="text-xs text-green-700 hover:text-green-900 font-medium">
                      Marcar pagado
                    </button>
                  )}
                  {i.estado !== 'cancelado' && (
                    <button onClick={() => cancelarInvitado(i)} disabled={actualizando === `i-${i.id}`}
                      className="text-xs text-gray-400 hover:text-red-600">
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
