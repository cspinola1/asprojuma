import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Socio } from '@/lib/types'
import ProfileForm from './ProfileForm'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: socio } = await supabase
    .from('socios')
    .select('*')
    .or(`email_uma.eq.${user.email},email_otros.eq.${user.email}`)
    .single()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/socio" className="text-sm text-blue-600 hover:text-blue-800">
            ← Área del socio
          </Link>
          <form action="/api/auth/logout" method="POST">
            <button className="text-sm text-gray-500 hover:text-red-600">Cerrar sesión</button>
          </form>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {!socio ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-sm text-yellow-800">
            <p className="font-medium mb-1">No se encontró tu ficha de socio</p>
            <p>El email con el que accedes ({user.email}) no coincide con ningún socio registrado.
              Contacta con la secretaría en <a href="mailto:asprojuma@uma.es" className="underline">asprojuma@uma.es</a>.</p>
          </div>
        ) : (
          <ProfileForm socio={socio as Socio} />
        )}
      </main>
    </div>
  )
}
