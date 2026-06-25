import type { Asset } from '../types/portfolio'
import type { NuevoMovimientoInput, TipoMovimiento } from '../types/movimientos'

export interface InterpretacionMovimiento {
  ok: boolean
  input?: NuevoMovimientoInput
  asset?: Asset
  explicacion: string
  confianza: 'alta' | 'media' | 'baja'
}

const VERBOS_TIPO: { regex: RegExp; tipo: TipoMovimiento }[] = [
  { regex: /\b(compr[eé]|adquir[ií])(?=[\s.,;:]|$)/i, tipo: 'compra' },
  { regex: /\b(vend[ií]|liquid[eé])(?=[\s.,;:]|$)/i, tipo: 'venta' },
  { regex: /\b(aport[eé]|deposit[eé]|consign[eé])(?=[\s.,;:]|$)/i, tipo: 'aporte' },
  { regex: /\b(retir[eé])(?=[\s.,;:]|$)/i, tipo: 'retiro' },
  { regex: /\b(dividendo|dividendos)\b/i, tipo: 'dividendo' },
  { regex: /\b(staking|recompensa[s]?)\b/i, tipo: 'staking' },
  { regex: /\b(split)\b/i, tipo: 'split' },
  { regex: /\b(fusi[oó]n)\b/i, tipo: 'fusion' },
  { regex: /\b(convert[ií](?=[\s.,;:]|$)|conversi[oó]n)\b/i, tipo: 'conversion' },
]

/**
 * Intenta interpretar una frase en español sobre un movimiento de
 * inversión. Es un parser basado en patrones (no un modelo de lenguaje):
 * funciona bien con frases cercanas a los ejemplos ("Compré 0.5 acciones de
 * VOO por 290 USD", "Vendí 50% de mi posición en BTC"), pero no entiende
 * frases arbitrarias. SIEMPRE debe mostrarse como una vista previa para que
 * el usuario confirme antes de aplicar — nunca se aplica directamente.
 */
export function interpretarMovimiento(texto: string, assets: Asset[]): InterpretacionMovimiento {
  const t = texto.trim()
  if (!t) return { ok: false, explicacion: 'Escribe una frase describiendo el movimiento.', confianza: 'baja' }

  let tipo: TipoMovimiento | null = null
  for (const v of VERBOS_TIPO) {
    if (v.regex.test(t)) {
      tipo = v.tipo
      break
    }
  }
  if (!tipo) {
    return { ok: false, explicacion: 'No reconocí qué tipo de movimiento es (compra, venta, aporte, retiro, dividendo, staking, split, fusión o conversión). Usa el formulario manual de abajo para este caso.', confianza: 'baja' }
  }

  // Buscar el activo mencionado: por ticker exacto o por nombre parcial.
  const palabras = t.toUpperCase().match(/[A-ZÁÉÍÓÚÑ0-9.]{2,12}/g) ?? []
  let asset: Asset | undefined
  for (const p of palabras) {
    asset = assets.find((a) => a.ticker.toUpperCase() === p)
    if (asset) break
  }
  if (!asset) {
    for (const a of assets) {
      if (t.toLowerCase().includes(a.nombre.toLowerCase().split(' ')[0])) {
        asset = a
        break
      }
    }
  }

  // Porcentaje (para ventas parciales)
  const pctMatch = t.match(/(\d{1,3})\s*%/)
  const porcentajeVendido = pctMatch ? Number(pctMatch[1]) : undefined

  // Monto + moneda: "290 USD", "$290.000", "290000 COP", "1.200.000"
  const montoUsdMatch = t.match(/(?:usd|u\$s|dólares|dolares)\s*([\d.,]+)|([\d.,]+)\s*(?:usd|u\$s|dólares|dolares)/i)
  const montoCopMatch = t.match(/\$\s*([\d.,]+)|([\d.,]+)\s*(?:cop|pesos)/i)
  let montoTotal: number | undefined
  let moneda: 'COP' | 'USD' = 'COP'
  if (montoUsdMatch) {
    moneda = 'USD'
    montoTotal = Number((montoUsdMatch[1] ?? montoUsdMatch[2]).replace(/\./g, '').replace(',', '.'))
  } else if (montoCopMatch) {
    moneda = 'COP'
    montoTotal = Number((montoCopMatch[1] ?? montoCopMatch[2]).replace(/\./g, '').replace(',', '.'))
  }

  // Cantidad de unidades: "0.5 acciones", "0.01 btc"
  const cantidadMatch = t.match(/(\d+(?:[.,]\d+)?)\s*(?:acciones|unidades|btc|eth|sol|tokens)?/i)
  const cantidad = cantidadMatch ? Number(cantidadMatch[1].replace(',', '.')) : undefined

  if (!asset && tipo !== 'compra' && tipo !== 'aporte' && tipo !== 'retiro') {
    return { ok: false, explicacion: 'Reconocí el tipo de movimiento, pero no identifiqué de qué activo hablas. Menciona el ticker exacto (ej. BTC, VOO, NU).', confianza: 'baja' }
  }

  if ((tipo === 'compra' || tipo === 'venta') && montoTotal === undefined && cantidad === undefined) {
    return { ok: false, explicacion: 'Reconocí el activo y el tipo de movimiento, pero no el monto ni la cantidad. Indica un valor, ej. "por 290 USD" o "por $300.000".', confianza: 'baja' }
  }

  const input: NuevoMovimientoInput = {
    tipo,
    assetId: asset?.id,
    nombreActivoNuevo: asset ? undefined : 'Nuevo activo (completa el nombre)',
    moneda,
    montoTotal,
    cantidad,
    porcentajeVendido: tipo === 'venta' ? porcentajeVendido ?? 100 : undefined,
    eliminarDelPortafolio: true,
  }

  const confianza: 'alta' | 'media' | 'baja' = asset && montoTotal !== undefined ? 'alta' : asset ? 'media' : 'baja'

  const piezas = [
    `Tipo: ${tipo}`,
    asset ? `Activo: ${asset.nombre} (${asset.ticker})` : 'Activo: no identificado — revisa el formulario manual',
    montoTotal !== undefined ? `Monto: ${montoTotal} ${moneda}` : null,
    cantidad !== undefined ? `Cantidad: ${cantidad}` : null,
    porcentajeVendido !== undefined ? `% vendido: ${porcentajeVendido}%` : null,
  ].filter(Boolean)

  return { ok: true, input, asset, explicacion: piezas.join(' · '), confianza }
}
