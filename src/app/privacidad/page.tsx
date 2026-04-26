import Link from 'next/link'

export const metadata = {
  title: 'Política de privacidad · ASPROJUMA',
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-blue-900 mb-3">{titulo}</h2>
      <div className="text-sm text-gray-700 space-y-2">{children}</div>
    </section>
  )
}

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-blue-900">ASPROJUMA</h1>
            <p className="text-xs text-gray-500">Política de privacidad</p>
          </div>
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-800">← Inicio</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Política de privacidad</h1>
        <p className="text-xs text-gray-400 mb-8">Última actualización: abril de 2026</p>

        <Seccion titulo="1. Responsable del tratamiento">
          <p>
            <strong>ASPROJUMA</strong> — Asociación de Profesores Jubilados de la Universidad de Málaga<br />
            Edificio Rectorado, Avda. Cervantes 2, 29016 Málaga<br />
            Correo electrónico: <a href="mailto:asprojuma@uma.es" className="text-blue-700 underline">asprojuma@uma.es</a>
          </p>
        </Seccion>

        <Seccion titulo="2. Datos que recogemos">
          <p>Para la gestión de la membresía recogemos los siguientes datos personales:</p>
          <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
            <li>Datos identificativos: nombre, apellidos, DNI/NIF, fecha de nacimiento.</li>
            <li>Datos de contacto: correo electrónico, teléfonos, dirección postal.</li>
            <li>Datos académicos: centro, departamento, área de conocimiento, categoría y fecha de jubilación (solo socios profesores).</li>
            <li>Datos bancarios: IBAN y titular de la cuenta, para la domiciliación de cuotas mediante adeudo directo SEPA.</li>
          </ul>
        </Seccion>

        <Seccion titulo="3. Finalidad y base jurídica">
          <p>Tratamos tus datos con las siguientes finalidades:</p>
          <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
            <li><strong>Gestión de la membresía</strong> — alta, baja, carnet digital y comunicaciones internas. Base: ejecución del contrato de asociación (art. 6.1.b RGPD).</li>
            <li><strong>Cobro de cuotas mediante adeudo directo SEPA</strong> — domiciliación bancaria semestral. Base: ejecución del contrato y mandato SEPA firmado.</li>
            <li><strong>Comunicaciones sobre actividades y servicios de la asociación</strong>. Base: interés legítimo del responsable (art. 6.1.f RGPD).</li>
          </ul>
        </Seccion>

        <Seccion titulo="4. Conservación de los datos">
          <p>
            Conservaremos tus datos personales mientras dure tu relación de membresía con ASPROJUMA.
            Una vez causada baja, los datos se mantendrán bloqueados durante <strong>5 años</strong> a efectos
            de posibles reclamaciones y obligaciones contables, transcurridos los cuales serán suprimidos o anonimizados.
          </p>
        </Seccion>

        <Seccion titulo="5. Cesión de datos">
          <p>
            No cederemos tus datos a terceros salvo obligación legal. Los datos bancarios (IBAN) se
            transmiten a la entidad bancaria exclusivamente para la gestión de los adeudos SEPA.
            Utilizamos los siguientes proveedores de servicios bajo acuerdo de encargado del tratamiento:
          </p>
          <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
            <li><strong>Supabase Inc.</strong> — base de datos y autenticación (servidores en la Unión Europea).</li>
            <li><strong>Vercel Inc.</strong> — alojamiento de la plataforma web.</li>
            <li><strong>Resend Inc.</strong> — envío de correos electrónicos transaccionales.</li>
          </ul>
        </Seccion>

        <Seccion titulo="6. Tus derechos">
          <p>Puedes ejercer en cualquier momento los siguientes derechos dirigiéndote a <a href="mailto:asprojuma@uma.es" className="text-blue-700 underline">asprojuma@uma.es</a>:</p>
          <ul className="list-disc list-inside space-y-1 mt-2 ml-2">
            <li><strong>Acceso</strong> — conocer qué datos tenemos sobre ti.</li>
            <li><strong>Rectificación</strong> — corregir datos inexactos o incompletos.</li>
            <li><strong>Supresión</strong> («derecho al olvido») — solicitar la eliminación de tus datos cuando ya no sean necesarios.</li>
            <li><strong>Portabilidad</strong> — recibir tus datos en formato estructurado.</li>
            <li><strong>Oposición y limitación</strong> — oponerte a determinados tratamientos o solicitar su limitación.</li>
          </ul>
          <p className="mt-2">
            También puedes presentar una reclamación ante la Agencia Española de Protección de Datos (<a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">aepd.es</a>) si consideras que el tratamiento no es conforme al RGPD.
          </p>
        </Seccion>

        <Seccion titulo="7. Seguridad">
          <p>
            ASPROJUMA aplica medidas técnicas y organizativas adecuadas para proteger tus datos personales
            frente a accesos no autorizados, pérdida o destrucción, incluyendo cifrado en tránsito (HTTPS),
            autenticación segura y control de acceso basado en roles.
          </p>
        </Seccion>

        <div className="mt-10 pt-6 border-t border-gray-200 text-xs text-gray-400 text-center">
          ASPROJUMA · asprojuma@uma.es · Edificio Rectorado, Avda. Cervantes 2, 29016 Málaga
        </div>
      </main>
    </div>
  )
}
