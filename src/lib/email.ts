import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}
const FROM = process.env.RESEND_FROM ?? 'ASPROJUMA <onboarding@resend.dev>'

const FOOTER = `
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
  <p style="color: #9ca3af; font-size: 11px; text-align: center; margin: 0;">
    ASPROJUMA · asprojuma@uma.es · Edificio Rectorado, Avda. Cervantes 2, 29016 Málaga
  </p>
`

const HEADER = `
  <div style="background: #1e3a5f; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 22px; letter-spacing: 2px;">ASPROJUMA</h1>
    <p style="color: #93c5d8; margin: 4px 0 0; font-size: 13px;">Asociación de Profesores Jubilados · UMA</p>
  </div>
`

export async function enviarEmailRecepcionSolicitud(
  email: string,
  nombre: string,
  apellidos: string,
) {
  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: 'ASPROJUMA — Solicitud de admisión recibida',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1f2937;">
        ${HEADER}
        <div style="background: #f9fafb; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
            Estimado/a <strong>${nombre} ${apellidos}</strong>,
          </p>
          <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
            Hemos recibido correctamente tu solicitud de admisión como socio/a de ASPROJUMA.
            Tu solicitud está <strong>pendiente de aprobación</strong> por la Comisión de Admisión.
          </p>
          <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
            Una vez resuelta, recibirás un nuevo mensaje con el enlace de acceso al portal del socio,
            o con las observaciones que, en su caso, fueran necesarias.
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
            Si tienes alguna duda, puedes contactar con nosotros en
            <a href="mailto:asprojuma@uma.es" style="color: #1e3a5f;">asprojuma@uma.es</a>.
          </p>
          ${FOOTER}
        </div>
      </div>
    `,
  })
}

export async function enviarConfirmacionInscripcionActividad(
  email: string,
  nombre: string,
  apellidos: string,
  tituloActividad: string,
  fechaActividad: string,
  lugarActividad: string | null,
  precio: number,
) {
  const iban = process.env.ASPROJUMA_IBAN ?? ''
  const titular = process.env.ASPROJUMA_TITULAR ?? 'ASPROJUMA'

  const bloquePago = precio > 0 ? `
    <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 8px; font-size: 14px; font-weight: bold; color: #92400e;">💳 Pago pendiente: ${precio.toFixed(2)} €</p>
      <p style="margin: 0 0 6px; font-size: 13px; color: #78350f;">
        Realiza una transferencia bancaria indicando en el concepto tu nombre y el título de la actividad:
      </p>
      <table style="width: 100%; font-size: 13px; color: #374151; border-collapse: collapse;">
        <tr>
          <td style="padding: 4px 0; font-weight: bold; width: 90px;">Titular:</td>
          <td style="padding: 4px 0;">${titular}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; font-weight: bold;">IBAN:</td>
          <td style="padding: 4px 0; font-family: monospace;">${iban}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; font-weight: bold;">Concepto:</td>
          <td style="padding: 4px 0;">${nombre} ${apellidos} — ${tituloActividad}</td>
        </tr>
      </table>
      <p style="margin: 10px 0 0; font-size: 12px; color: #92400e;">
        Una vez confirmado el pago, recibirás la confirmación definitiva de tu inscripción.
      </p>
    </div>
  ` : `
    <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 12px 16px; margin: 16px 0;">
      <p style="margin: 0; font-size: 14px; color: #166534;">✅ Inscripción confirmada — actividad gratuita</p>
    </div>
  `

  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: `ASPROJUMA — Inscripción en: ${tituloActividad}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1f2937;">
        ${HEADER}
        <div style="background: #f9fafb; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
            Estimado/a <strong>${nombre} ${apellidos}</strong>,
          </p>
          <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
            Te confirmamos tu inscripción en la siguiente actividad:
          </p>
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 6px; font-size: 16px; font-weight: bold; color: #1e3a5f;">${tituloActividad}</p>
            <p style="margin: 0 0 4px; font-size: 13px; color: #374151;">📅 ${fechaActividad}</p>
            ${lugarActividad ? `<p style="margin: 0; font-size: 13px; color: #374151;">📍 ${lugarActividad}</p>` : ''}
          </div>
          ${bloquePago}
          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
            Para cualquier consulta, contacta con nosotros en
            <a href="mailto:asprojuma@uma.es" style="color: #1e3a5f;">asprojuma@uma.es</a>.
          </p>
          ${FOOTER}
        </div>
      </div>
    `,
  })
}

export async function enviarConfirmacionInvitadoActividad(
  email: string,
  nombre: string,
  tituloActividad: string,
  fechaActividad: string,
  lugarActividad: string | null,
  pagado: boolean,
) {
  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: `ASPROJUMA — Confirmación de inscripción: ${tituloActividad}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1f2937;">
        ${HEADER}
        <div style="background: #f9fafb; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
            Estimado/a <strong>${nombre}</strong>,
          </p>
          <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
            ${pagado
              ? 'Tu inscripción en la siguiente actividad ha sido <strong>confirmada y abonada</strong>:'
              : 'Has sido inscrito/a en la siguiente actividad de ASPROJUMA:'
            }
          </p>
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0 0 6px; font-size: 16px; font-weight: bold; color: #1e3a5f;">${tituloActividad}</p>
            <p style="margin: 0 0 4px; font-size: 13px; color: #374151;">📅 ${fechaActividad}</p>
            ${lugarActividad ? `<p style="margin: 0; font-size: 13px; color: #374151;">📍 ${lugarActividad}</p>` : ''}
          </div>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
            Para cualquier consulta, contacta con nosotros en
            <a href="mailto:asprojuma@uma.es" style="color: #1e3a5f;">asprojuma@uma.es</a>.
          </p>
          ${FOOTER}
        </div>
      </div>
    `,
  })
}

export async function enviarEmailAprobacionSolicitud(
  email: string,
  nombre: string,
  apellidos: string,
  appUrl: string,
) {
  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: 'ASPROJUMA — Tu solicitud ha sido aprobada',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1f2937;">
        ${HEADER}
        <div style="background: #f9fafb; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
            Estimado/a <strong>${nombre} ${apellidos}</strong>,
          </p>
          <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
            Nos complace comunicarte que tu solicitud de admisión como socio/a de ASPROJUMA
            ha sido <strong>aprobada</strong> por la Junta Directiva.
          </p>
          <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
            Ya puedes acceder al portal del socio. El administrador te enviará en breve
            una invitación de acceso por separado para que establezcas tu contraseña.
          </p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="${appUrl}/login"
               style="background: #1e3a5f; color: white; padding: 12px 28px; border-radius: 8px;
                      text-decoration: none; font-size: 14px; font-weight: bold;">
              Acceder al portal
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
            Si tienes alguna duda, escríbenos a
            <a href="mailto:asprojuma@uma.es" style="color: #1e3a5f;">asprojuma@uma.es</a>.
          </p>
          ${FOOTER}
        </div>
      </div>
    `,
  })
}

