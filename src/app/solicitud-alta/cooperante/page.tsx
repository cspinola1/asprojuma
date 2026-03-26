'use client'

import { useState } from 'react'
import Link from 'next/link'
import { enviarSolicitudCooperante, SolicitudCoopenanteData } from './actions'

const EMPTY: SolicitudCoopenanteData = {
  nombre: '', apellidos: '', dni: '', fecha_nacimiento: '',
  estudios: '', aficiones: '', descripcion_relacion: '',
  email_otros: '', tel_movil: '', tel_fijo: '',
  direccion: '', codigo_postal: '', localidad: '', provincia: '',
  iban: '', titular_cuenta: '',
  avalista1_email: '', avalista2_email: '',
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500'
const textareaCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'

export default function SolicitudCooperantePage() {
  const [form, setForm] = useState<SolicitudCoopenanteData>(EMPTY)
  const [rgpd, setRgpd] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [enviado, setEnviado] = useState(false)

  const set = (k: keyof SolicitudCoopenanteData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }))

  function validar(): string | null {
    const obligatorios: [keyof SolicitudCoopenanteData, string][] = [
      ['nombre',            'Nombre'],
      ['apellidos',         'Apellidos'],
      ['dni',               'DNI / NIF'],
      ['fecha_nacimiento',  'Fecha de nacimiento'],
      ['email_otros',       'Email personal'],
      ['tel_movil',         'Teléfono móvil'],
      ['direccion',         'Dirección'],
      ['codigo_postal',     'Código postal'],
      ['localidad',         'Localidad'],
      ['iban',              'IBAN'],
      ['titular_cuenta',    'Titular de la cuenta'],
      ['avalista1_email',   'Email del primer avalista'],
      ['avalista2_email',   'Email del segundo avalista'],
    ]
    const vacios = obligatorios.filter(([k]) => !form[k]?.trim()).map(([, label]) => label)
    if (vacios.length) return `Faltan campos obligatorios: ${vacios.join(', ')}`
    if (form.avalista1_email === form.avalista2_email)
      return 'Los dos avalistas deben ser personas distintas'
    if (!rgpd) return 'Debes aceptar la política de privacidad'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validar()
    if (err) { setError(err); return }
    setEnviando(true)
    setError('')
    const result = await enviarSolicitudCooperante(form)
    setEnviando(false)
    if (result.error) { setError(result.error); return }
    setEnviado(true)
  }

  if (enviado) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-md p-10 max-w-md text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Solicitud enviada</h2>
          <p className="text-gray-500 text-sm mb-6">
            Hemos recibido tu solicitud de alta como Miembro Cooperante.
            Se enviará un email a tus avalistas para que confirmen su aval.
            La secretaría te notificará cuando el proceso esté completado.
          </p>
          <Link href="/" className="bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition">
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-blue-900">ASPROJUMA</h1>
            <p className="text-xs text-gray-500">Solicitud de alta · Miembro Cooperante</p>
          </div>
          <Link href="/solicitud-alta" className="text-sm text-blue-600 hover:text-blue-800">← Volver</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Solicitud de alta — Miembro Cooperante</h2>
        <p className="text-sm text-gray-500 mb-8">
          Completa el formulario. Los campos con <span className="text-red-500">*</span> son obligatorios.
          Tu solicitud requerirá el aval de dos socios profesores activos de ASPROJUMA.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Datos personales */}
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Datos personales</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nombre" required>
                <input type="text" value={form.nombre} onChange={set('nombre')} className={inputCls} />
              </Field>
              <Field label="Apellidos" required>
                <input type="text" value={form.apellidos} onChange={set('apellidos')} className={inputCls} />
              </Field>
              <Field label="DNI / NIF" required>
                <input type="text" value={form.dni} onChange={set('dni')} placeholder="12345678A" className={inputCls} />
              </Field>
              <Field label="Fecha de nacimiento" required>
                <input type="date" value={form.fecha_nacimiento} onChange={set('fecha_nacimiento')} className={inputCls} />
              </Field>
            </div>
          </section>

          {/* Relación con la UMA */}
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Relación con la Universidad de Málaga</h3>
            <div className="space-y-4">
              <Field label="Relación con la Universidad de Málaga">
                <textarea
                  value={form.descripcion_relacion}
                  onChange={set('descripcion_relacion')}
                  rows={3}
                  placeholder="Personal técnico, de administración y servicios, familiar de socio profesor jubilado, etc."
                  className={textareaCls}
                />
              </Field>
              <Field label="Estudios realizados">
                <textarea
                  value={form.estudios}
                  onChange={set('estudios')}
                  rows={2}
                  placeholder="Titulaciones, formación académica…"
                  className={textareaCls}
                />
              </Field>
              <Field label="Aficiones e intereses">
                <textarea
                  value={form.aficiones}
                  onChange={set('aficiones')}
                  rows={2}
                  placeholder="Actividades, hobbies, intereses culturales…"
                  className={textareaCls}
                />
              </Field>
            </div>
          </section>

          {/* Contacto */}
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Datos de contacto</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Email personal" required>
                <input type="email" value={form.email_otros} onChange={set('email_otros')} className={inputCls} />
              </Field>
              <Field label="Teléfono móvil" required>
                <input type="tel" value={form.tel_movil} onChange={set('tel_movil')} placeholder="6XX XXX XXX" className={inputCls} />
              </Field>
              <Field label="Teléfono fijo">
                <input type="tel" value={form.tel_fijo} onChange={set('tel_fijo')} placeholder="95X XXX XXX" className={inputCls} />
              </Field>
            </div>
          </section>

          {/* Dirección */}
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Dirección postal</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-3">
                <Field label="Dirección" required>
                  <input type="text" value={form.direccion} onChange={set('direccion')} className={inputCls} />
                </Field>
              </div>
              <Field label="Código postal" required>
                <input type="text" value={form.codigo_postal} onChange={set('codigo_postal')} placeholder="29XXX" className={inputCls} />
              </Field>
              <Field label="Localidad" required>
                <input type="text" value={form.localidad} onChange={set('localidad')} className={inputCls} />
              </Field>
              <Field label="Provincia">
                <input type="text" value={form.provincia} onChange={set('provincia')} className={inputCls} />
              </Field>
            </div>
          </section>

          {/* Domiciliación bancaria */}
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Domiciliación bancaria</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="IBAN" required>
                <input type="text" value={form.iban} onChange={set('iban')} placeholder="ES00 0000 0000 0000 0000 0000" className={inputCls} />
              </Field>
              <Field label="Titular de la cuenta" required>
                <input type="text" value={form.titular_cuenta} onChange={set('titular_cuenta')} className={inputCls} />
              </Field>
            </div>
          </section>

          {/* Avalistas */}
          <section className="bg-blue-50 rounded-xl border border-blue-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-blue-900 uppercase tracking-wide mb-1">Avalistas</h3>
            <p className="text-xs text-blue-700 mb-4">
              Indica el email de dos socios profesores activos de ASPROJUMA que avalen tu solicitud.
              Se les enviará un correo para que confirmen el aval.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Email del primer avalista" required>
                <input type="email" value={form.avalista1_email} onChange={set('avalista1_email')}
                  placeholder="profesor1@uma.es" className={inputCls} />
              </Field>
              <Field label="Email del segundo avalista" required>
                <input type="email" value={form.avalista2_email} onChange={set('avalista2_email')}
                  placeholder="profesor2@uma.es" className={inputCls} />
              </Field>
            </div>
          </section>

          {/* RGPD */}
          <section className="bg-gray-50 rounded-xl border border-gray-200 p-5">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={rgpd}
                onChange={e => setRgpd(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                He leído y acepto la{' '}
                <a href="/privacidad" target="_blank" className="text-blue-700 underline">política de privacidad</a>.
                {' '}Consiento el tratamiento de mis datos por ASPROJUMA para la gestión de mi membresía.
              </span>
            </label>
          </section>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={enviando}
              className="bg-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-800 transition disabled:opacity-50"
            >
              {enviando ? 'Enviando solicitud...' : 'Enviar solicitud de alta'}
            </button>
            <Link href="/solicitud-alta"
              className="px-6 py-3 rounded-lg border border-gray-300 text-sm hover:bg-gray-50 transition">
              Cancelar
            </Link>
          </div>

        </form>
      </main>
    </div>
  )
}
