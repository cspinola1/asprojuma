import Link from 'next/link'

export default function SolicitudAltaPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-blue-900">ASPROJUMA</h1>
            <p className="text-xs text-gray-500">Asociación de Profesores Jubilados · Universidad de Málaga</p>
          </div>
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-800">← Inicio</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">Solicitud de alta</h2>
          <p className="text-gray-500 mt-2">Selecciona el tipo de membresía que deseas solicitar</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Link
            href="/solicitud-alta/profesor"
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md hover:border-blue-200 transition group"
          >
            <div className="text-4xl mb-4">🎓</div>
            <h3 className="text-xl font-bold text-blue-900 group-hover:text-blue-700">
              Socio Profesor Jubilado
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              Para profesores jubilados de la Universidad de Málaga.
            </p>
            <ul className="mt-4 space-y-1 text-sm text-gray-500">
              <li>✓ Acceso a todas las actividades</li>
              <li>✓ Carnet digital de socio</li>
              <li>✓ Cuota semestral de 25 €</li>
            </ul>
            <div className="mt-6 text-blue-700 font-medium text-sm group-hover:underline">
              Solicitar →
            </div>
          </Link>

          <Link
            href="/solicitud-alta/cooperante"
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 hover:shadow-md hover:border-blue-200 transition group"
          >
            <div className="text-4xl mb-4">🤝</div>
            <h3 className="text-xl font-bold text-blue-900 group-hover:text-blue-700">
              Miembro Cooperante
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              Para familiares y personas vinculadas a la UMA. Requiere el aval de dos socios profesores.
            </p>
            <ul className="mt-4 space-y-1 text-sm text-gray-500">
              <li>✓ Acceso a actividades</li>
              <li>✓ Carnet digital de miembro</li>
              <li>✓ Aval de dos profesores socios</li>
            </ul>
            <div className="mt-6 text-blue-700 font-medium text-sm group-hover:underline">
              Solicitar →
            </div>
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          ¿Tienes dudas? Contacta con{' '}
          <a href="mailto:asprojuma@uma.es" className="underline">asprojuma@uma.es</a>
        </p>
      </main>
    </div>
  )
}
