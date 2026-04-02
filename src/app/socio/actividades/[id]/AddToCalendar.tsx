'use client'

interface Props {
  titulo: string
  descripcion: string | null
  lugar: string | null
  fecha_inicio: string
  hora_inicio: string | null
  fecha_fin: string | null
  hora_fin: string | null
}

function fmt(fecha: string, hora?: string | null) {
  const d = fecha.replace(/-/g, '')
  if (hora) return `${d}T${hora.replace(/:/g, '').slice(0, 6)}00`
  return d
}

export function AddToCalendar({ titulo, descripcion, lugar, fecha_inicio, hora_inicio, fecha_fin, hora_fin }: Props) {
  const inicio = fmt(fecha_inicio, hora_inicio)
  const fin = fecha_fin ? fmt(fecha_fin, hora_fin) : fmt(fecha_inicio, hora_inicio)

  function openGoogle() {
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: titulo,
      dates: `${inicio}/${fin}`,
      details: descripcion ?? '',
      location: lugar ?? '',
    })
    window.open(`https://calendar.google.com/calendar/render?${params}`, '_blank', 'noopener')
  }

  function descargarICS() {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ASPROJUMA//ES',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `DTSTART:${inicio}`,
      `DTEND:${fin}`,
      `SUMMARY:${titulo}`,
      descripcion ? `DESCRIPTION:${descripcion.replace(/\n/g, '\\n')}` : null,
      lugar ? `LOCATION:${lugar}` : null,
      `UID:asprojuma-${Date.now()}@asprojuma.es`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean).join('\r\n')

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${titulo.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Añadir a mi calendario</p>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={openGoogle}
          className="flex items-center gap-1.5 text-xs border border-gray-200 text-gray-700 py-1.5 px-3 rounded-lg hover:bg-gray-50 transition font-medium"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
            <path d="M12 0C5.372 0 0 5.373 0 12s5.372 12 12 12 12-5.373 12-12S18.628 0 12 0zm6.804 16.383a6.804 6.804 0 1 1-13.607 0 6.804 6.804 0 0 1 13.607 0z" fill="#4285F4"/>
          </svg>
          Google Calendar
        </button>
        <button
          onClick={descargarICS}
          className="flex items-center gap-1.5 text-xs border border-gray-200 text-gray-700 py-1.5 px-3 rounded-lg hover:bg-gray-50 transition font-medium"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          Outlook / Apple (.ics)
        </button>
      </div>
    </div>
  )
}
