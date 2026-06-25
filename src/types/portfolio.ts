// Tipos centrales del dominio de la aplicación.
// Cualquier archivo JSON importado por el usuario debe respetar esta forma
// (ver public/data/portfolio.example.json para un ejemplo completo).

export type AssetType = 'cripto' | 'accion' | 'fondo'

export type Conviccion = 'Muy alta' | 'Alta' | 'Media-alta' | 'Media' | 'Baja' | 'Muy baja' | 'N/A'

export type RiesgoNivel = 'Muy bajo' | 'Bajo' | 'Medio' | 'Medio-alto' | 'Alto' | 'Muy alto' | 'Extremo'

export type Recomendacion = 'comprar' | 'acumular' | 'mantener' | 'reducir' | 'vender'

export interface Asset {
  id: string
  nombre: string
  ticker: string
  tipo: AssetType
  sector: string
  pais: string
  monedaExposicion: 'COP' | 'USD' | 'Global'
  cantidad?: number
  coingeckoId?: string // solo para cripto — habilita el precio en vivo vía CoinGecko
  stooqSymbol?: string // solo para acciones/ETFs con cotización internacional (ej. NU en NYSE) — habilita precio en vivo best-effort vía Stooq
  invertidoCOP: number
  actualCOP: number
  convicción: Conviccion
  riesgo: RiesgoNivel
  horizonte: string
  funcion: string
  recomendacion: Recomendacion
  tesis: string
  ventajas: string[]
  riesgos: string[]
}

export type SemaforoNivel = 'excelente' | 'aceptable' | 'revisar' | 'critico'

export interface SubScore {
  id: string
  etiqueta: string
  valor: number // 0-100
  peso: number // 0-1, debe sumar 1 entre todos los subscores
  descripcion: string
}

export interface ExposicionTematica {
  id: string
  etiqueta: string
  porcentaje: number
  nivel: SemaforoNivel
  descripcion: string
}

export type SeveridadAlerta = 'bajo' | 'medio' | 'alto' | 'critico'
export type EstadoAlerta = 'pendiente' | 'revisada' | 'resuelta'

export interface Alerta {
  id: string
  titulo: string
  descripcion: string
  severidad: SeveridadAlerta
  categoria: string
}

export interface ChecklistItem {
  id: string
  texto: string
  grupo: string
}

export interface AsignacionAporte {
  activoId: string
  nombre: string
  porcentaje: number
  vehiculoSugerido: string
}

export interface PlanAporte {
  montoMensual: number
  asignaciones: AsignacionAporte[]
  notaComisiones: string
}

export type CategoriaOportunidad =
  | 'ETF'
  | 'Acciones'
  | 'Inteligencia Artificial'
  | 'Salud'
  | 'Energía'
  | 'Infraestructura'
  | 'Mercados Emergentes'
  | 'Criptomonedas'

export interface Oportunidad {
  id: string
  nombre: string
  categoria: CategoriaOportunidad
  tesis: string
  riesgo: RiesgoNivel
  horizonte: string
  potencialEstimado: string
  conviccion: Conviccion
}

export interface PerfilInversionista {
  edad: number
  pais: string
  monedaBase: string
  horizonteInversion: string
  toleranciaRiesgo: string
  objetivos: string
  fondoEmergenciaActual: number
  ingresoMensualAprox: number
  capacidadAhorroMensual: number
  deudaTotal: number
  tasaDeudaMensual: number // ej. 0.01 = 1% mensual
  gastosMensuales: number
  edadRetiro: number
  otrosActivos: { nombre: string; valorCOP: number }[]
}

export interface AsignacionObjetivo {
  etiqueta: string
  porcentajeObjetivo: number
  color: string
}

export interface SupuestosSimulador {
  pesimista: number
  base: number
  optimista: number
  inflacionDefault: number
  incrementoAnualDefault: number
}

export interface PortfolioData {
  meta: {
    fechaActualizacion: string
    trm: number
    version: string
  }
  liquidezCOP?: number
  perfil: PerfilInversionista
  assets: Asset[]
  subScoresSalud: SubScore[]
  exposicionesTematicas: ExposicionTematica[]
  alertas: Alerta[]
  checklist: ChecklistItem[]
  planesAporte: PlanAporte[]
  oportunidades: Oportunidad[]
  asignacionObjetivo: AsignacionObjetivo[]
  supuestosSimulador: SupuestosSimulador
}
