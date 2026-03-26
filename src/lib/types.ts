// Tipos principales de ASPROJUMA

export type TipoSocio = 'profesor' | 'cooperante'

export type EstadoSocio =
  | 'activo'
  | 'activo_exento'
  | 'baja'
  | 'fallecido'
  | 'honorario'
  | 'pendiente'
  | 'suspendido'

export interface Socio {
  id: number
  tipo: TipoSocio
  estado: EstadoSocio
  num_socio: number | null
  num_cooperante: number | null
  apellidos: string | null
  nombre: string | null
  dni: string | null
  fecha_nacimiento: string | null
  iban: string | null
  titular_cuenta: string | null
  fecha_ingreso: string | null
  fecha_baja: string | null
  centro: string | null
  direccion: string | null
  codigo_postal: string | null
  localidad: string | null
  provincia: string | null
  tel_fijo: string | null
  tel_movil: string | null
  email_uma: string | null
  email_otros: string | null
  email_principal: string | null
  notas: string | null
  migrado_excel: boolean
  created_at: string
  updated_at: string
}

export type EstadoCuota = 'pendiente' | 'cobrado' | 'devuelto' | 'exento'

export interface Cuota {
  id: number
  socio_id: number
  anio: number
  semestre: 1 | 2
  importe: number
  estado: EstadoCuota
  fecha_cobro: string | null
  metodo_pago: string
  referencia_remesa: string | null
  notas: string | null
  created_at: string
}

export type EstadoCarnet = 'vigente' | 'caducado' | 'anulado'

export interface Carnet {
  id: number
  socio_id: number
  anio_vigencia: number
  fecha_emision: string
  fecha_caducidad: string | null
  estado: EstadoCarnet
  pdf_url: string | null
  enviado_email: boolean
  created_at: string
}
