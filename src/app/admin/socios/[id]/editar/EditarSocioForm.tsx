'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Socio, SocioProfesor, EstadoSocio } from '@/lib/types'
import { editarSocio, EditarSocioData } from './actions'

function Field({
  label, name, value, onChange, type = 'text', disabled = false,
}: {
  label: string; name: string; value: string
  onChange: (v: string) => void; type?: string; disabled?: boolean
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
      />
    </div>
  )
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">{titulo}</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{children}</div>
    </section>
  )
}

const ESTADOS: EstadoSocio[] = ['activo', 'activo_exento', 'baja', 'fallecido', 'honorario', 'pendiente', 'suspendido']
const ESTADO_LABEL: Record<EstadoSocio, string> = {
  activo: 'Activo', activo_exento: 'Exento (>85 años)', baja: 'Baja',
  fallecido: 'Fallecido', honorario: 'Honorario', pendiente: 'Pendiente', suspendido: 'Suspendido',
}

export default function EditarSocioForm({
  socio, profesor,
}: {
  socio: Socio
  profesor: SocioProfesor | null
}) {
  const router = useRouter()
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState<EditarSocioData>({
    apellidos: socio.apellidos ?? '',
    nombre: socio.nombre ?? '',
    dni: socio.dni ?? '',
    fecha_nacimiento: socio.fecha_nacimiento ?? '',
    estado: socio.estado,
    num_socio: socio.num_socio?.toString() ?? '',
    num_cooperante: socio.num_cooperante?.toString() ?? '',
    fecha_ingreso: socio.fecha_ingreso ?? '',
    fecha_baja: socio.fecha_baja ?? '',
    email_uma: socio.email_uma ?? '',
    email_otros: socio.email_otros ?? '',
    tel_movil: socio.tel_movil ?? '',
    tel_fijo: socio.tel_fijo ?? '',
    direccion: socio.direccion ?? '',
    codigo_postal: socio.codigo_postal ?? '',
    localidad: socio.localidad ?? '',
    provincia: socio.provincia ?? '',
    iban: socio.iban ?? '',
    titular_cuenta: socio.titular_cuenta ?? '',
    notas: socio.notas ?? '',
    centro: profesor?.centro ?? '',
    departamento: profesor?.departamento ?? '',
    area_conocimiento: profesor?.area_conocimiento ?? '',
    fecha_jubilacion: profesor?.fecha_jubilacion ?? '',
    categoria: profesor?.categoria ?? '',
  })

  const set = (field: keyof EditarSocioData) => (v: string) =>
    setForm(prev => ({ ...prev, [field]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setError('')
    const result = await editarSocio(socio.id, socio.tipo, form)
    setGuardando(false)
    if (result.error) { setError(result.error); return }
    router.push(`/admin/socios/${socio.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Seccion titulo="Identificación">
        <Field label="Apellidos" name="apellidos" value={form.apellidos} onChange={set('apellidos')} />
        <Field label="Nombre" name="nombre" value={form.nombre} onChange={set('nombre')} />
        <Field label="DNI / NIF" name="dni" value={form.dni} onChange={set('dni')} />
        <Field label="Fecha de nacimiento" name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={set('fecha_nacimiento')} type="date" />
        <div>
          <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Estado</label>
          <select
            value={form.estado}
            onChange={e => set('estado')(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ESTADOS.map(e => <option key={e} value={e}>{ESTADO_LABEL[e]}</option>)}
          </select>
        </div>
        {socio.tipo === 'profesor'
          ? <Field label="Nº socio" name="num_socio" value={form.num_socio} onChange={set('num_socio')} />
          : <Field label="Nº cooperante" name="num_cooperante" value={form.num_cooperante} onChange={set('num_cooperante')} />
        }
        <Field label="Fecha de ingreso" name="fecha_ingreso" value={form.fecha_ingreso} onChange={set('fecha_ingreso')} type="date" />
        <Field label="Fecha de baja" name="fecha_baja" value={form.fecha_baja} onChange={set('fecha_baja')} type="date" />
      </Seccion>

      <Seccion titulo="Contacto">
        <Field label="Email UMA" name="email_uma" value={form.email_uma} onChange={set('email_uma')} />
        <Field label="Otros emails" name="email_otros" value={form.email_otros} onChange={set('email_otros')} />
        <Field label="Teléfono móvil" name="tel_movil" value={form.tel_movil} onChange={set('tel_movil')} />
        <Field label="Teléfono fijo" name="tel_fijo" value={form.tel_fijo} onChange={set('tel_fijo')} />
      </Seccion>

      <Seccion titulo="Dirección">
        <div className="md:col-span-2">
          <Field label="Dirección" name="direccion" value={form.direccion} onChange={set('direccion')} />
        </div>
        <Field label="Código postal" name="codigo_postal" value={form.codigo_postal} onChange={set('codigo_postal')} />
        <Field label="Localidad" name="localidad" value={form.localidad} onChange={set('localidad')} />
        <Field label="Provincia" name="provincia" value={form.provincia} onChange={set('provincia')} />
      </Seccion>

      <Seccion titulo="Domiciliación bancaria">
        <div className="md:col-span-2">
          <Field label="IBAN" name="iban" value={form.iban} onChange={set('iban')} />
        </div>
        <Field label="Titular cuenta" name="titular_cuenta" value={form.titular_cuenta} onChange={set('titular_cuenta')} />
      </Seccion>

      {socio.tipo === 'profesor' && (
        <Seccion titulo="Datos académicos">
          <Field label="Centro / Facultad" name="centro" value={form.centro} onChange={set('centro')} />
          <Field label="Departamento" name="departamento" value={form.departamento} onChange={set('departamento')} />
          <Field label="Área de conocimiento" name="area_conocimiento" value={form.area_conocimiento} onChange={set('area_conocimiento')} />
          <Field label="Fecha jubilación" name="fecha_jubilacion" value={form.fecha_jubilacion} onChange={set('fecha_jubilacion')} type="date" />
          <Field label="Categoría" name="categoria" value={form.categoria} onChange={set('categoria')} />
        </Seccion>
      )}

      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Notas internas</h2>
        <textarea
          value={form.notas}
          onChange={e => set('notas')(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </section>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
      )}

      <div className="flex gap-3 pb-8">
        <button
          type="submit"
          disabled={guardando}
          className="bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition disabled:opacity-50"
        >
          {guardando ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <button
          type="button"
          onClick={() => router.push(`/admin/socios/${socio.id}`)}
          className="px-6 py-2.5 rounded-lg text-sm border border-gray-300 hover:bg-gray-50 transition"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
