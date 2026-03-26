'use client'

import { useState } from 'react'
import { Socio } from '@/lib/types'
import { actualizarPerfil, PerfilFormData } from './actions'

function Campo({ label, valor }: { label: string; valor?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-900 font-medium">{valor || <span className="text-gray-400 font-normal">—</span>}</dd>
    </div>
  )
}

function InputField({
  label, name, value, onChange, placeholder,
}: {
  label: string; name: string; value: string
  onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      <input
        type="text"
        name={name}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  )
}

export default function ProfileForm({ socio }: { socio: Socio }) {
  const [editando, setEditando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [exito, setExito] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [form, setForm] = useState<PerfilFormData>({
    tel_movil: socio.tel_movil ?? '',
    tel_fijo: socio.tel_fijo ?? '',
    direccion: socio.direccion ?? '',
    codigo_postal: socio.codigo_postal ?? '',
    localidad: socio.localidad ?? '',
    provincia: socio.provincia ?? '',
    iban: socio.iban ?? '',
    titular_cuenta: socio.titular_cuenta ?? '',
  })

  const set = (field: keyof PerfilFormData) => (v: string) =>
    setForm(prev => ({ ...prev, [field]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setErrorMsg('')
    setExito(false)
    const result = await actualizarPerfil(form)
    setGuardando(false)
    if (result.error) {
      setErrorMsg(result.error)
    } else {
      setExito(true)
      setEditando(false)
    }
  }

  const numIdentificador = socio.tipo === 'profesor'
    ? `Socio nº ${socio.num_socio}`
    : `Cooperante nº ${socio.num_cooperante}`

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{socio.apellidos}, {socio.nombre}</h1>
          <p className="text-sm text-gray-500 mt-1 capitalize">{numIdentificador} · {socio.tipo}</p>
        </div>
        {!editando && (
          <button
            onClick={() => { setEditando(true); setExito(false) }}
            className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition"
          >
            Editar datos
          </button>
        )}
      </div>

      {exito && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg px-4 py-3 text-sm">
          Datos guardados correctamente.
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          Error al guardar: {errorMsg}
        </div>
      )}

      {/* Datos de solo lectura */}
      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Datos personales</h2>
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Campo label="Nombre" valor={`${socio.apellidos}, ${socio.nombre}`} />
          <Campo label="DNI / NIF" valor={socio.dni} />
          <Campo label="Fecha de nacimiento" valor={socio.fecha_nacimiento} />
          <Campo label="Fecha de ingreso" valor={socio.fecha_ingreso} />
          <Campo label="Centro / Facultad" valor={socio.centro} />
        </dl>
        <p className="mt-4 text-xs text-gray-400">Para modificar estos datos, contacta con la secretaría.</p>
      </section>

      <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Emails</h2>
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Campo label="Email UMA" valor={socio.email_uma} />
          <Campo label="Otros emails" valor={socio.email_otros} />
          <Campo label="Email principal" valor={socio.email_principal} />
        </dl>
      </section>

      {/* Datos editables */}
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Teléfonos</h2>
            {editando ? (
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Teléfono móvil" name="tel_movil" value={form.tel_movil} onChange={set('tel_movil')} placeholder="6XX XXX XXX" />
                <InputField label="Teléfono fijo" name="tel_fijo" value={form.tel_fijo} onChange={set('tel_fijo')} placeholder="95X XXX XXX" />
              </div>
            ) : (
              <dl className="grid grid-cols-2 gap-4">
                <Campo label="Teléfono móvil" valor={socio.tel_movil} />
                <Campo label="Teléfono fijo" valor={socio.tel_fijo} />
              </dl>
            )}
          </section>

          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Dirección</h2>
            {editando ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <InputField label="Dirección" name="direccion" value={form.direccion} onChange={set('direccion')} />
                </div>
                <InputField label="Código postal" name="codigo_postal" value={form.codigo_postal} onChange={set('codigo_postal')} />
                <InputField label="Localidad" name="localidad" value={form.localidad} onChange={set('localidad')} />
                <InputField label="Provincia" name="provincia" value={form.provincia} onChange={set('provincia')} />
              </div>
            ) : (
              <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="md:col-span-2"><Campo label="Dirección" valor={socio.direccion} /></div>
                <Campo label="Código postal" valor={socio.codigo_postal} />
                <Campo label="Localidad" valor={socio.localidad} />
                <Campo label="Provincia" valor={socio.provincia} />
              </dl>
            )}
          </section>

          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Domiciliación bancaria</h2>
            {editando ? (
              <div className="grid grid-cols-2 gap-4">
                <InputField label="IBAN" name="iban" value={form.iban} onChange={set('iban')} placeholder="ES00 0000 0000 0000 0000 0000" />
                <InputField label="Titular de la cuenta" name="titular_cuenta" value={form.titular_cuenta} onChange={set('titular_cuenta')} />
              </div>
            ) : (
              <dl className="grid grid-cols-2 gap-4">
                <Campo label="IBAN" valor={socio.iban} />
                <Campo label="Titular de la cuenta" valor={socio.titular_cuenta} />
              </dl>
            )}
          </section>

          {editando && (
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={guardando}
                className="bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditando(false)
                  setForm({
                    tel_movil: socio.tel_movil ?? '',
                    tel_fijo: socio.tel_fijo ?? '',
                    direccion: socio.direccion ?? '',
                    codigo_postal: socio.codigo_postal ?? '',
                    localidad: socio.localidad ?? '',
                    provincia: socio.provincia ?? '',
                    iban: socio.iban ?? '',
                    titular_cuenta: socio.titular_cuenta ?? '',
                  })
                }}
                className="px-5 py-2.5 rounded-lg text-sm border border-gray-300 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
