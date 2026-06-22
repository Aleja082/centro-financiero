import type { Alerta, Asset, ExposicionTematica, SemaforoNivel, SeveridadAlerta, SubScore } from '../types/portfolio'

export interface CoberturaPrecioVivo {
  assetId: string
  enVivo: boolean
  precioUsdVivo?: number
}

/**
 * Recalcula `actualCOP` de los activos cripto usando precios en vivo (USD) y
 * la TRM guardada. Si un activo no tiene `coingeckoId`, no tiene `cantidad`,
 * o la API no devolvió precio para él, se conserva su `actualCOP` guardado
 * tal cual — nunca se "rompe" un activo por falta de datos en vivo.
 */
export function aplicarPreciosVivos(
  assets: Asset[],
  preciosUsd: Record<string, number>,
  trm: number,
): { assets: Asset[]; cobertura: CoberturaPrecioVivo[] } {
  const cobertura: CoberturaPrecioVivo[] = []

  const nuevosAssets = assets.map((a) => {
    if (a.tipo !== 'cripto' || !a.coingeckoId || a.cantidad === undefined) {
      cobertura.push({ assetId: a.id, enVivo: false })
      return a
    }
    const precioUsd = preciosUsd[a.coingeckoId]
    if (precioUsd === undefined) {
      cobertura.push({ assetId: a.id, enVivo: false })
      return a
    }
    cobertura.push({ assetId: a.id, enVivo: true, precioUsdVivo: precioUsd })
    return { ...a, actualCOP: Math.round(a.cantidad * precioUsd * trm) }
  })

  return { assets: nuevosAssets, cobertura }
}

export function calcularPorcentajeCripto(assets: Asset[]): number {
  const total = assets.reduce((acc, a) => acc + a.actualCOP, 0) || 1
  const cripto = assets.filter((a) => a.tipo === 'cripto').reduce((acc, a) => acc + a.actualCOP, 0)
  return (cripto / total) * 100
}

function nivelParaCripto(pct: number): SemaforoNivel {
  if (pct <= 20) return 'excelente'
  if (pct <= 30) return 'aceptable'
  if (pct <= 45) return 'revisar'
  return 'critico'
}

function severidadParaCripto(pct: number): SeveridadAlerta {
  if (pct > 45) return 'critico'
  if (pct > 30) return 'alto'
  if (pct > 20) return 'medio'
  return 'bajo'
}

// Fórmula simple y explícita: 20% de cripto o menos puntúa 80/100 en el
// subscore de riesgo; a partir de ahí cae de forma lineal hasta un piso de
// 5/100 en 70% o más. Reproduce el valor estático original (~25 para 52,9%).
function scoreRiesgoParaCripto(pct: number): number {
  if (pct <= 20) return 80
  if (pct >= 70) return 5
  return Math.round(80 - ((pct - 20) / 50) * 75)
}

export function recalcularSubScores(subScores: SubScore[], assets: Asset[]): SubScore[] {
  const pct = calcularPorcentajeCripto(assets)
  const valor = scoreRiesgoParaCripto(pct)
  return subScores.map((s) =>
    s.id === 'riesgo'
      ? {
          ...s,
          valor,
          descripcion: `Cripto representa ${pct.toFixed(1)}% del portafolio en este momento (con precios en vivo). El límite recomendado para este perfil es 20-25%.`,
        }
      : s,
  )
}

export function recalcularExposiciones(exposiciones: ExposicionTematica[], assets: Asset[]): ExposicionTematica[] {
  const pct = calcularPorcentajeCripto(assets)
  return exposiciones.map((e) =>
    e.id === 'cripto'
      ? {
          ...e,
          porcentaje: Math.round(pct * 10) / 10,
          nivel: nivelParaCripto(pct),
          descripcion:
            pct > 25
              ? `Más del doble del límite recomendado (20-25%) para un perfil moderado-alto. Valor en vivo: ${pct.toFixed(1)}%.`
              : `Dentro de un rango razonable para este perfil. Valor en vivo: ${pct.toFixed(1)}%.`,
        }
      : e,
  )
}

export function recalcularAlertas(alertas: Alerta[], assets: Asset[]): Alerta[] {
  const pct = calcularPorcentajeCripto(assets)
  return alertas.map((a) =>
    a.id === 'alerta-cripto'
      ? {
          ...a,
          severidad: severidadParaCripto(pct),
          titulo: `Concentración en criptomonedas: ${pct.toFixed(1)}%`,
          descripcion: `Calculado en vivo con los precios actuales. ${
            pct > 25
              ? 'Sigue por encima del límite recomendado (20-25%) para un perfil moderado-alto.'
              : 'Ya está dentro del rango recomendado (20-25%) para un perfil moderado-alto.'
          } ONDO e IO partieron de pérdida total; varias altcoins siguen en pérdidas profundas.`,
        }
      : a,
  )
}

// Señal táctica para posiciones ya clasificadas como "reducir"/"vender":
// compara el P/L en vivo contra el P/L que tenía la posición en el corte
// original (el dataset estático) para detectar si el precio repuntó —
// una buena ventana para ejecutar la salida ya recomendada — o si la
// pérdida se profundizó. No cambia la recomendación en sí (esa refleja un
// juicio estructural: redundancia, tesis débil, etc.), solo añade contexto
// de mercado del momento.
export function señalTacticaSalida(assetVivo: Asset, assetEstatico: Asset): string | null {
  if (assetVivo.tipo !== 'cripto') return null
  if (assetVivo.recomendacion !== 'reducir' && assetVivo.recomendacion !== 'vender') return null
  if (assetEstatico.invertidoCOP === 0) return null

  const plVivo = ((assetVivo.actualCOP - assetVivo.invertidoCOP) / assetVivo.invertidoCOP) * 100
  const plEstatico = ((assetEstatico.actualCOP - assetEstatico.invertidoCOP) / assetEstatico.invertidoCOP) * 100
  const diferencia = plVivo - plEstatico

  if (Math.abs(diferencia) < 5) return null
  if (diferencia > 0) {
    return `El precio repuntó ${diferencia.toFixed(1)} pp desde el corte — buena ventana para ejecutar la salida ya recomendada.`
  }
  return `La pérdida se profundizó ${Math.abs(diferencia).toFixed(1)} pp desde el corte — la recomendación de salida sigue igual de válida.`
}
