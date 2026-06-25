import type { Asset, AssetType } from '../types/portfolio'
import type { MovimientoRegistro, NuevoMovimientoInput } from '../types/movimientos'
import { formatCOP, formatPercent } from './format'

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || `activo-${Date.now()}`
  )
}

function nuevoId(): string {
  return `mov-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function crearAssetNuevo(nombre: string, ticker: string, tipo: AssetType, invertidoCOP: number, cantidad?: number): Asset {
  return {
    id: slugify(ticker || nombre),
    nombre,
    ticker: ticker || nombre.toUpperCase(),
    tipo,
    sector: 'Por definir',
    pais: tipo === 'cripto' ? 'Global' : 'Colombia',
    monedaExposicion: tipo === 'cripto' ? 'USD' : 'COP',
    cantidad,
    invertidoCOP,
    actualCOP: invertidoCOP,
    convicción: 'Media',
    riesgo: 'Medio',
    horizonte: '10-25 años',
    funcion: 'Posición agregada manualmente — pendiente de análisis detallado',
    recomendacion: 'mantener',
    tesis: 'Posición agregada desde la sección de Movimientos. Pídele a Claude que complete la tesis, convicción, riesgo y ventajas/riesgos con más contexto sobre este activo.',
    ventajas: [],
    riesgos: [],
  }
}

export interface ResultadoMovimiento {
  assets: Asset[]
  liquidezDelta: number
  resumen: string
  registro: MovimientoRegistro
}

export interface ContextoMovimiento {
  trm: number
}

/**
 * Aplica un movimiento del usuario (de cualquiera de los 9 tipos) sobre el
 * estado actual del portafolio. Devuelve el nuevo arreglo de activos, el
 * cambio en liquidez disponible (COP), un resumen legible, y el registro
 * completo listo para guardarse en el historial/"base de datos" local.
 */
export function aplicarMovimientoRegistro(assets: Asset[], input: NuevoMovimientoInput, ctx: ContextoMovimiento): ResultadoMovimiento {
  const fecha = input.fecha || new Date().toISOString().slice(0, 10)
  const hora = input.hora || new Date().toTimeString().slice(0, 5)
  const comision = input.comision ?? 0

  // Resuelve el monto de la operación en COP, ya incluyendo/descontando
  // comisión según el tipo, y convirtiendo desde USD con la TRM en vivo si aplica.
  function montoEnCOP(bruto: number): number {
    const enMonedaOriginal = input.moneda === 'USD' ? bruto * ctx.trm : bruto
    return Math.round(enMonedaOriginal)
  }

  const montoBase = input.montoTotal ?? (input.cantidad && input.precioUnitario ? input.cantidad * input.precioUnitario : 0)
  const comisionCOP = montoEnCOP(comision)

  const asset = input.assetId ? assets.find((a) => a.id === input.assetId) : undefined
  const nombreActivo = asset?.nombre ?? input.nombreActivoNuevo ?? 'Activo'
  const ticker = asset?.ticker ?? input.tickerNuevo ?? ''

  const base = (registro: Partial<MovimientoRegistro>, montoTotalCOP: number): MovimientoRegistro => ({
    id: nuevoId(),
    fecha,
    hora,
    tipo: input.tipo,
    assetId: input.assetId,
    nombreActivo,
    ticker,
    cantidad: input.cantidad,
    precioUnitario: input.precioUnitario,
    comision: input.comision,
    moneda: input.moneda,
    comentarios: input.comentarios,
    montoTotalCOP,
    ...registro,
  })

  switch (input.tipo) {
    case 'compra': {
      const montoCOP = montoEnCOP(montoBase) + comisionCOP
      if (asset) {
        const nuevaCantidad = input.cantidad !== undefined && asset.cantidad !== undefined ? asset.cantidad + input.cantidad : asset.cantidad
        const actualizado: Asset = { ...asset, invertidoCOP: asset.invertidoCOP + montoCOP, cantidad: nuevaCantidad, actualCOP: asset.actualCOP + montoCOP }
        return {
          assets: assets.map((a) => (a.id === asset.id ? actualizado : a)),
          liquidezDelta: -montoCOP,
          resumen: `Compra: se agregaron ${formatCOP(montoCOP)} a ${asset.nombre}. Invertido total: ${formatCOP(actualizado.invertidoCOP)}.`,
          registro: base({}, montoCOP),
        }
      }
      const nuevo = crearAssetNuevo(input.nombreActivoNuevo || 'Nuevo activo', input.tickerNuevo || '', input.assetTipoNuevo || 'accion', montoCOP, input.cantidad)
      return {
        assets: [...assets, nuevo],
        liquidezDelta: -montoCOP,
        resumen: `Compra: se agregó ${nuevo.nombre} (${nuevo.ticker}) al portafolio con ${formatCOP(montoCOP)} invertidos.`,
        registro: base({ nombreActivo: nuevo.nombre, ticker: nuevo.ticker }, montoCOP),
      }
    }

    case 'venta': {
      if (!asset) return { assets, liquidezDelta: 0, resumen: 'No se encontró el activo para vender.', registro: base({}, 0) }
      const montoRecibido = Math.max(0, montoEnCOP(montoBase) - comisionCOP)
      const pct = Math.min(100, Math.max(1, input.porcentajeVendido ?? 100))

      if (pct >= 100) {
        const ganancia = montoRecibido - asset.invertidoCOP
        const gananciaPct = asset.invertidoCOP > 0 ? (ganancia / asset.invertidoCOP) * 100 : 0
        const mensajeGanancia = `Ganancia/pérdida realizada: ${formatCOP(ganancia)} (${formatPercent(gananciaPct)}).`
        const eliminar = input.eliminarDelPortafolio ?? true
        return {
          assets: eliminar ? assets.filter((a) => a.id !== asset.id) : assets.map((a) => (a.id === asset.id ? { ...a, actualCOP: 0 } : a)),
          liquidezDelta: montoRecibido,
          resumen: `Venta total de ${asset.nombre} por ${formatCOP(montoRecibido)}. ${mensajeGanancia}`,
          registro: base({}, montoRecibido),
        }
      }

      const fraccion = pct / 100
      const costoBaseVendido = asset.invertidoCOP * fraccion
      const ganancia = montoRecibido - costoBaseVendido
      const gananciaPct = costoBaseVendido > 0 ? (ganancia / costoBaseVendido) * 100 : 0
      const actualizado: Asset = {
        ...asset,
        invertidoCOP: Math.round(asset.invertidoCOP * (1 - fraccion)),
        cantidad: asset.cantidad !== undefined ? asset.cantidad * (1 - fraccion) : asset.cantidad,
        actualCOP: Math.max(0, asset.actualCOP - montoRecibido),
      }
      return {
        assets: assets.map((a) => (a.id === asset.id ? actualizado : a)),
        liquidezDelta: montoRecibido,
        resumen: `Venta del ${pct}% de ${asset.nombre} por ${formatCOP(montoRecibido)}. Ganancia/pérdida realizada: ${formatCOP(ganancia)} (${formatPercent(gananciaPct)}).`,
        registro: base({}, montoRecibido),
      }
    }

    case 'aporte': {
      const montoCOP = montoEnCOP(montoBase)
      return { assets, liquidezDelta: montoCOP, resumen: `Aporte de ${formatCOP(montoCOP)} a tu liquidez disponible.`, registro: base({ nombreActivo: 'Liquidez', ticker: '—' }, montoCOP) }
    }

    case 'retiro': {
      const montoCOP = montoEnCOP(montoBase)
      return { assets, liquidezDelta: -montoCOP, resumen: `Retiro de ${formatCOP(montoCOP)} de tu liquidez disponible.`, registro: base({ nombreActivo: 'Liquidez', ticker: '—' }, montoCOP) }
    }

    case 'dividendo': {
      const montoCOP = montoEnCOP(montoBase)
      return {
        assets,
        liquidezDelta: montoCOP,
        resumen: `Dividendo recibido de ${nombreActivo}: ${formatCOP(montoCOP)} (sumado a tu liquidez disponible; no cambia la posición).`,
        registro: base({}, montoCOP),
      }
    }

    case 'staking': {
      if (!asset || input.cantidad === undefined) {
        return { assets, liquidezDelta: 0, resumen: 'Para staking se necesita el activo y la cantidad de tokens recibidos.', registro: base({}, 0) }
      }
      const actualizado: Asset = { ...asset, cantidad: (asset.cantidad ?? 0) + input.cantidad }
      return {
        assets: assets.map((a) => (a.id === asset.id ? actualizado : a)),
        liquidezDelta: 0,
        resumen: `Staking recibido en ${asset.nombre}: +${input.cantidad} unidades (costo base $0, recompensa libre).`,
        registro: base({}, 0),
      }
    }

    case 'split': {
      if (!asset || !input.factorSplit || input.factorSplit <= 0) {
        return { assets, liquidezDelta: 0, resumen: 'Para un split se necesita el activo y el factor (ej. 2 para 2x1).', registro: base({}, 0) }
      }
      const actualizado: Asset = { ...asset, cantidad: asset.cantidad !== undefined ? asset.cantidad * input.factorSplit : asset.cantidad }
      return {
        assets: assets.map((a) => (a.id === asset.id ? actualizado : a)),
        liquidezDelta: 0,
        resumen: `Split ${input.factorSplit}x aplicado a ${asset.nombre}. El valor total de la posición no cambia.`,
        registro: base({}, 0),
      }
    }

    case 'fusion':
    case 'conversion': {
      if (!asset) return { assets, liquidezDelta: 0, resumen: 'No se encontró el activo de origen para la conversión.', registro: base({}, 0) }
      const valorResultanteCOP = montoEnCOP(montoBase) || asset.actualCOP
      let nuevosAssets = assets.filter((a) => a.id !== asset.id)
      let nombreDestinoFinal = input.nombreDestinoNuevo ?? ''
      if (input.assetDestinoId) {
        const destino = assets.find((a) => a.id === input.assetDestinoId)
        if (destino) {
          nombreDestinoFinal = destino.nombre
          const actualizado: Asset = {
            ...destino,
            invertidoCOP: destino.invertidoCOP + asset.invertidoCOP,
            cantidad: input.cantidadDestino !== undefined && destino.cantidad !== undefined ? destino.cantidad + input.cantidadDestino : destino.cantidad,
            actualCOP: destino.actualCOP + valorResultanteCOP,
          }
          nuevosAssets = nuevosAssets.map((a) => (a.id === destino.id ? actualizado : a))
        }
      } else {
        const nuevo = crearAssetNuevo(input.nombreDestinoNuevo || `${asset.nombre} (convertido)`, input.tickerDestinoNuevo || '', asset.tipo, asset.invertidoCOP, input.cantidadDestino)
        nuevo.actualCOP = valorResultanteCOP
        nombreDestinoFinal = nuevo.nombre
        nuevosAssets = [...nuevosAssets, nuevo]
      }
      return {
        assets: nuevosAssets,
        liquidezDelta: 0,
        resumen: `${input.tipo === 'fusion' ? 'Fusión' : 'Conversión'}: ${asset.nombre} → ${nombreDestinoFinal}, valor trasladado ${formatCOP(valorResultanteCOP)}.`,
        registro: base({ nombreDestino: nombreDestinoFinal }, valorResultanteCOP),
      }
    }
  }
}
