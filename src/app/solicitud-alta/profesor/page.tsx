'use client'

import { useState } from 'react'
import Link from 'next/link'
import { enviarSolicitudProfesor, SolicitudProfesorData } from './actions'

const EMPTY: SolicitudProfesorData = {
  nombre: '', apellidos: '', dni: '', fecha_nacimiento: '',
  centro: '', departamento: '', titulacion: '', fecha_jubilacion: '', categoria: '',
  email_uma: '', email_otros: '', tel_movil: '', tel_fijo: '',
  direccion: '', codigo_postal: '', localidad: '', provincia: '',
  iban: '', titular_cuenta: '',
}

function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
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

export default function SolicitudProfesorPage() {
  const [form, setForm] = useState<SolicitudProfesorData>(EMPTY)
  const [rgpd, setRgpd] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')
  const [enviado, setEnviado] = useState(false)

  const set = (k: keyof SolicitudProfesorData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [k]: e.target.value }))

  function validar(): string | null {
    const obligatorios: [keyof SolicitudProfesorData, string][] = [
      ['nombre',          'Nombre'],
      ['apellidos',       'Apellidos'],
      ['dni',             'DNI / NIF'],
      ['fecha_nacimiento','Fecha de nacimiento'],
      ['centro',          'Último Centro al que estuvo adscrito (Facultad o Escuela)'],
      ['fecha_jubilacion','Fecha de jubilación'],
      ['email_otros',     'Email personal'],
      ['tel_movil',       'Teléfono móvil'],
      ['direccion',       'Dirección'],
      ['codigo_postal',   'Código postal'],
      ['localidad',       'Localidad'],
      ['iban',            'IBAN'],
      ['titular_cuenta',  'Titular de la cuenta'],
    ]
    const vacios = obligatorios.filter(([k]) => !form[k]?.trim()).map(([, label]) => label)
    if (vacios.length) return `Faltan campos obligatorios: ${vacios.join(', ')}`
    if (!rgpd) return 'Debes aceptar la política de privacidad'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const err = validar()
    if (err) { setError(err); return }
    setEnviando(true)
    setError('')
    const result = await enviarSolicitudProfesor(form)
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
            Hemos recibido tu solicitud de alta como Socio Profesor Jubilado.
            La secretaría la revisará y se pondrá en contacto contigo pronto.
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
            <p className="text-xs text-gray-500">Solicitud de alta · Socio Profesor Jubilado</p>
          </div>
          <Link href="/solicitud-alta" className="text-sm text-blue-600 hover:text-blue-800">← Volver</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Solicitud de alta — Socio Profesor Jubilado</h2>
        <p className="text-sm text-gray-500 mb-8">
          Completa el formulario y la secretaría revisará tu solicitud. Los campos marcados con <span className="text-red-500">*</span> son obligatorios.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Datos personales */}
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Datos personales</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Nombre" required>
                <input type="text" value={form.nombre} onChange={set('nombre')} required className={inputCls} />
              </Field>
              <Field label="Apellidos" required>
                <input type="text" value={form.apellidos} onChange={set('apellidos')} required className={inputCls} />
              </Field>
              <Field label="DNI / NIF" required>
                <input type="text" value={form.dni} onChange={set('dni')} required placeholder="12345678A" className={inputCls} />
              </Field>
              <Field label="Fecha de nacimiento" required>
                <input type="date" value={form.fecha_nacimiento} onChange={set('fecha_nacimiento')} className={inputCls} />
              </Field>
            </div>
          </section>

          {/* Datos académicos */}
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Datos académicos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Último Centro al que estuvo adscrito (Facultad o Escuela)" required>
                <input type="text" value={form.centro} onChange={set('centro')} required className={inputCls} placeholder="Ej: Facultad de Ciencias" />
              </Field>
              <Field label="Departamento">
                <input type="text" value={form.departamento} onChange={set('departamento')} className={inputCls} />
              </Field>
              <Field label="Área de Conocimiento">
                <input type="text" value={form.titulacion} onChange={set('titulacion')} className={inputCls} />
              </Field>
              <Field label="Fecha de jubilación" required>
                <input type="date" value={form.fecha_jubilacion} onChange={set('fecha_jubilacion')} className={inputCls} />
              </Field>
              <Field label="Categoría profesional">
                <select value={form.categoria} onChange={set('categoria')} className={inputCls}>
                  <option value="">— Selecciona —</option>
                  <option>Catedrático/a de Universidad</option>
                  <option>Profesor/a Titular de Universidad</option>
                  <option>Catedrático/a de Escuela Universitaria</option>
                  <option>Profesor/a Titular de Escuela Universitaria</option>
                  <option>Profesor/a Contratado/a Doctor/a</option>
                  <option>Otro</option>
                </select>
              </Field>
            </div>
          </section>

          {/* Contacto */}
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Datos de contacto</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Email UMA (@uma.es)">
                <input type="email" value={form.email_uma} onChange={set('email_uma')} placeholder="usuario@uma.es" className={inputCls} />
              </Field>
              <Field label="Email personal" required>
                <input type="email" value={form.email_otros} onChange={set('email_otros')} required className={inputCls} />
              </Field>
              <Field label="Teléfono móvil" required>
                <input type="tel" value={form.tel_movil} onChange={set('tel_movil')} required placeholder="6XX XXX XXX" className={inputCls} />
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
                  <input type="text" value={form.direccion} onChange={set('direccion')} required className={inputCls} />
                </Field>
              </div>
              <Field label="Código postal" required>
                <input type="text" value={form.codigo_postal} onChange={set('codigo_postal')} required placeholder="29XXX" className={inputCls} />
              </Field>
              <Field label="Localidad" required>
                <input type="text" value={form.localidad} onChange={set('localidad')} required className={inputCls} />
              </Field>
              <Field label="Provincia">
                <input type="text" value={form.provincia} onChange={set('provincia')} className={inputCls} />
              </Field>
            </div>
          </section>

          {/* Domiciliación bancaria */}
          <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Domiciliación bancaria</h3>
            <p className="text-xs text-gray-500 mb-4">
              La cuota anual es de <strong>50 €</strong> divididos en dos semestres de <strong>25 €</strong> (junio · diciembre).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="IBAN" required>
                <input type="text" value={form.iban} onChange={set('iban')} required
                  placeholder="ES00 0000 0000 0000 0000 0000" className={inputCls} />
              </Field>
              <Field label="Titular de la cuenta" required>
                <input type="text" value={form.titular_cuenta} onChange={set('titular_cuenta')} required className={inputCls} />
              </Field>
            </div>
          </section>

          {/* RGPD */}
          <section className="bg-blue-50 rounded-xl border border-blue-100 p-5">
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
