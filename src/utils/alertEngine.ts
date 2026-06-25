import type { Alerta, Asset, AsignacionObjetivo, SeveridadAlerta } from '../types/portfolio'
import type { UmbralesAlerta } from '../types/movimientos'
import { formatCOP, formatPercent, plPercent } from './format'

export interface AlertaDinamica extends Alerta {
  fecha: string
  prioridad: SeveridadAlerta
  accionSugerida: string
  dinamica: true
}

function pctDe(valor: number, total: number): number {
  return total > 0 ? (valor / total) * 100 : 0
}

function severidadPorExceso(exceso: number): SeveridadAlerta {
  if (exceso > 20) return 'critico'
  if (exceso > 10) return 'alto'
  if (exceso > 0) return 'medio'
  return 'bajo'
}

/**
 * Genera alertas cuantitativas en vivo a partir de las posiciones actuales,
 * los objetivos de asignación y los umbrales configurables del usuario.
 * Se recalcula en cada render porque depende de `assets`, que ya refleja
 * precios en vivo, TRM en vivo y cualquier movimiento registrado.
 */
export function generarAlertasDinamicas(
  assets: Asset[],
  asignacionObjetivo: AsignacionObjetivo[],
  umbrales: UmbralesAlerta,
): AlertaDinamica[] {
  const hoy = new Date().toISOString().slice(0, 10)
  const alertas: AlertaDinamica[] = []
  const totalActual = assets.reduce((acc, a) => acc + a.actualCOP, 0) || 1

  // --- 1. Activos individuales que superan/caen del umbral configurado desde su costo ---
  for (const a of assets) {
    if (a.invertidoCOP <= 0) continue
    const pl = plPercent(a.invertidoCOP, a.actualCOP)
    if (pl <= -umbrales.caidaPctAlerta) {
      alertas.push({
        id: `dyn-caida-${a.id}`,
        titulo: `${a.nombre} cayó ${formatPercent(pl)} desde tu costo`,
        descripcion: `Superó el umbral configurado de -${umbrales.caidaPctAlerta}%. Valor actual: ${formatCOP(a.actualCOP)} sobre ${formatCOP(a.invertidoCOP)} invertidos.`,
        severidad: pl <= -umbrales.caidaPctAlerta * 1.5 ? 'critico' : 'alto',
        categoria: 'Caída de precio',
        fecha: hoy,
        prioridad: pl <= -umbrales.caidaPctAlerta * 1.5 ? 'critico' : 'alto',
        accionSugerida: a.recomendacion === 'vender' || a.recomendacion === 'reducir' ? 'Ya está marcado para reducir/vender — evalúa ejecutar en el próximo rebote.' : 'Revisa si la tesis de inversión sigue vigente antes de decidir.',
        dinamica: true,
      })
    }
    if (pl >= umbrales.subidaPctAlerta) {
      alertas.push({
        id: `dyn-subida-${a.id}`,
        titulo: `${a.nombre} subió ${formatPercent(pl)} desde tu costo`,
        descripcion: `Superó el umbral configurado de +${umbrales.subidaPctAlerta}%. Valor actual: ${formatCOP(a.actualCOP)} sobre ${formatCOP(a.invertidoCOP)} invertidos.`,
        severidad: 'medio',
        categoria: 'Oportunidad de toma de utilidades',
        fecha: hoy,
        prioridad: 'medio',
        accionSugerida: 'Considera tomar utilidad parcial y redirigir hacia tus posiciones objetivo con menor peso actual.',
        dinamica: true,
      })
    }
  }

  // --- 2. Sector sobreponderado ---
  const porSector = new Map<string, number>()
  for (const a of assets) porSector.set(a.sector, (porSector.get(a.sector) ?? 0) + a.actualCOP)
  for (const [sector, valor] of porSector) {
    const pct = pctDe(valor, totalActual)
    if (pct > umbrales.sectorMaxPct) {
      alertas.push({
        id: `dyn-sector-${sector}`,
        titulo: `Sector "${sector}" representa ${pct.toFixed(1)}% del portafolio`,
        descripcion: `Supera el límite configurado de ${umbrales.sectorMaxPct}%. ${formatCOP(valor)} concentrados en un solo sector.`,
        severidad: severidadPorExceso(pct - umbrales.sectorMaxPct),
        categoria: 'Concentración sectorial',
        fecha: hoy,
        prioridad: severidadPorExceso(pct - umbrales.sectorMaxPct),
        accionSugerida: 'Diversifica nuevos aportes hacia otros sectores hasta bajar la concentración.',
        dinamica: true,
      })
    }
  }

  // --- 3. País sobreponderado ---
  const porPais = new Map<string, number>()
  for (const a of assets) porPais.set(a.pais, (porPais.get(a.pais) ?? 0) + a.actualCOP)
  for (const [pais, valor] of porPais) {
    const pct = pctDe(valor, totalActual)
    if (pct > umbrales.paisMaxPct) {
      alertas.push({
        id: `dyn-pais-${pais}`,
        titulo: `${pais} representa ${pct.toFixed(1)}% del portafolio`,
        descripcion: `Supera el límite configurado de ${umbrales.paisMaxPct}%. ${formatCOP(valor)} concentrados en un solo país.`,
        severidad: severidadPorExceso(pct - umbrales.paisMaxPct),
        categoria: 'Concentración geográfica',
        fecha: hoy,
        prioridad: severidadPorExceso(pct - umbrales.paisMaxPct),
        accionSugerida: 'Prioriza ETFs globales o de otras geografías en los próximos aportes.',
        dinamica: true,
      })
    }
  }

  // --- 4. Categorías objetivo (asignacionObjetivo) muy por encima/debajo de su meta ---
  // Aproximación simple por palabras clave del nombre del activo/etiqueta objetivo.
  for (const obj of asignacionObjetivo) {
    const etiquetaLower = obj.etiqueta.toLowerCase()
    let valorCategoria = 0
    if (etiquetaLower.includes('etf') || etiquetaLower.includes('global')) {
      valorCategoria = assets.filter((a) => a.tipo === 'fondo').reduce((s, a) => s + a.actualCOP, 0)
    } else if (etiquetaLower.includes('bitcoin')) {
      valorCategoria = assets.filter((a) => a.ticker === 'BTC').reduce((s, a) => s + a.actualCOP, 0)
    } else if (etiquetaLower.includes('ethereum')) {
      valorCategoria = assets.filter((a) => a.ticker === 'ETH').reduce((s, a) => s + a.actualCOP, 0)
    } else if (etiquetaLower.includes('colombianas')) {
      valorCategoria = assets.filter((a) => a.tipo === 'accion' && a.pais === 'Colombia').reduce((s, a) => s + a.actualCOP, 0)
    } else {
      continue
    }
    const pct = pctDe(valorCategoria, totalActual)
    const brecha = pct - obj.porcentajeObjetivo
    if (Math.abs(brecha) > 8) {
      alertas.push({
        id: `dyn-objetivo-${obj.etiqueta}`,
        titulo: `${obj.etiqueta}: ${pct.toFixed(1)}% actual vs. ${obj.porcentajeObjetivo}% objetivo`,
        descripcion: brecha > 0 ? `Está ${brecha.toFixed(1)} pp por encima de su meta.` : `Está ${Math.abs(brecha).toFixed(1)} pp por debajo de su meta.`,
        severidad: Math.abs(brecha) > 15 ? 'alto' : 'medio',
        categoria: 'Rebalanceo',
        fecha: hoy,
        prioridad: Math.abs(brecha) > 15 ? 'alto' : 'medio',
        accionSugerida: brecha > 0 ? 'Pausa nuevos aportes a esta categoría hasta que el resto del portafolio la alcance.' : 'Prioriza esta categoría en tu próximo aporte.',
        dinamica: true,
      })
    }
  }

  return alertas.sort((a, b) => {
    const orden: Record<SeveridadAlerta, number> = { critico: 0, alto: 1, medio: 2, bajo: 3 }
    return orden[a.severidad] - orden[b.severidad]
  })
}
