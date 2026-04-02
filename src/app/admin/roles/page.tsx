'use client'

import { useEffect, useState } from 'react'

type Rol = 'tesorero' | 'secretario' | 'junta' | 'presidente' | 'admin'

interface AdminRol {
  id: number
  email: string
  nombre: string | null
  rol: Rol
}

const ROLES: { value: Rol; label: string }[] = [
  { value: 'tesorero', label: 'Tesorero' },
  { value: 'secretario', label: 'Secretario' },
  { value: 'junta', label: 'Junta' },
  { value: 'presidente', label: 'Presidente' },
  { value: 'admin', label: 'Admin' },
]

const PERMISOS_LABEL: Record<string, string[]> = {
  tesorero:    ['Dashboard', 'Socios', 'Solicitudes', 'Cuotas', 'Carnets', 'Remesas'],
  secretario:  ['Dashboard', 'Socios', 'Solicitudes', 'Editar socios'],
  junta:       ['Dashboard', 'Socios', 'Actividades'],
  presidente:  ['Dashboard', 'Socios', 'Solicitudes', 'Cuotas', 'Carnets', 'Remesas', 'Editar socios', 'Actividades'],
  admin:       ['Todo'],
}

export default function RolesPage() {
  const [roles, setRoles] = useState<AdminRol[]>([])
  const [cargando, setCargando] = useState(true)
  const [email, setEmail] = useState('')
  const [nombre, setNombre] = useState('')
  const [rol, setRol] = useState<Rol>('secretario')
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState('')

  async function cargar() {
    setCargando(true)
    const res = await fetch('/api/admin/roles')
    const data = await res.json()
    setRoles(data)
    setCargando(false)
  }

  useEffect(() => { cargar() }, [])

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setMsg('')
    const res = await fetch('/api/admin/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, nombre, rol }),
    })
    const data = await res.json()
    if (data.error) { setMsg(data.error) }
    else { setEmail(''); setNombre(''); await cargar() }
    setGuardando(false)
  }

  async function handleEliminar(id: number, emailRol: string) {
    if (!confirm(`¿Eliminar el rol de ${emailRol}?`)) return
    await fetch('/api/admin/roles', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await cargar()
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de roles</h1>
        <p className="text-sm text-gray-500 mt-1">Asigna permisos de acceso al panel de administración.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario añadir */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Asignar rol</h2>
          <form onSubmit={handleGuardar} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="usuario@uma.es"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Nombre (opcional)</label>
              <input
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Nombre y apellidos"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Rol</label>
              <select
                value={rol}
                onChange={e => setRol(e.target.value as Rol)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                Permisos: {PERMISOS_LABEL[rol]?.join(', ')}
              </p>
            </div>
            {msg && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{msg}</p>}
            <button
              type="submit"
              disabled={guardando}
              className="w-full bg-blue-700 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition disabled:opacity-50"
            >
              {guardando ? 'Guardando…' : 'Asignar rol'}
            </button>
          </form>
        </div>

        {/* Lista roles actuales */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Roles asignados</h2>
          {cargando ? (
            <p className="text-sm text-gray-400">Cargando…</p>
          ) : roles.length === 0 ? (
            <p className="text-sm text-gray-400">No hay roles asignados aún.</p>
          ) : (
            <div className="space-y-2">
              {roles.map(r => (
                <div key={r.id} className="flex items-center justify-between border border-gray-100 rounded-lg px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{r.nombre ?? r.email}</p>
                    {r.nombre && <p className="text-xs text-gray-400">{r.email}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full capitalize">
                      {r.rol}
                    </span>
                    <button
                      onClick={() => handleEliminar(r.id, r.email)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabla de permisos */}
      <div className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Tabla de permisos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-2 text-left">Sección</th>
                {ROLES.map(r => <th key={r.value} className="px-4 py-2 text-center">{r.label}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { label: 'Dashboard', permisos: ['tesorero','secretario','junta','presidente','admin'] },
                { label: 'Ver socios', permisos: ['tesorero','secretario','junta','presidente','admin'] },
                { label: 'Solicitudes', permisos: ['tesorero','secretario','presidente','admin'] },
                { label: 'Cuotas', permisos: ['tesorero','presidente','admin'] },
                { label: 'Carnets', permisos: ['tesorero','presidente','admin'] },
                { label: 'Remesas', permisos: ['tesorero','presidente','admin'] },
                { label: 'Editar/eliminar socio', permisos: ['secretario','presidente','admin'] },
                { label: 'Actividades', permisos: ['junta','presidente','admin'] },
                { label: 'Gestión de roles', permisos: ['admin'] },
              ].map(row => (
                <tr key={row.label} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-700">{row.label}</td>
                  {ROLES.map(r => (
                    <td key={r.value} className="px-4 py-2 text-center">
                      {row.permisos.includes(r.value)
                        ? <span className="text-green-600 font-bold">✓</span>
                        : <span className="text-gray-200">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
