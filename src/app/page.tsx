import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Cabecera */}
      <header className="bg-white shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-blue-900">ASPROJUMA</h1>
            <p className="text-xs text-gray-500">
              Asociación de Profesores Jubilados · Universidad de Málaga
            </p>
          </div>
          <Link
            href="/login"
            className="bg-blue-700 text-white px-4 py-2 rounded text-sm hover:bg-blue-800 transition"
          >
            Acceso socios
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-900 to-blue-700 px-4 py-20 text-center text-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">Bienvenidos a ASPROJUMA</h2>
          <p className="text-lg text-blue-100 mb-10 max-w-2xl mx-auto">
            La asociación que une a los profesores jubilados de la Universidad de
            Málaga. Gestiona tu carnet, consulta actividades y mantente conectado.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/solicitud-alta"
              className="bg-white text-blue-900 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition"
            >
              Solicitar alta como socio
            </Link>
            <Link
              href="/login"
              className="border border-white text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition"
            >
              Ya soy socio — entrar
            </Link>
          </div>
        </div>
      </section>

      {/* Estadísticas */}
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-4 py-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-blue-700 mb-2">146</div>
            <p className="text-gray-600">Socios profesores</p>
          </div>
          <div>
            <div className="text-4xl font-bold text-blue-700 mb-2">54</div>
            <p className="text-gray-600">Miembros cooperantes</p>
          </div>
          <div>
            <div className="text-4xl font-bold text-blue-700 mb-2">2004</div>
            <p className="text-gray-600">Año de fundación</p>
          </div>
        </div>
      </section>

      {/* Pie */}
      <footer className="bg-blue-950 text-blue-300 text-sm text-center py-6">
        <p>ASPROJUMA · Edificio Rectorado, Avda. Cervantes 2, 29016 Málaga</p>
        <p className="mt-1">
          <a href="mailto:asprojuma@uma.es" className="hover:text-white">
            asprojuma@uma.es
          </a>
        </p>
      </footer>
    </main>
  )
}
