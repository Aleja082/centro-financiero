import type { Asset } from '../types/portfolio'

export interface Totales {
  invertido: number
  actual: number
  pl: number
  plPct: number
}

export function calcularTotales(assets: Asset[]): Totales {
  const invertido = assets.reduce((acc, a) => acc + a.invertidoCOP, 0)
  const actual = assets.reduce((acc, a) => acc + a.actualCOP, 0)
  const pl = actual - invertido
  const plPct = invertido !== 0 ? (pl / invertido) * 100 : 0
  return { invertido, actual, pl, plPct }
}

export interface GrupoDistribucion {
  etiqueta: string
  valor: number
  porcentaje: number
}

export function agruparPor(assets: Asset[], keyFn: (a: Asset) => string): GrupoDistribucion[] {
  const totalActual = assets.reduce((acc, a) => acc + a.actualCOP, 0) || 1
  const mapa = new Map<string, number>()
  for (const a of assets) {
    const key = keyFn(a)
    mapa.set(key, (mapa.get(key) ?? 0) + a.actualCOP)
  }
  return Array.from(mapa.entries())
    .map(([etiqueta, valor]) => ({ etiqueta, valor, porcentaje: (valor / totalActual) * 100 }))
    .sort((a, b) => b.valor - a.valor)
}

const PALETTE = ['#4E9FE0', '#2FC3A0', '#E0A23B', '#E15F66', '#9B8AE0', '#5DCAA5', '#D9824A', '#8D98A0', '#6FA8DC', '#C77DC9']

export function colorParaIndice(i: number) {
  return PALETTE[i % PALETTE.length]
}
