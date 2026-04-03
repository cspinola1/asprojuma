import { createClient } from '@/lib/supabase/server'
import { esAdminUser } from '@/lib/roles'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function SocioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const esAdmin = await esAdminUser(user)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-lg font-bold text-blue-900">ASPROJUMA · Área del socio</h1>
          <div className="flex items-center gap-4">
            {esAdmin && (
              <Link href="/admin" className="text-sm text-blue-600 hover:text-blue-800">
                Panel admin
              </Link>
            )}
            <form action="/api/auth/logout" method="POST">
              <button className="text-sm text-gray-500 hover:text-red-600">
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Bienvenido, {user.email}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { titulo: 'Mi perfil', desc: 'Ver y editar mis datos personales', href: '/socio/perfil' },
            { titulo: 'Mi carnet', desc: 'Descargar el carnet digital vigente', href: '/socio/carnet' },
            { titulo: 'Mis cuotas', desc: 'Historial de pagos y estado actual', href: '/socio/cuotas' },
            { titulo: 'Actividades', desc: 'Ver y apuntarse a actividades', href: '/socio/actividades' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition"
            >
              <h3 className="font-semibold text-blue-900">{item.titulo}</h3>
              <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
            </a>
          ))}
        </div>
      </main>
    </div>
  )
}
