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