export async function enviarEmailAvalistaCooperante(
  emailAvalista: string,
  nombreCooperante: string,
  apellidosCooperante: string,
) {
  await getResend().emails.send({
    from: FROM,
    to: emailAvalista,
    subject: 'ASPROJUMA — Solicitud de aval para nuevo cooperante',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1f2937;">
        ${HEADER}
        <div style="background: #f9fafb; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
            Estimado/a socio/a,
          </p>
          <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
            <strong>${nombreCooperante} ${apellidosCooperante}</strong> ha solicitado el alta como
            <strong>Miembro Cooperante</strong> de ASPROJUMA y le ha indicado como avalista.
          </p>
          <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
            Si desea confirmar su aval, por favor conteste a este correo o póngase en contacto con
            la secretaría de la asociación en
            <a href="mailto:asprojuma@uma.es" style="color: #1e3a5f;">asprojuma@uma.es</a>.
          </p>
          <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
            La solicitud quedará pendiente de aprobación por la Junta Directiva hasta recibir
            la confirmación de los dos avalistas.
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
            Si no conoce a esta persona o no desea avalarla, puede ignorar este mensaje
            o escribirnos a <a href="mailto:asprojuma@uma.es" style="color: #1e3a5f;">asprojuma@uma.es</a>.
          </p>
          ${FOOTER}
        </div>
      </div>
    `,
  })
}

export async function enviarEmailRechazoSolicitud(
  email: string,
  nombre: string,
  apellidos: string,
  motivo: string,
) {
  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: 'ASPROJUMA — Resolución de tu solicitud de admisión',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #1f2937;">
        ${HEADER}
        <div style="background: #f9fafb; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
            Estimado/a <strong>${nombre} ${apellidos}</strong>,
          </p>
          <p style="color: #4b5563; font-size: 14px; line-height: 1.6;">
            La Comisión de Admisión de ASPROJUMA ha resuelto tu solicitud de admisión.
            Lamentamos comunicarte que, en esta ocasión, no ha podido ser aprobada.
          </p>
          ${motivo ? `
          <div style="background: #f3f4f6; border-left: 3px solid #9ca3af; padding: 12px 16px; margin: 16px 0; border-radius: 0 4px 4px 0;">
            <p style="color: #374151; font-size: 13px; margin: 0; line-height: 1.6;">
              <strong>Observaciones:</strong><br>${motivo}
            </p>
          </div>
          ` : ''}
          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
            Para cualquier consulta, puedes dirigirte a
            <a href="mailto:asprojuma@uma.es" style="color: #1e3a5f;">asprojuma@uma.es</a>.
          </p>
          ${FOOTER}
        </div>
      </div>
    `,
  })
}
