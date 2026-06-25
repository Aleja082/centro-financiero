import type { AssetType } from './portfolio'

export type TipoMovimiento = 'compra' | 'venta' | 'aporte' | 'retiro' | 'dividendo' | 'staking' | 'split' | 'fusion' | 'conversion'

export interface MovimientoRegistro {
  id: string
  fecha: string // YYYY-MM-DD
  hora: string // HH:mm
  tipo: TipoMovimiento
  assetId?: string
  nombreActivo: string
  ticker: string
  cantidad?: number
  precioUnitario?: number
  comision?: number
  moneda: 'COP' | 'USD'
  comentarios?: string
  montoTotalCOP: number
  assetDestinoId?: string
  nombreDestino?: string
}

// Datos que llegan desde el formulario o el asistente de lenguaje natural,
// antes de resolverse contra el portafolio actual (buscar el activo por
// ticker, convertir USD a COP con la TRM en vivo, etc.)
export interface NuevoMovimientoInput {
  tipo: TipoMovimiento
  fecha?: string
  hora?: string
  assetId?: string
  nombreActivoNuevo?: string
  tickerNuevo?: string
  assetTipoNuevo?: AssetType
  cantidad?: number
  precioUnitario?: number
  comision?: number
  moneda: 'COP' | 'USD'
  montoTotal?: number // si no se da, se calcula desde cantidad × precioUnitario
  porcentajeVendido?: number // solo 'venta' (1-100)
  eliminarDelPortafolio?: boolean // solo 'venta' al 100%
  factorSplit?: number // solo 'split'
  assetDestinoId?: string // solo 'fusion'/'conversion'
  nombreDestinoNuevo?: string
  tickerDestinoNuevo?: string
  cantidadDestino?: number
  comentarios?: string
}

export interface UmbralesAlerta {
  caidaPctAlerta: number // alertar si una posición cae más de X% desde el costo
  subidaPctAlerta: number // alertar si una posición sube más de X% desde el costo
  sectorMaxPct: number
  paisMaxPct: number
}

export const UMBRALES_DEFAULT: UmbralesAlerta = {
  caidaPctAlerta: 30,
  subidaPctAlerta: 50,
  sectorMaxPct: 35,
  paisMaxPct: 60,
}
