import type { Asset, AsignacionObjetivo } from '../types/portfolio'

export interface FilaRebalanceo {
  etiqueta: string
  valorActualCOP: number
  pctActual: number
  pctObjetivo: number
  valorObjetivoCOP: number
  brechaCOP: number // positivo = sobra (vender), negativo = falta (comprar)
  brechaPct: number
  accion: 'comprar' | 'vender' | 'mantener'
}

function valorParaCategoria(assets: Asset[], etiqueta: string): number {
  const e = etiqueta.toLowerCase()
  if (e.includes('etf') || (e.includes('global') && !e.includes('mpf'))) {
    return assets.filter((a) => a.tipo === 'fondo').reduce((s, a) => s + a.actualCOP, 0)
  }
  if (e.includes('bitcoin')) return assets.filter((a) => a.ticker === 'BTC').reduce((s, a) => s + a.actualCOP, 0)
  if (e.includes('ethereum')) return assets.filter((a) => a.ticker === 'ETH').reduce((s, a) => s + a.actualCOP, 0)
  if (e.includes('colombianas')) return assets.filter((a) => a.tipo === 'accion' && a.pais === 'Colombia').reduce((s, a) => s + a.actualCOP, 0)
  if (e.includes('renta fija')) return assets.filter((a) => a.sector.toLowerCase().includes('renta fija')).reduce((s, a) => s + a.actualCOP, 0)
  if (e.includes('l1') || e.includes('alternativa')) return assets.filter((a) => a.ticker === 'SOL').reduce((s, a) => s + a.actualCOP, 0)
  if (e.includes('otros') || e.includes('liquidez')) return 0
  return 0
}

export function calcularRebalanceo(assets: Asset[], asignacionObjetivo: AsignacionObjetivo[], liquidezCOP = 0): FilaRebalanceo[] {
  const totalActual = assets.reduce((acc, a) => acc + a.actualCOP, 0) + liquidezCOP || 1

  return asignacionObjetivo.map((obj) => {
    const valorActualCOP = valorParaCategoria(assets, obj.etiqueta)
    const pctActual = (valorActualCOP / totalActual) * 100
    const valorObjetivoCOP = Math.round((obj.porcentajeObjetivo / 100) * totalActual)
    const brechaCOP = valorActualCOP - valorObjetivoCOP
    const brechaPct = pctActual - obj.porcentajeObjetivo
    return {
      etiqueta: obj.etiqueta,
      valorActualCOP,
      pctActual: Math.round(pctActual * 10) / 10,
      pctObjetivo: obj.porcentajeObjetivo,
      valorObjetivoCOP,
      brechaCOP,
      brechaPct: Math.round(brechaPct * 10) / 10,
      accion: brechaPct > 3 ? 'vender' : brechaPct < -3 ? 'comprar' : 'mantener',
    }
  })
}
